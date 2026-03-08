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

export const getUserRole = async (user) => {
  try {
    const tokenResult = await user.getIdTokenResult();
    const claimRole = tokenResult.claims.role;
    
    // If custom claim exists, use it
    if (claimRole) {
      return claimRole;
    }
    
    // Fallback: Check Firestore if custom claim not set
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      return userDoc.data().role || 'member';
    }
    
    return 'member';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'member';
  }
};

export const isAdmin = async (user) => {
  try {
    const tokenResult = await user.getIdTokenResult();
    const isAdminClaim = tokenResult.claims.admin === true;
    
    // If custom claim exists and is true, use it
    if (isAdminClaim) {
      return true;
    }
    
    // Fallback: Check Firestore if custom claim not set
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      return userDoc.data().role === 'admin';
    }
    
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};
