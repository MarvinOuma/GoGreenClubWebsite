import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmail, signInWithGoogle } from '../firebase/auth';
import { FaGoogle } from 'react-icons/fa';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmail(email, password);
      navigate('/member');
    } catch (err) {
      if (err?.code === 'auth/invalid-credential') {
        setError(
          'Invalid email or password. If you previously signed in with Google for this email, use "Continue with Google" or reset your password to set one.'
        );
      } else {
        setError(err?.message ?? 'Login failed. Please try again.');
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      navigate('/member');
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
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Welcome Back</h2>
          <p className="text-gray-600 mt-2">Login to your Impact Hub</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 border border-red-100 p-3 rounded-2xl mb-4 text-sm font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
            required
          />
          <div className="-mt-2 flex items-center justify-end">
            <Link to="/reset-password" className="text-sm font-semibold text-emerald-700 hover:underline">
              Forgot password?
            </Link>
          </div>
          <button type="submit" className="w-full btn-primary">
            Login
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-gray-500 text-sm">OR</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        <button onClick={handleGoogleLogin} className="w-full btn-secondary inline-flex items-center justify-center gap-2">
          <FaGoogle className="text-base" aria-hidden="true" />
          Continue with Google
        </button>

        <p className="text-center mt-6 text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="text-brand-green font-semibold hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
      </div>
    </div>
  );
};
