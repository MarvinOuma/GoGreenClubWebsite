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

export const getAuthProfile = async (user, options = {}) => {
  const { forceRefresh = false } = options;

  try {
    const tokenResult = await user.getIdTokenResult(forceRefresh);
    const claims = tokenResult?.claims ?? {};
    const claimRole = typeof claims.role === 'string' ? claims.role : null;
    const hasAdminClaim = claims.admin === true;

    let profileRole = 'member';
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      profileRole = userDoc.data().role || 'member';
    }

    return {
      claims,
      hasAdminClaim,
      profileRole,
      role: claimRole || profileRole || 'member',
    };
  } catch (error) {
    console.error('Error getting auth profile:', error);
    return {
      claims: {},
      hasAdminClaim: false,
      profileRole: 'member',
      role: 'member',
    };
  }
};

export const getUserRole = async (user, options) => {
  const profile = await getAuthProfile(user, options);
  return profile.role;
};

export const isAdmin = async (user, options) => {
  const profile = await getAuthProfile(user, options);
  return profile.hasAdminClaim;
};
