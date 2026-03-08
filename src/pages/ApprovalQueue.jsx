import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { DashboardLayout } from '../layout/DashboardLayout';

export const ApprovalQueue = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const adminLinks = [
    { path: '/admin', label: 'Overview' },
    { path: '/admin/events', label: 'Event Manager' },
    { path: '/admin/users', label: 'User Management' },
    { path: '/admin/reports', label: 'Approval Queue' },
    { path: '/admin/blog', label: 'Blog CMS' },
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
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (report) => {
    try {
      await updateDoc(doc(db, 'impactReports', report.id), { status: 'approved' });
      
      const points = (parseInt(report.wasteAmount) || 0) * 5 + (parseInt(report.treesPlanted) || 0) * 10;
      await updateDoc(doc(db, 'users', report.userId), { greenPoints: increment(points) });
      
      fetchReports();
    } catch (error) {
      console.error('Error approving report:', error);
    }
  };

  const handleReject = async (reportId) => {
    try {
      await updateDoc(doc(db, 'impactReports', reportId), { status: 'rejected' });
      fetchReports();
    } catch (error) {
      console.error('Error rejecting report:', error);
    }
  };

  return (
    <DashboardLayout links={adminLinks} title="Approval Queue">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-brand-green">Pending Reports</h1>

        {loading ? (
          <p>Loading reports...</p>
        ) : reports.length === 0 ? (
          <p className="text-gray-500">No pending reports</p>
        ) : (
          <div className="space-y-4">
            {reports.map(report => (
              <div key={report.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-brand-green">{report.activityType}</h3>
                    <p className="text-sm text-gray-600">User ID: {report.userId}</p>
                  </div>
                  <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm self-start">Pending</span>
                </div>
                <p className="text-gray-700 mb-4">{report.description}</p>
                <div className="flex flex-wrap gap-4 mb-4">
                  {report.wasteAmount && <p className="text-sm">♻️ Waste: {report.wasteAmount}kg</p>}
                  {report.treesPlanted && <p className="text-sm">🌳 Trees: {report.treesPlanted}</p>}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button onClick={() => handleApprove(report)} className="flex-1 px-4 py-2 bg-green-500 text-white rounded-xl min-h-[44px]">Approve</button>
                  <button onClick={() => handleReject(report.id)} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl min-h-[44px]">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
