import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../layout/DashboardLayout';
import { useToast } from '../components/ui/ToastProvider';

export const MemberProfile = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [formData, setFormData] = useState({ name: '', branch: '', interests: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const memberLinks = [
    { path: '/member', label: 'Dashboard' },
    { path: '/member/profile', label: 'My Profile' },
    { path: '/member/activities', label: 'My Activities' },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      const docSnap = await getDoc(doc(db, 'users', currentUser.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
          name: data.name || '',
          branch: data.branch || '',
          interests: data.interests?.join(', ') || ''
        });
      }
      setLoading(false);
    };
    fetchProfile();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Use setDoc with merge instead of updateDoc to create document if it doesn't exist
      await setDoc(doc(db, 'users', currentUser.uid), {
        name: formData.name,
        branch: formData.branch,
        interests: formData.interests
          .split(',')
          .map((i) => i.trim())
          .filter(Boolean),
      }, { merge: true });
      toast.success('Profile updated', 'Your changes were saved.');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Save failed', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <DashboardLayout links={memberLinks} title="My Profile">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-brand-green mb-6">Edit Profile</h1>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-green-300 focus:ring-4 focus:ring-green-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Branch/Department</label>
              <input
                type="text"
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-green-300 focus:ring-4 focus:ring-green-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Interests (comma separated)</label>
              <input
                type="text"
                value={formData.interests}
                onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-green-300 focus:ring-4 focus:ring-green-100"
                required
              />
            </div>
            <button type="submit" disabled={saving} className="w-full btn-primary">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};
