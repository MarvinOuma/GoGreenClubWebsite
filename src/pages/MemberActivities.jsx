import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../layout/DashboardLayout';
import { useToast } from '../components/ui/ToastProvider';

export const MemberActivities = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ activityType: '', wasteAmount: '', treesPlanted: '', description: '' });

  useEffect(() => {
    fetchActivities();
  }, [currentUser]);

  const fetchActivities = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const q = query(collection(db, 'impactReports'), where('userId', '==', currentUser.uid));
      const snapshot = await getDocs(q);
      setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'impactReports'), {
        ...formData,
        wasteAmount: Number(formData.wasteAmount),
        treesPlanted: Number(formData.treesPlanted),
        description: formData.description.trim(),
        userId: currentUser.uid,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setFormData({ activityType: '', wasteAmount: '', treesPlanted: '', description: '' });
      setShowForm(false);
      fetchActivities();
      toast.success('Submitted', 'Activity submitted for approval.');
    } catch (error) {
      console.error('Error submitting activity:', error);
      toast.error('Submit failed', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-brand-green">Activities</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm md:text-base">
            {showForm ? 'Cancel' : '+ Activity'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <select aria-label="Activity type"
                value={formData.activityType}
                onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
                className="w-full form-control"
                required
              >
                <option value="">Select Activity Type</option>
                <option value="recycling">Recycling</option>
                <option value="tree_planting">Tree Planting</option>
                <option value="cleanup">Cleanup Drive</option>
                <option value="other">Other</option>
              </select>
              <input
                type="number" min="0" max="10000" step="0.01"
                aria-label="Waste Collected (kg)" placeholder="Waste Collected (kg)"
                value={formData.wasteAmount}
                onChange={(e) => setFormData({ ...formData, wasteAmount: e.target.value })}
                className="w-full form-control"
              />
              <input
                type="number" min="0" max="10000" step="1"
                aria-label="Trees Planted" placeholder="Trees Planted"
                value={formData.treesPlanted}
                onChange={(e) => setFormData({ ...formData, treesPlanted: e.target.value })}
                className="w-full form-control"
              />
              <textarea
                aria-label="Description" placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full form-control"
                rows={6} maxLength={2000}
                required
              />
              <button type="submit" className="w-full btn-primary" disabled={saving}>{saving ? 'Submitting…' : 'Submit activity'}</button>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {loading ? <p role="status" className="text-muted">Loading activities…</p> : loadError ? (
            <div className="panel p-5">
              <p role="alert" className="mb-3 text-danger">Your activities couldn’t be loaded.</p>
              <button type="button" className="btn-secondary" onClick={fetchActivities}>Try again</button>
            </div>
          ) : activities.length === 0 ? (
            <p className="text-gray-500">No activities yet. Log your first activity!</p>
          ) : (
            activities.map(activity => (
              <div key={activity.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-2">
                  <h3 className="text-lg font-bold text-brand-green">{activity.activityType}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm self-start ${
                    activity.status === 'approved' ? 'bg-green-100 text-green-700' :
                    activity.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {activity.status}
                  </span>
                </div>
                <p className="text-gray-700 mb-2">{activity.description}</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {activity.wasteAmount && <span>♻️ {activity.wasteAmount}kg waste</span>}
                  {activity.treesPlanted && <span>🌳 {activity.treesPlanted} trees</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
