import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';

export const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' }); // type: 'success' | 'error'
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    setSending(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setStatus({
        type: 'success',
        message:
          'Password reset email sent. Check your inbox. If you do not see it within a few minutes, check spam/junk.',
      });
    } catch (err) {
      console.error('Password reset error:', err);
      setStatus({
        type: 'error',
        message:
          err?.code === 'auth/invalid-email'
            ? 'Please enter a valid email address.'
            : err?.message ?? 'Unable to send reset email. Please try again.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-green-200/30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 to-green-600" />
        <div className="p-8">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Reset Password</h1>
            <p className="mt-2 text-sm text-gray-600">Enter your email and we will send a reset link.</p>
          </div>

          {status.message ? (
            <div
              className={`mt-6 rounded-2xl border p-3 text-sm font-semibold ${
                status.type === 'success'
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-800'
                  : 'border-red-100 bg-red-50 text-red-700'
              }`}
            >
              {status.message}
            </div>
          ) : null}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full form-control"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            <button type="submit" disabled={sending} className="w-full btn-primary disabled:opacity-60">
              {sending ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Remembered your password?{' '}
            <Link to="/login" className="font-semibold text-brand-green hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
