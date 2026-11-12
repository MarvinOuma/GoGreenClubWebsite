import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, adminOnly = false }) {
  const { currentUser, isAdminUser, isActive, accessError, refreshAccess } = useAuth();

  if (!currentUser) return <Navigate to="/login" replace />;

  if (isActive === false) {
    return <main className="mx-auto max-w-2xl p-6"><h1>Your account is inactive</h1><p>Contact a club administrator for help.</p></main>;
  }

  if (accessError || (adminOnly && !isAdminUser)) {
    return (
      <main className="mx-auto max-w-2xl space-y-4 p-6">
        <h1>{accessError ? 'We couldn’t verify your access' : 'Administrator access required'}</h1>
        <button type="button" className="btn-primary" onClick={refreshAccess}>Refresh access</button>
        {adminOnly && !accessError && <Link className="ml-4 underline" to="/member">Member dashboard</Link>}
      </main>
    );
  }
  return children;
}
