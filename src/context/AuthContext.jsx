import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { getAuthProfile } from '../firebase/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [access, setAccess] = useState({ loading: true });
  const sequence = useRef(0);
  const previousUid = useRef();

  const loadAccess = useCallback(async user => {
    const version = ++sequence.current;
    if (previousUid.current !== user?.uid) setAccess({ loading: true });
    previousUid.current = user?.uid;
    setCurrentUser(user);
    try {
      const profile = user ? await getAuthProfile(user) : {};
      if (version === sequence.current) setAccess({ ...profile, loading: false });
    } catch (error) {
      if (version === sequence.current) setAccess({ error, loading: false });
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, loadAccess);
    return () => { ++sequence.current; unsubscribe(); };
  }, [loadAccess]);

  const refreshAccess = async () => {
    if (!auth.currentUser) return;
    try {
      await auth.currentUser.getIdToken(true);
      await loadAccess(auth.currentUser);
    } catch (error) {
      setAccess({ error, loading: false });
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAdminUser: access.hasAdminClaim === true,
      isActive: access.isActive,
      accessError: access.error,
      loading: access.loading,
      refreshAccess,
    }}>
      {access.loading ? <p className="p-6" role="status">Loading…</p> : children}
    </AuthContext.Provider>
  );
}
