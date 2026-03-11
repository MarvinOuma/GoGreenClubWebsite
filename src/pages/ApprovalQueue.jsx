import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { DashboardLayout } from '../layout/DashboardLayout';
import { useToast } from '../components/ui/ToastProvider';

const formatDate = (value) => {
  if (!value) return '';
  const d = typeof value?.toDate === 'function' ? value.toDate() : new Date(value);
  return Number.isNaN(d.getTime())
    ? ''
    : new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
};

export const ApprovalQueue = () => {
  const toast = useToast();
  const [reports, setReports] = useState([]);
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
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const q = query(collection(db, 'impactReports'), where('status', '==', 'pending'));
      const snapshot = await getDocs(q);
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Load failed', 'Failed to load pending reports.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (report) => {
    try {
      await updateDoc(doc(db, 'impactReports', report.id), { status: 'approved' });
      
      const points = (parseInt(report.wasteAmount) || 0) * 5 + (parseInt(report.treesPlanted) || 0) * 10;
      await updateDoc(doc(db, 'users', report.userId), { greenPoints: increment(points) });
      
      toast.success('Approved', `Report approved (+${points} points).`);
      fetchReports();
    } catch (error) {
      console.error('Error approving report:', error);
      toast.error('Approve failed', 'Please try again.');
    }
  };

  const handleReject = async (reportId) => {
    try {
      await updateDoc(doc(db, 'impactReports', reportId), { status: 'rejected' });
      toast.success('Rejected', 'Report rejected.');
      fetchReports();
    } catch (error) {
      console.error('Error rejecting report:', error);
      toast.error('Reject failed', 'Please try again.');
    }
  };

  return (
    <DashboardLayout links={adminLinks} title="Approval Queue">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">Pending Reports</h1>
          <p className="mt-2 text-sm text-gray-600">Review activity submissions and award green points.</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="h-4 w-40 animate-pulse rounded bg-gray-100" />
                <div className="mt-3 h-3 w-56 animate-pulse rounded bg-gray-100" />
                <div className="mt-5 h-16 w-full animate-pulse rounded-xl bg-gray-100" />
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
            <p className="text-4xl">🌿</p>
            <p className="mt-4 text-lg font-bold text-gray-900">No pending reports</p>
            <p className="mt-2 text-sm text-gray-600">When members submit activities, they’ll appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map(report => (
              <div key={report.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-extrabold tracking-tight text-gray-900">{report.activityType}</h3>
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">
                        Pending
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">User ID: {report.userId}</p>
                    {report?.createdAt ? (
                      <p className="mt-1 text-xs text-gray-500">Submitted: {formatDate(report.createdAt)}</p>
                    ) : null}
                  </div>
                </div>
                <p className="text-gray-700 mb-4 text-sm leading-relaxed">{report.description}</p>
                <div className="flex flex-wrap gap-4 mb-4">
                  {report.wasteAmount && <p className="text-sm">♻️ Waste: {report.wasteAmount}kg</p>}
                  {report.treesPlanted && <p className="text-sm">🌳 Trees: {report.treesPlanted}</p>}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleApprove(report)}
                    className="flex-1 px-4 py-2 rounded-xl min-h-[44px] bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(report.id)}
                    className="flex-1 px-4 py-2 rounded-xl min-h-[44px] bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
