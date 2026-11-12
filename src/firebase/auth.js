import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
  const profile = (await getDoc(doc(db, 'users', user.uid))).data();
  const isActive = profile?.isActive !== false;
  return {
    hasAdminClaim: claims.admin === true && isActive && profile?.adminRevoked !== true,
    isActive,
  };
}
