import { createRequire } from 'node:module';
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { applicationDefault, getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

export const projectId = 'demo-gogreen';
export const bucket = 'demo-gogreen.appspot.com';
export const password = 'local-testing-only-password';

if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  throw new Error('Run the test fixture inside the Firebase Emulator Suite.');
}

const app = getApps()[0] ?? initializeApp({ projectId, storageBucket: bucket, credential: applicationDefault() });
export const db = getFirestore(app);
export const auth = getAuth(app);

export async function makeAccount(uid, isAdmin = false) {
  const email = `${uid}@example.test`;
  await auth.createUser({ uid, email, password }).catch(error => {
    if (error.code !== 'auth/uid-already-exists') throw error;
  });
  if (isAdmin) await auth.setCustomUserClaims(uid, { role: 'admin', admin: true });
  await db.collection('users').doc(uid).set({
    name: isAdmin ? 'Test Administrator' : 'Test Member',
    email, branch: 'Local test', interests: [], role: isAdmin ? 'admin' : 'member', isActive: true, greenPoints: 0,
  }, { merge: true });
  return email;
}
