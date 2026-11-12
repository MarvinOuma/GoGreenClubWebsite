const { createHmac } = require('node:crypto');
const admin = require('firebase-admin');
const { https, runWith } = require('firebase-functions/v1');

const limits = { name: 80, email: 200, organization: 120, message: 2000, website: 200 };
const hour = 60 * 60 * 1000;

exports.submitPartnerInquiry = runWith({
  enforceAppCheck: process.env.PARTNER_ENFORCE_APP_CHECK === 'true',
  maxInstances: 10,
}).https.onCall(async (data, context) => {
  if (!data || Object.keys(data).some(key => !(key in limits)) ||
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

  const key = process.env.PARTNER_RATE_KEY ||
    (process.env.FUNCTIONS_EMULATOR === 'true' ? 'emulator-only-key' : '');
  const ip = context.rawRequest.ip;
  if (!key || !ip) {
    throw new https.HttpsError('unavailable', 'The inquiry form is temporarily unavailable.');
  }

  const db = admin.firestore();
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
        count: admin.firestore.FieldValue.increment(1),
        expiresAt: admin.firestore.Timestamp.fromMillis((window + 2) * hour),
      }, { merge: true });
    }
    transaction.create(db.collection('partnerMessages').doc(), {
      name, email, organization, message, source: 'home', status: 'new',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
  return { accepted: true };
});
