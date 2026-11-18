import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { after, before, test, mock } from 'node:test';
import { deleteApp, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword, signInWithCredential, GoogleAuthProvider, createUserWithEmailAndPassword } from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';
import { auth, bucket, db, makeAccount, password, projectId } from './emulatorFixture.mjs';

const apps = [];
async function client(uid, isAdmin = false) {
  const app = initializeApp({ projectId, apiKey: 'demo-key', storageBucket: bucket }, uid);
  apps.push(app);
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  if (uid !== 'workflow-public') {
    const email = await makeAccount(uid, isAdmin);
    await signInWithEmailAndPassword(auth, email, password);
  }
  const functions = getFunctions(app);
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  return async (name, data) => (await httpsCallable(functions, name)(data)).data;
}

const event = (id, data = {}) => db.doc(`events/${id}`).set({
  title: 'Test event', date: '2090-12-31', status: 'upcoming', isPublic: true,
  maxParticipants: 1, registeredCount: 0, ...data,
});

let first, second, administrator, anonymous;
before(async () => {
  [first, second, administrator, anonymous] = await Promise.all([
    client('workflow-first'), client('workflow-second'), client('workflow-admin', true), client('workflow-public'),
  ]);
});
after(() => Promise.all(apps.map(deleteApp)));

test('concurrent registration honors capacity and retrying cancellation keeps counts correct', async () => {
  const eventId = 'workflow-capacity';
  await event(eventId, { registrationCountVersion: 2 });
  const results = await Promise.allSettled([
    first('registerForEvent', { eventId }), second('registerForEvent', { eventId }),
  ]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(results.find(result => result.status === 'rejected').reason.code, 'functions/resource-exhausted');
  const winner = results[0].status === 'fulfilled' ? first : second;
  assert.equal((await winner('registerForEvent', { eventId })).changed, false);
  assert.equal((await db.doc(`events/${eventId}`).get()).get('registeredCount'), 1);
  await winner('cancelEventRegistration', { eventId });
  assert.equal((await winner('cancelEventRegistration', { eventId })).changed, false);
  assert.equal((await db.doc(`events/${eventId}`).get()).get('registeredCount'), 0);
});

test('registration checks deadlines, visibility and legacy duplicate capacity', async () => {
  await event('workflow-deadline', { registrationDeadline: '2000-01-01' });
  await event('workflow-private', { isPublic: false });
  await event('workflow-legacy');
  await Promise.all(['one', 'two'].map(key => db.doc(`eventRegistrations/workflow-legacy-${key}`).set({
    eventId: 'workflow-legacy', userId: 'workflow-first',
  })));
  await assert.rejects(first('registerForEvent', { eventId: 'workflow-deadline' }), { code: 'functions/deadline-exceeded' });
  await assert.rejects(first('registerForEvent', { eventId: 'workflow-private' }), { code: 'functions/failed-precondition' });
  await assert.rejects(second('registerForEvent', { eventId: 'workflow-legacy' }), { code: 'functions/resource-exhausted' });
  await first('cancelEventRegistration', { eventId: 'workflow-legacy' });
  assert.equal((await db.doc('events/workflow-legacy').get()).get('registeredCount'), 0);
});

test('report decisions award points once and publish only verified quantities', async () => {
  const reportId = 'workflow-report';
  await db.doc(`impactReports/${reportId}`).set({
    status: 'pending', userId: 'workflow-first', activityType: 'cleanup', description: 'A local test',
    wasteAmount: '2.5', treesPlanted: '2',
  });
  const decision = { reportId, decision: 'approved' };
  await assert.rejects(first('reviewImpactReport', decision), { code: 'functions/permission-denied' });
  const results = await Promise.all([administrator('reviewImpactReport', decision), administrator('reviewImpactReport', decision)]);
  assert.equal(results.filter(result => result.changed).length, 1);
  assert.equal((await db.doc('users/workflow-first').get()).get('greenPoints'), 30);
  await assert.rejects(administrator('reviewImpactReport', { reportId, decision: 'rejected' }), { code: 'functions/failed-precondition' });
  await db.doc('impactReports/workflow-old-approved').set({
    status: 'approved', verifiedImpact: true, wasteAmount: 9999, treesPlanted: 9999,
  });
  await administrator('refreshPublicStats', {});
  const stats = (await db.doc('publicStats/overview').get()).data();
  assert.equal(stats.wasteKg, 2.5);
  assert.equal(stats.treesPlanted, 2);
  assert.equal('userId' in stats, false);
});

test('attendance retries and corrections use the recorded points amount', async () => {
  const eventId = 'workflow-attendance';
  const userId = 'workflow-second';
  await event(eventId, { date: '2000-01-01', pointsReward: 25 });
  await db.doc('eventRegistrations/workflow-attendance').set({ eventId, userId });
  const mark = attended => administrator('markEventAttendance', { eventId, userId, attended });
  const results = await Promise.all([mark(true), mark(true)]);
  assert.equal(results.reduce((sum, result) => sum + result.pointsDelta, 0), 25);
  await db.doc(`events/${eventId}`).update({ pointsReward: 100 });
  assert.equal((await mark(false)).pointsDelta, -25);
  assert.equal((await db.doc(`users/${userId}`).get()).get('greenPoints'), 0);
  assert.equal((await mark(true)).pointsDelta, 25);
});

test('anonymous inquiries have a honeypot and a rate limit', async () => {
  const inquiry = { name: 'Local test', email: 'workflow@example.test', organization: '', message: 'Test message', website: '' };
  await anonymous('submitPartnerInquiry', { ...inquiry, website: 'filled' });
  for (let i = 0; i < 3; i++) await anonymous('submitPartnerInquiry', inquiry);
  await assert.rejects(anonymous('submitPartnerInquiry', inquiry), { code: 'functions/resource-exhausted' });
  assert.equal((await db.collection('partnerMessages').where('email', '==', inquiry.email).count().get()).data().count, 3);
});

test('admin callables deny self-role changes, and event deletion removes registrations', async () => {
  await assert.rejects(administrator('updateUserRole', { userId: 'workflow-admin', role: 'member' }),
    { code: 'functions/failed-precondition' });
  const eventId = 'workflow-delete';
  await event(eventId);
  await first('registerForEvent', { eventId });
  await administrator('deleteEvent', { eventId });
  assert.equal((await db.doc(`events/${eventId}`).get()).exists, false);
  assert.equal((await db.collection('eventRegistrations').where('eventId', '==', eventId).get()).empty, true);
  assert.equal((await administrator('deleteEvent', { eventId })).deleted, true);
});

test('legacy impact verification adds reviewed quantities without awarding points again', async () => {
  const reportId = 'workflow-legacy-report';
  await db.doc(`impactReports/${reportId}`).set({
    status: 'approved', userId: 'workflow-first', activityType: 'tree_planting',
    description: 'Legacy evidence fixture', wasteAmount: '', treesPlanted: '3',
  });
  assert.equal((await administrator('verifyLegacyImpactReport', { reportId })).changed, true);
  assert.equal((await administrator('verifyLegacyImpactReport', { reportId })).changed, false);
  assert.equal((await db.doc('users/workflow-first').get()).get('greenPoints'), 30);
  await administrator('refreshPublicStats', {});
  assert.equal((await db.doc('publicStats/overview').get()).get('treesPlanted'), 5);
});

test('account deletion clears registrations and private submissions and can be retried', async () => {
  const uid = 'workflow-delete-account';
  const member = await client(uid);
  const eventId = 'workflow-account-event';
  await event(eventId, { registrationCountVersion: 2 });
  await member('registerForEvent', { eventId });
  const pending = db.doc('impactReports/workflow-account-report');
  await pending.set({ status: 'pending', userId: uid });
  await administrator('deleteUser', { userId: uid });
  assert.equal((await db.doc(`users/${uid}`).get()).get('isActive'), false);
  assert.equal((await db.doc(`users/${uid}`).get()).get('name'), undefined);
  assert.equal((await db.doc(`events/${eventId}`).get()).get('registeredCount'), 0);
  assert.equal((await pending.get()).exists, false);
  assert.equal((await administrator('deleteUser', { userId: uid })).success, true);
});


test('role transitions validate input and deny a demoted administrator with an old token', async () => {
  const userId = 'workflow-role-member';
  await client(userId);
  await assert.rejects(administrator('updateUserRole', { userId, role: 'owner' }),
    { code: 'functions/invalid-argument' });
  await administrator('updateUserRole', { userId, role: 'admin' });
  assert.equal((await auth.getUser(userId)).customClaims.admin, true);
  assert.equal((await db.doc(`users/${userId}`).get()).get('role'), 'admin');

  const demoted = await client('workflow-role-admin', true);
  await administrator('updateUserRole', { userId: 'workflow-role-admin', role: 'member' });
  await assert.rejects(demoted('refreshPublicStats', {}), { code: 'functions/permission-denied' });
});


test('missing profiles initialize concurrently without accepting managed fields or overwriting data', async () => {
  const uid = 'initialization-existing';
  await auth.importUsers([{ uid, email: uid + '@example.test' }]);
  await auth.updateUser(uid, { password });
  const member = await client(uid);
  await db.doc(`users/${uid}`).delete();
  await db.doc('pointAwards/initialization-verified').set({ userId: uid, type: 'impact', points: 125 });
  await assert.rejects(member('initializeMyProfile', { greenPoints: 999 }), { code: 'functions/invalid-argument' });
  await assert.rejects(anonymous('initializeMyProfile', {}), { code: 'functions/unauthenticated' });
  const results = await Promise.all(Array.from({ length: 4 }, () => member('initializeMyProfile', {})));
  assert.equal(results.filter(result => result.created).length, 1);
  const ref = db.doc(`users/${uid}`);
  assert.equal((await ref.get()).get('name'), '');
  assert.equal((await ref.get()).get('greenPoints'), 125);
  await assert.rejects(member('registerForEvent', { eventId: 'workflow-capacity' }), { code: 'functions/permission-denied' });
  await ref.update({ name: 'Completed', branch: 'Test', greenPoints: 485 });
  const require = createRequire(import.meta.url);
  const { assignMemberRole } = require('../functions/profileInitialization.js');
  const before = (await ref.get()).data();
  await assignMemberRole.run({ uid });
  await member('initializeMyProfile', {});
  assert.deepEqual((await ref.get()).data(), before);
});

test('administrator initialization preserves Auth claims and disabled accounts are denied', async () => {
  const uid = 'initialization-admin';
  const administrator = await client(uid, true);
  await auth.setCustomUserClaims(uid, { admin: true, role: 'admin', customFlag: 'preserve' });
  await db.doc(`users/${uid}`).delete();
  await administrator('initializeMyProfile', {});
  assert.equal((await db.doc(`users/${uid}`).get()).get('role'), 'admin');
  assert.deepEqual((await auth.getUser(uid)).customClaims, { admin: true, role: 'admin', customFlag: 'preserve' });
  const disabledId = 'initialization-disabled';
  const disabled = await client(disabledId);
  await db.doc(`users/${disabledId}`).delete();
  await auth.updateUser(disabledId, { disabled: true });
  await assert.rejects(disabled('initializeMyProfile', {}));
  assert.equal((await db.doc(`users/${disabledId}`).get()).exists, false);
  assert.equal((await auth.getUser(disabledId)).disabled, true);
});

test('a missed creation trigger is repaired on authenticated initialization', async () => {
  const uid = 'initialization-google';
  const member = await client(uid);
  await auth.updateUser(uid, { providerToLink: { providerId: 'google.com', uid: 'synthetic-google-subject', email: 'synthetic-google@example.test' } });
  await db.doc(`users/${uid}`).delete();
  const require = createRequire(import.meta.url);
  const { assignMemberRole } = require('../functions/profileInitialization.js');
  await member('initializeMyProfile', {});
  const before = (await db.doc(`users/${uid}`).get()).data();
  await assignMemberRole.run({ uid });
  assert.deepEqual((await db.doc(`users/${uid}`).get()).data(), before);
});


test('new email and first Google authentication initialize through the same workflow', async () => {
  for (const provider of ['email', 'google']) {
    const app = initializeApp({ projectId, apiKey: 'demo-key' }, 'new-provider-' + provider);
    apps.push(app);
    const clientAuth = getAuth(app);
    connectAuthEmulator(clientAuth, 'http://127.0.0.1:9099', { disableWarnings: true });
    let result;
    if (provider === 'email') {
      result = await createUserWithEmailAndPassword(clientAuth, 'fresh-email@example.test', password);
    } else {
      const encode = object => Buffer.from(JSON.stringify(object)).toString('base64url');
      const token = encode({ alg: 'none', typ: 'JWT' }) + '.' + encode({
        sub: 'fresh-google-subject', iss: 'https://accounts.google.com', aud: 'demo-client',
        email: 'fresh-google@example.test', email_verified: true,
        iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600,
      }) + '.';
      result = await signInWithCredential(clientAuth, GoogleAuthProvider.credential(token));
    }
    const functions = getFunctions(app);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    await httpsCallable(functions, 'initializeMyProfile')({});
    const profile = (await db.doc('users/' + result.user.uid).get()).data();
    assert.equal(profile.role, 'member');
    assert.equal(profile.greenPoints, 0);
    assert.equal(profile.isActive, true);
  }
});


test('first login recovers after a creation handler write failure', async () => {
  const uid = 'initialization-trigger-failure';
  await auth.importUsers([{ uid, email: uid + '@example.test' }]);
  await auth.updateUser(uid, { password });
  const member = await client(uid);
  await db.doc(`users/${uid}`).delete();
  const require = createRequire(import.meta.url);
  const { assignMemberRole } = require('../functions/profileInitialization.js');
  const failure = mock.method(db, 'runTransaction', async () => { throw new Error('Simulated transient write failure'); });
  try {
    await assert.rejects(assignMemberRole.run({ uid }), /Simulated transient write failure/);
  } finally {
    failure.mock.restore();
  }
  await member('initializeMyProfile', {});
  assert.equal((await db.doc(`users/${uid}`).get()).exists, true);
});
