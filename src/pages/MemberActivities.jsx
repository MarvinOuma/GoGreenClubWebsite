import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../layout/DashboardLayout';

export const MemberActivities = () => {
  const { currentUser } = useAuth();
  const [activities, setActivities] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ activityType: '', wasteAmount: '', treesPlanted: '', description: '' });

  const memberLinks = [
    { path: '/member', label: 'Dashboard' },
    { path: '/member/profile', label: 'My Profile' },
    { path: '/member/activities', label: 'My Activities' },
  ];

  useEffect(() => {
    fetchActivities();
  }, [currentUser]);

  const fetchActivities = async () => {
    const q = query(collection(db, 'impactReports'), where('userId', '==', currentUser.uid));
    const snapshot = await getDocs(q);
    setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'impactReports'), {
        ...formData,
        userId: currentUser.uid,
        status: 'pending',
        createdAt: new Date()
      });
      setFormData({ activityType: '', wasteAmount: '', treesPlanted: '', description: '' });
      setShowForm(false);
      fetchActivities();
      alert('Activity submitted for approval!');
    } catch (error) {
      console.error('Error submitting activity:', error);
      alert('Failed to submit activity');
    }
  };

  return (
    <DashboardLayout links={memberLinks} title="My Activities">
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
              <select value={formData.activityType} onChange={(e) => setFormData({...formData, activityType: e.target.value})} className="w-full px-4 py-3 border rounded-xl" required>
                <option value="">Select Activity Type</option>
                <option value="recycling">Recycling</option>
                <option value="tree_planting">Tree Planting</option>
                <option value="cleanup">Cleanup Drive</option>
                <option value="other">Other</option>
              </select>
              <input type="number" placeholder="Waste Collected (kg)" value={formData.wasteAmount} onChange={(e) => setFormData({...formData, wasteAmount: e.target.value})} className="w-full px-4 py-3 border rounded-xl" />
              <input type="number" placeholder="Trees Planted" value={formData.treesPlanted} onChange={(e) => setFormData({...formData, treesPlanted: e.target.value})} className="w-full px-4 py-3 border rounded-xl" />
              <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 border rounded-xl h-32" required />
              <button type="submit" className="w-full btn-primary">Submit Activity</button>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {activities.length === 0 ? (
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
