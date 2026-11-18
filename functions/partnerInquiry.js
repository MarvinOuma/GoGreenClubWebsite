const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const { createHmac } = require('node:crypto');
const { https, runWith } = require('firebase-functions/v1');

const limits = { name: 80, email: 200, organization: 120, message: 2000, website: 200 };
const hour = 60 * 60 * 1000;
const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';

exports.submitPartnerInquiry = runWith({
  secrets: isEmulator ? [] : ['PARTNER_RATE_KEY'],
  maxInstances: 10,
}).https.onCall(async (data, context) => {
  // The SDK verifies App Check tokens before the handler. Read the policy at
  // invocation so a project-specific Functions environment controls enforcement.
  if (!isEmulator && process.env.PARTNER_ENFORCE_APP_CHECK !== 'false' && !context.app) {
    throw new https.HttpsError('unauthenticated', 'Could not verify the app. Refresh the page and try again.');
  }
  if (!data || Object.keys(data).some(key => !Object.hasOwn(limits, key)) ||
      Object.entries(limits).some(([key, max]) => typeof data[key] !== 'string' || data[key].length > max)) {
    throw new https.HttpsError('invalid-argument', 'Please check the inquiry fields.');
  }
  const name = data.name.trim();
  const email = data.email.trim();
  const organization = data.organization.trim();
  const message = data.message.trim();
  if (data.website) return { accepted: true };
  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new https.HttpsError('invalid-argument', 'Enter your name, a valid email, and a message.');
  }

  const key = process.env.PARTNER_RATE_KEY || (isEmulator ? 'emulator-only-key' : '');
  const ip = context.rawRequest.ip || context.rawRequest.socket?.remoteAddress ||
    (isEmulator ? 'local-emulator' : '');
  if (!key || !ip) {
    throw new https.HttpsError('unavailable', 'The inquiry form is temporarily unavailable.');
  }

  const db = getFirestore();
  const now = Date.now();
  const window = Math.floor(now / hour);
  const digest = value => createHmac('sha256', key).update(value).digest('hex');
  const counters = [
    { ref: db.collection('partnerRateLimits').doc(`${window}-ip-${digest(ip)}`), max: 5 },
    { ref: db.collection('partnerRateLimits').doc(`${window}-email-${digest(email.toLowerCase())}`), max: 3 },
    { ref: db.collection('partnerRateLimits').doc(`${window}-global`), max: 100 },
  ];
  await db.runTransaction(async transaction => {
    const snapshots = await transaction.getAll(...counters.map(({ ref }) => ref));
    if (snapshots.some((snapshot, i) => (snapshot.get('count') ?? 0) >= counters[i].max)) {
      throw new https.HttpsError('resource-exhausted', 'Too many inquiries. Please try again later.');
    }
    for (const { ref } of counters) {
      transaction.set(ref, {
        count: FieldValue.increment(1),
        expiresAt: Timestamp.fromMillis((window + 2) * hour),
      }, { merge: true });
    }
    transaction.create(db.collection('partnerMessages').doc(), {
      name, email, organization, message, source: 'home', status: 'new',
      createdAt: FieldValue.serverTimestamp(),
    });
  });
  return { accepted: true };
});
