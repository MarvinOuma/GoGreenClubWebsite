const { auth, https } = require('firebase-functions/v1');
const { active, admin, documentId, fail, requireAdmin } = require('./lib/access.cjs');
const { removeAccountRegistrations } = require('./eventWorkflows').internals;

const stamp = () => admin.firestore.FieldValue.serverTimestamp();

exports.assignMemberRole = auth.user().onCreate(async (user) => {
  const db = admin.firestore();
  const ref = db.collection('users').doc(user.uid);
  await db.runTransaction(async transaction => {
    const profile = await transaction.get(ref);
    const defaults = {
      role: 'member', isActive: true, greenPoints: 0, createdAt: stamp(),
      ...(user.email ? { email: user.email } : {}),
    };
    const missing = Object.fromEntries(Object.entries(defaults).filter(([key]) => profile.get(key) === undefined));
    transaction.set(ref, missing, { merge: true });
  });
});

const accountChange = (operation) => https.onCall(async (data, context) => {
  const uid = documentId(data?.userId);
  const role = operation === 'promote' ? 'admin' : data?.role;
  if (operation === 'role' && !['admin', 'member'].includes(role)) {
    fail('invalid-argument', 'Choose a valid role.');
  }
  const changesRole = operation === 'role' || operation === 'promote';
  const action = changesRole ? role : operation;
  const db = admin.firestore();
  const profileRef = db.collection('users').doc(uid);
  const auditRef = db.collection('accountAudit').doc();
  const auditId = await db.runTransaction(async transaction => {
    const actor = await requireAdmin(transaction, db, context);
    if (actor === uid) fail('failed-precondition', 'Ask another administrator to manage your account.');
    const profile = await transaction.get(profileRef);
    if (!profile.exists) fail('not-found', 'Member profile not found.');
    if (profile.get('accountOperation')) {
      if (profile.get('accountOperation') === action) return profile.get('accountAuditId');
      fail('failed-precondition', 'Finish the account operation already in progress.');
    }
    if (changesRole && !active(profile)) fail('failed-precondition', 'Enable the account before changing its role.');

    const restriction = {};
    if (action === 'member') restriction.adminRevoked = true;
    if (action === 'disable' || action === 'delete') restriction.isActive = false;
    if (action === 'delete') restriction.deleting = true;
    transaction.update(profileRef, { ...restriction, accountOperation: action, accountAuditId: auditRef.id });
    transaction.create(auditRef, { action, actor, userId: uid, startedAt: stamp() });
    return auditRef.id;
  });

  const userAuth = admin.auth();
  if (changesRole) {
    const user = await userAuth.getUser(uid);
    await userAuth.setCustomUserClaims(uid, { ...user.customClaims, role, admin: role === 'admin' });
    await userAuth.revokeRefreshTokens(uid);
  } else if (action === 'delete') {
    await userAuth.updateUser(uid, { disabled: true }).catch(error => {
      if (error.code !== 'auth/user-not-found') throw error;
    });
    await removeAccountRegistrations(db, uid);
    await clearMemberRecords(db, uid);
    await admin.storage().bucket().deleteFiles({ prefix: `profiles/${uid}/` });
    await userAuth.deleteUser(uid).catch(error => {
      if (error.code !== 'auth/user-not-found') throw error;
    });
  } else {
    await userAuth.updateUser(uid, { disabled: action === 'disable' });
    if (action === 'disable') await userAuth.revokeRefreshTokens(uid);
  }
  await db.runTransaction(async transaction => {
    const profile = await transaction.get(profileRef);
    if (profile.get('accountAuditId') !== auditId) return;
    if (action === 'delete') {
      // Keep a non-identifying-by-content tombstone at the same path to deny stale ID tokens.
      transaction.set(profileRef, { isActive: false, adminRevoked: true, deletedAt: stamp() });
    } else {
      transaction.update(profileRef, {
        ...(changesRole ? { role, adminRevoked: role !== 'admin' } : { isActive: action === 'enable' }),
        accountOperation: admin.firestore.FieldValue.delete(), accountAuditId: admin.firestore.FieldValue.delete(),
      });
    }
    transaction.update(db.collection('accountAudit').doc(auditId), { completedAt: stamp() });
  });
  return { success: true };
});

async function clearMemberRecords(db, uid) {
  for (const collection of ['impactReports', 'pointAwards']) {
    let page;
    do {
      page = await db.collection(collection).where('userId', '==', uid).limit(400).get();
      if (page.empty) break;
      const batch = db.batch();
      for (const record of page.docs) {
        if (collection === 'pointAwards' || record.get('status') === 'approved') {
          batch.update(record.ref, {
            userId: admin.firestore.FieldValue.delete(),
            description: admin.firestore.FieldValue.delete(),
          });
        } else {
          batch.delete(record.ref);
        }
      }
      await batch.commit();
    } while (!page.empty);
  }
}

exports.promoteToAdmin = accountChange('promote');
exports.updateUserRole = accountChange('role');
exports.disableUser = accountChange('disable');
exports.enableUser = accountChange('enable');
exports.deleteUser = accountChange('delete');
