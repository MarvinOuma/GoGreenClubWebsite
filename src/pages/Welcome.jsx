import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/ToastProvider';

export const Welcome = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('');
  const [interests, setInterests] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        name: name.trim(),
        branch: branch.trim(),
        interests: interests
          .split(',')
          .map((i) => i.trim())
          .filter(Boolean),
      }, { merge: true });
      navigate('/member');
    } catch (err) {
      console.error(err);
      toast.error('Setup failed', err?.message ?? 'Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="GoGreen Club" className="h-20 w-20 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-brand-green">Complete Your Profile</h2>
          <p className="text-gray-600 mt-2">Tell us about yourself</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            maxLength={120}
            aria-label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full form-control"
            required
          />
          <input
            type="text"
            placeholder="Branch/Department"
            maxLength={120}
            aria-label="Branch/Department"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="w-full form-control"
            required
          />
          <input
            type="text"
            placeholder="Interests (comma separated)"
            aria-label="Interests (comma separated)"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            className="w-full form-control"
            required
          />
          <button type="submit" className="w-full btn-primary">
            Get Started
          </button>
        </form>
      </div>
    </div>
  );
};
