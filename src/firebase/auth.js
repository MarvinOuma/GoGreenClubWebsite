import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { callFunction } from './callable';
import { auth, db } from './firebaseConfig';

export const signUpWithEmail = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signInWithEmail = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signInWithGoogle = () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const logout = () => {
  return signOut(auth);
};

export async function getAuthProfile(user) {
  const { claims } = await user.getIdTokenResult();
  let snapshot = await getDoc(doc(db, 'users', user.uid));
  if (!snapshot.exists()) {
    await callFunction('initializeMyProfile', {});
    snapshot = await getDoc(doc(db, 'users', user.uid));
  }
  if (!snapshot.exists()) throw new Error('Your profile could not be initialized. Please retry.');
  const profile = snapshot.data();
  const isActive = profile.isActive !== false && !profile.deleting;
  const onboardingComplete = typeof profile.name === 'string' && profile.name.trim().length > 0 &&
    typeof profile.branch === 'string' && profile.branch.trim().length > 0 &&
    Array.isArray(profile.interests);
  return {
    hasAdminClaim: claims.admin === true && isActive && profile.adminRevoked !== true,
    isActive,
    onboardingComplete,
  };
}
