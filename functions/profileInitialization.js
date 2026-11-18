const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const { https, runWith } = require('firebase-functions/v1');
const { actorId, fail } = require('./lib/access.cjs');

async function initializeProfile(uid) {
  const account = await getAuth().getUser(uid);
  if (account.disabled) return { created: false, disabled: true };
  const ref = getFirestore().collection('users').doc(uid);
  return getFirestore().runTransaction(async transaction => {
    const existing = await transaction.get(ref);
    if (existing.exists) return { created: false };
    const awards = await transaction.get(getFirestore().collection('pointAwards').where('userId', '==', uid));
    let greenPoints = 0;
    for (const award of awards.docs) {
      const points = award.get('points');
      if (points === undefined && award.get('legacyVerification') === true) continue;
      if (!Number.isSafeInteger(points) || points < 0) {
        fail('failed-precondition', 'An administrator must review your award history before initialization.');
      }
      greenPoints += points;
    }
    if (!Number.isSafeInteger(greenPoints)) fail('failed-precondition', 'Your points balance requires review.');
    const claims = account.customClaims ?? {};
    transaction.create(ref, {
      role: claims.admin === true ? 'admin' : 'member',
      isActive: true,
      greenPoints,
      name: '',
      branch: '',
      interests: [],
      createdAt: Timestamp.fromDate(new Date(account.metadata.creationTime)),
      initializedAt: FieldValue.serverTimestamp(),
    });
    return { created: true };
  });
}

exports.assignMemberRole = runWith({ failurePolicy: true }).auth.user().onCreate(user => initializeProfile(user.uid));
exports.initializeMyProfile = https.onCall(async (data, context) => {
  if (data && Object.keys(data).length) fail('invalid-argument', 'Profile initialization accepts no fields.');
  const result = await initializeProfile(actorId(context));
  if (result.disabled) fail('permission-denied', 'This account is disabled.');
  return result;
});
