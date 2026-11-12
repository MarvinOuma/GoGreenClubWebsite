const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Automatically assign 'member' role to new users
exports.assignMemberRole = functions.auth.user().onCreate(async (user) => {
  try {
    await admin.auth().setCustomUserClaims(user.uid, {
      role: 'member',
      admin: false
    });

    await admin.firestore().collection('users').doc(user.uid).set({
      email: user.email,
      role: 'member',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`Assigned member role to user: ${user.uid}`);
    
    return {
      success: true,
      message: 'Member role assigned successfully'
    };
  } catch (error) {
    console.error('Error assigning role:', error);
    throw new functions.https.HttpsError('internal', 'Failed to assign role');
  }
});

// Callable function to promote user to admin (must be called by existing admin)
exports.promoteToAdmin = functions.https.onCall(async (data, context) => {
  // Check if requester is admin
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can promote users'
    );
  }

  const { userId } = data;

  try {
    await admin.auth().setCustomUserClaims(userId, {
      role: 'admin',
      admin: true
    });

    console.log(`Promoted user ${userId} to admin`);
    
    return {
      success: true,
      message: 'User promoted to admin successfully'
    };
  } catch (error) {
    console.error('Error promoting user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to promote user');
  }
});

// Update user role (admin only)
exports.updateUserRole = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can update roles');
  }

  const { userId, role } = data;

  if (!userId || !role) {
    throw new functions.https.HttpsError('invalid-argument', 'userId and role are required');
  }

  try {
    const isAdmin = role === 'admin';
    await admin.auth().setCustomUserClaims(userId, { role, admin: isAdmin });
    await admin.firestore().collection('users').doc(userId).update({ role });

    return { success: true, message: `Role updated to ${role}` };
  } catch (error) {
    console.error('Error updating role:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update role');
  }
});

// Disable user account (admin only)
exports.disableUser = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can disable users');
  }

  const { userId } = data;

  try {
    await admin.auth().updateUser(userId, { disabled: true });
    await admin.firestore().collection('users').doc(userId).update({ isActive: false });

    return { success: true, message: 'User disabled successfully' };
  } catch (error) {
    console.error('Error disabling user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to disable user');
  }
});

// Enable user account (admin only)
exports.enableUser = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can enable users');
  }

  const { userId } = data;

  try {
    await admin.auth().updateUser(userId, { disabled: false });
    await admin.firestore().collection('users').doc(userId).update({ isActive: true });

    return { success: true, message: 'User enabled successfully' };
  } catch (error) {
    console.error('Error enabling user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to enable user');
  }
});

// Delete user (admin only)
exports.deleteUser = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can delete users');
  }

  const { userId } = data;

  if (userId === context.auth.uid) {
    throw new functions.https.HttpsError('invalid-argument', 'Cannot delete yourself');
  }

  try {
    await admin.auth().deleteUser(userId);
    await admin.firestore().collection('users').doc(userId).delete();

    return { success: true, message: 'User deleted successfully' };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to delete user');
  }
});

exports.submitPartnerInquiry = require('./partnerInquiry').submitPartnerInquiry;
