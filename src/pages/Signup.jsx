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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="GoGreen Club" className="h-20 w-20 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-brand-green">Join GoGreen Club</h2>
          <p className="text-gray-600 mt-2">Green Steps, Big Impact!</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSignup} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green"
            required
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green"
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
  );
};
