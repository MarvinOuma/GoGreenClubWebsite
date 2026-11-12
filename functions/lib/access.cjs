const admin = require('firebase-admin');
const { https } = require('firebase-functions/v1');

const fail = (code, message) => { throw new https.HttpsError(code, message); };

function documentId(id) {
  if (typeof id !== 'string' || !id || id === '.' || id === '..' ||
      id.includes('/') || /^__.*__$/.test(id) || Buffer.byteLength(id) > 500) {
    fail('invalid-argument', 'Invalid record ID.');
  }
  return id;
}

function actorId(context) {
  if (!context.auth) fail('unauthenticated', 'Sign in to continue.');
  return context.auth.uid;
}

function active(profile) {
  return profile.exists && profile.get('isActive') !== false && !profile.get('deleting');
}

async function requireAdmin(transaction, db, context) {
  const uid = actorId(context);
  if (context.auth.token.admin !== true) fail('permission-denied', 'Administrator access is required.');
  const profile = await transaction.get(db.collection('users').doc(uid));
  if (profile.exists && (!active(profile) || profile.get('adminRevoked') === true)) {
    fail('permission-denied', 'Administrator access is required.');
  }
  return uid;
}

module.exports = { active, actorId, admin, documentId, fail, requireAdmin };
