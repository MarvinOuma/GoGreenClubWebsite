import { useState, useEffect } from 'react';
import { collection, doc, getDoc, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layout/DashboardLayout';
import { StatCard } from '../components/ui/StatCard';
import { useToast } from '../components/ui/ToastProvider';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalWaste: 0,
    totalTrees: 0,
    pendingReports: 0
  });
  const [loading, setLoading] = useState(true);

  const adminLinks = [
    { path: '/admin', label: 'Overview' },
    { path: '/admin/events', label: 'Event Manager' },
    { path: '/admin/users', label: 'User Management' },
    { path: '/admin/reports', label: 'Approval Queue' },
    { path: '/admin/blog', label: 'Blog CMS' },
    { path: '/admin/partners', label: 'Partners' },
    { path: '/admin/messages', label: 'Partner Inbox' },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [users, inactive, overview, pending] = await Promise.all([
          getCountFromServer(collection(db, 'users')),
          getCountFromServer(query(collection(db, 'users'), where('isActive', '==', false))),
          getDoc(doc(db, 'publicStats', 'overview')),
          getCountFromServer(query(collection(db, 'impactReports'), where('status', '==', 'pending'))),
        ]);
        setStats({
          totalMembers: users.data().count - inactive.data().count,
          totalWaste: overview.data()?.wasteKg,
          totalTrees: overview.data()?.treesPlanted,
          pendingReports: pending.data().count,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        toast.error('Load failed', 'Unable to load admin stats.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <DashboardLayout links={adminLinks} title="Command Center">
      <div className="max-w-6xl mx-auto space-y-6">
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
                  <div className="mt-4 h-8 w-28 animate-pulse rounded bg-gray-100" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className="h-5 w-40 animate-pulse rounded bg-gray-100" />
                  <div className="mt-4 h-24 w-full animate-pulse rounded-xl bg-gray-100" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold text-gray-500">Admin</p>
          <h1 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">Command Center</h1>
          <p className="mt-2 text-sm text-gray-600">Manage events, users, reports, and blog posts.</p>
        </div>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Active members" value={stats.totalMembers} icon="👥" />
          <StatCard label="Waste Collected" value={stats.totalWaste == null ? '—' : `${Number(stats.totalWaste.toFixed(2))} kg`} icon="♻️" />
          <StatCard label="Trees Planted" value={stats.totalTrees ?? '—'} icon="🌳" />
          <StatCard label="Pending Reports" value={stats.pendingReports} icon="⏳" />
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-xl font-extrabold tracking-tight text-gray-900 mb-4">Quick Actions</h2>
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

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-xl font-extrabold tracking-tight text-gray-900 mb-4">Management</h2>
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
          </>
        )}
      </div>
    </DashboardLayout>
  );
};
