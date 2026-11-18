import { after, before, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, deleteField, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';

const projectId = 'demo-gogreen';
const profile = { name: 'Test Member', branch: 'Testing', interests: ['Recycling'] };
const report = () => ({
  activityType: 'recycling', wasteAmount: 12.5, treesPlanted: 2,
  description: 'A test report.', userId: 'rules-member', status: 'pending', createdAt: serverTimestamp(),
});

let env;
before(async () => {
  env = await initializeTestEnvironment({
    projectId,
    firestore: { rules: await readFile('firestore.rules', 'utf8') },
    storage: { rules: await readFile('storage.rules', 'utf8') },
  });
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await Promise.all([
      setDoc(doc(db, 'users/rules-member'), profile),
      setDoc(doc(db, 'users/rules-incomplete'), { name: '', branch: '', interests: [], isActive: true }),
      setDoc(doc(db, 'users/rules-other'), { ...profile, isActive: false }),
      setDoc(doc(db, 'users/rules-revoked'), { adminRevoked: true }),
      setDoc(doc(db, 'events/rules-event'), { isPublic: true, registeredCount: 0 }),
      setDoc(doc(db, 'events/rules-private'), { isPublic: false }),
      setDoc(doc(db, 'posts/rules-post'), { isPublished: true }),
      setDoc(doc(db, 'posts/rules-draft'), { isPublished: false }),
      setDoc(doc(db, 'impactReports/rules-approved'), { userId: 'rules-other', status: 'approved' }),
      setDoc(doc(db, 'publicStats/overview'), { activeMembers: 2 }),
      setDoc(doc(db, 'partnerMessages/rules-message'), { status: 'new' }),
    ]);
  });
});
after(async () => env?.cleanup());

test('public access is limited to published content and the aggregate document', async () => {
  const db = env.unauthenticatedContext().firestore();
  for (const path of ['events/rules-event', 'posts/rules-post', 'publicStats/overview']) {
    await assertSucceeds(getDoc(doc(db, path)));
  }
  for (const path of ['users/rules-member', 'events/rules-private', 'posts/rules-draft', 'impactReports/rules-approved', 'partnerMessages/rules-message']) {
    await assertFails(getDoc(doc(db, path)));
  }
  await assertFails(getDocs(collection(db, 'users')));
  await assertFails(getDocs(collection(db, 'publicStats')));
  await assertFails(setDoc(doc(db, 'partnerMessages/rules-anonymous'), { status: 'new' }));
  await assertFails(setDoc(doc(db, 'publicStats/overview'), { activeMembers: 99 }));
  await assertSucceeds(getDocs(query(collection(db, 'events'), where('isPublic', '==', true))));
});

test('members can onboard and edit profile text without changing managed fields', async () => {
  const fresh = env.authenticatedContext('rules-new').firestore();
  await assertFails(setDoc(doc(fresh, 'users/rules-new'), profile));
  const db = env.authenticatedContext('rules-member').firestore();
  const self = doc(db, 'users/rules-member');
  await assertSucceeds(updateDoc(self, { name: 'Updated member' }));
  for (const patch of [
    { name: 'Valid', greenPoints: 5 }, { role: 'admin' }, { isActive: true },
    { name: deleteField() }, { interests: [5] }, { interests: ['x'.repeat(81)] },
  ]) await assertFails(updateDoc(self, patch));
  await assertFails(getDocs(collection(db, 'users')));
  await assertFails(getDoc(doc(db, 'users/rules-other')));
});

test('member reports require a pending state, valid fields, and server timestamps', async () => {
  const db = env.authenticatedContext('rules-member').firestore();
  await assertSucceeds(setDoc(doc(db, 'impactReports/rules-pending'), report()));
  await assertSucceeds(getDocs(query(collection(db, 'impactReports'), where('userId', '==', 'rules-member'))));
  await assertFails(getDocs(collection(db, 'impactReports')));
  for (const patch of [
    { status: 'approved' }, { status: 'rejected' }, { pointsAwarded: 1 },
    { wasteAmount: 10001 }, { wasteAmount: -1 }, { treesPlanted: 1.5 },
    { userId: 'rules-other' }, { createdAt: new Date(0) }, { activityType: 'unknown' },
  ]) await assertFails(setDoc(doc(db, 'impactReports/rules-invalid'), { ...report(), ...patch }));
  const inactive = env.authenticatedContext('rules-other').firestore();
  await assertFails(setDoc(doc(inactive, 'impactReports/rules-inactive'), { ...report(), userId: 'rules-other' }));
});

test('an initialized account must complete onboarding before member submissions', async () => {
  const db = env.authenticatedContext('rules-incomplete').firestore();
  await assertFails(setDoc(doc(db, 'impactReports/rules-incomplete'), { ...report(), userId: 'rules-incomplete' }));
  await assertSucceeds(updateDoc(doc(db, 'users/rules-incomplete'), profile));
  await assertSucceeds(setDoc(doc(db, 'impactReports/rules-completed'), { ...report(), userId: 'rules-incomplete' }));
});

test('only the server can mutate registrations, awards, and event counters', async () => {
  const member = env.authenticatedContext('rules-member').firestore();
  const admin = env.authenticatedContext('rules-admin', { admin: true }).firestore();
  for (const db of [member, admin]) {
    await assertFails(setDoc(doc(db, 'eventRegistrations/rules-registration'), { userId: 'rules-member', eventId: 'rules-event' }));
    await assertFails(updateDoc(doc(db, 'events/rules-event'), { registeredCount: 4 }));
    await assertFails(updateDoc(doc(db, 'users/rules-member'), { greenPoints: 4 }));
    await assertFails(updateDoc(doc(db, 'impactReports/rules-pending'), { status: 'approved' }));
  }
  await assertSucceeds(getDocs(collection(admin, 'users')));
  await assertSucceeds(getDoc(doc(admin, 'partnerMessages/rules-message')));
  await assertSucceeds(updateDoc(doc(admin, 'posts/rules-draft'), { isPublished: true }));
  await assertSucceeds(setDoc(doc(admin, 'events/rules-created'), { isPublic: false, registeredCount: 0 }));
  const revoked = env.authenticatedContext('rules-revoked', { admin: true }).firestore();
  await assertFails(getDocs(collection(revoked, 'users')));
});

test('storage accepts only bounded image uploads by active admins', async () => {
  const storage = uid => env.authenticatedContext(uid, { admin: uid !== 'rules-member' }).storage();
  const path = 'events/28dd7252-4d3e-43ef-827d-398086db2e60';
  const upload = (uid, name, size, contentType) => uploadBytes(ref(storage(uid), name), new Uint8Array(size), { contentType });
  await assertFails(upload('rules-member', path, 20, 'image/png'));
  await assertFails(upload('rules-revoked', path, 20, 'image/png'));
  await assertFails(upload('rules-admin', path, 20, 'image/svg+xml'));
  await assertFails(upload('rules-admin', path, 5 * 1024 * 1024 + 1, 'image/png'));
  await assertFails(upload('rules-admin', 'events/unsafe-name.png', 20, 'image/png'));
  await assertSucceeds(upload('rules-admin', path, 20, 'image/png'));
});
