import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layout/DashboardLayout';
import { StatCard } from '../components/ui/StatCard';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalWaste: 0,
    totalTrees: 0,
    pendingReports: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const totalMembers = usersSnapshot.size;

        const approvedQuery = query(collection(db, 'impactReports'), where('status', '==', 'approved'));
        const approvedSnapshot = await getDocs(approvedQuery);
        
        let totalWaste = 0;
        let totalTrees = 0;
        approvedSnapshot.docs.forEach(doc => {
          const data = doc.data();
          totalWaste += parseInt(data.wasteAmount) || 0;
          totalTrees += parseInt(data.treesPlanted) || 0;
        });

        const pendingQuery = query(collection(db, 'impactReports'), where('status', '==', 'pending'));
        const pendingSnapshot = await getDocs(pendingQuery);
        
        setStats({
          totalMembers,
          totalWaste,
          totalTrees,
          pendingReports: pendingSnapshot.size
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const adminLinks = [
    { path: '/admin', label: 'Overview' },
    { path: '/admin/events', label: 'Event Manager' },
    { path: '/admin/users', label: 'User Management' },
    { path: '/admin/reports', label: 'Approval Queue' },
    { path: '/admin/blog', label: 'Blog CMS' },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <DashboardLayout links={adminLinks} title="Command Center">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Members" value={stats.totalMembers} icon="👥" />
          <StatCard label="Waste Collected" value={`${stats.totalWaste}kg`} icon="♻️" />
          <StatCard label="Trees Planted" value={stats.totalTrees} icon="🌳" />
          <StatCard label="Pending Reports" value={stats.pendingReports} icon="⏳" />
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button onClick={() => navigate('/admin/events')} className="w-full btn-primary text-left min-h-[44px]">
                Create New Event
              </button>
              <button onClick={() => navigate('/admin/reports')} className="w-full btn-secondary text-left min-h-[44px]">
                Review Reports ({stats.pendingReports})
              </button>
              <button onClick={() => navigate('/admin/blog')} className="w-full btn-secondary text-left min-h-[44px]">
                Publish Blog Post
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Management</h2>
            <div className="space-y-3">
              <button onClick={() => navigate('/admin/events')} className="w-full btn-secondary text-left min-h-[44px]">
                Event Manager
              </button>
              <button onClick={() => navigate('/admin/users')} className="w-full btn-secondary text-left min-h-[44px]">
                User Management
              </button>
              <button onClick={() => navigate('/admin/reports')} className="w-full btn-secondary text-left min-h-[44px]">
                Approval Queue
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
