import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUpWithEmail, signInWithGoogle } from '../firebase/auth';

export const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    try {
      await signUpWithEmail(email, password);
      navigate('/welcome');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      await signInWithGoogle();
      navigate('/welcome');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-green-200/30 blur-3xl" />
      </div>

      <div className="relative max-w-md w-full overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 to-green-600" />
        <div className="p-8">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="GoGreen Club" className="h-20 w-20 mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Join GoGreen Club</h2>
          <p className="text-gray-600 mt-2">Green Steps, Big Impact!</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 border border-red-100 p-3 rounded-2xl mb-4 text-sm font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSignup} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            autoComplete="email"
            aria-label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full form-control"
            required
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Password (min 6 characters)"
            aria-label="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full form-control"
            required
            minLength={6}
          />
          <button type="submit" className="w-full btn-primary">
            Sign Up
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-gray-500 text-sm">OR</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        <button onClick={handleGoogleSignup} className="w-full btn-secondary">
          Continue with Google
        </button>

        <p className="text-center mt-6 text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-green font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
      </div>
    </div>
  );
};
