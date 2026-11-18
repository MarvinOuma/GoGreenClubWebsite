import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { callFunction } from '../firebase/callable';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit, startAfter } from 'firebase/firestore';
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
  const [status, setStatus] = useState('pending');
  const [verifyId, setVerifyId] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, [status]);

  const fetchReports = async (after = null) => {
    try {
      setLoading(true);
      const q = query(collection(db, 'impactReports'), where('status', '==', status),
        ...(after ? [startAfter(after)] : []), limit(40));
      const snapshot = await getDocs(q);
      const page = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports(previous => after ? [...previous, ...page] : page);
      setCursor(snapshot.size === 40 ? snapshot.docs.at(-1) : null);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Load failed', 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  const reviewReport = async (reportId, decision) => {
    setReviewing(true);
    try {
      const { points, changed } = await callFunction('reviewImpactReport', { reportId, decision });
      toast.success(decision === 'approved' ? 'Approved' : 'Rejected',
        changed && points ? `+${points} Green Points awarded.` : undefined);
      await fetchReports();
    } catch (error) {
      toast.error('Review failed', error.message);
    } finally {
      setReviewing(false);
    }
  };

  const verifyReport = async () => {
    const reportId = verifyId;
    setVerifyId(null);
    setReviewing(true);
    try {
      const { changed } = await callFunction('verifyLegacyImpactReport', { reportId });
      toast.success(changed ? 'Verified for the next public summary' : 'This report was already verified');
    } catch (error) {
      toast.error('Verification failed', error.message);
    } finally {
      setReviewing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">Impact report reviews</h1>
          <p className="mt-2 text-sm text-gray-600">Review activity submissions, award Green Points, and verify previously approved reports.</p>
        </div>

        <div className="flex flex-wrap gap-2" aria-label="Report status">
          {['pending', 'approved'].map(value => (
            <button key={value} type="button" aria-pressed={status === value}
              className={status === value ? 'btn-primary' : 'btn-secondary'}
              disabled={loading || reviewing} onClick={() => setStatus(value)}>
              {value === 'pending' ? 'Pending' : 'Previously approved'}
            </button>
          ))}
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
            <p className="mt-4 text-lg font-bold text-gray-900">No {status} reports</p>
            <p className="mt-2 text-sm text-gray-600">{status === 'pending' ? 'New activity submissions will appear here.' : 'Approved reports will appear here.'}</p>
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
                        {report.status}
                      </span>
                    </div>
                    {report.userId && <p className="mt-1 break-all text-sm text-gray-600">User ID {report.userId}</p>}
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
                {status === 'approved' ? (
                  <button type="button" className="btn-secondary" disabled={reviewing} onClick={() => setVerifyId(report.id)}>
                    Verify for public totals
                  </button>
                ) : <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    disabled={reviewing}
                    onClick={() => reviewReport(report.id, 'approved')}
                    className="flex-1 px-4 py-2 rounded-xl min-h-[44px] bg-leaf text-white font-semibold hover:bg-emerald-700 transition"
                  >
                    Approve
                  </button>
                  <button
                    disabled={reviewing}
                    onClick={() => reviewReport(report.id, 'rejected')}
                    className="flex-1 px-4 py-2 rounded-xl min-h-[44px] bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                  >
                    Reject
                  </button>
                </div>}
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog open={Boolean(verifyId)} title="Verify this report for public totals?"
        description="Check the original activity evidence first. Verification does not change historical Green Points."
        confirmLabel="Verify report" tone="primary" onCancel={() => setVerifyId(null)} onConfirm={verifyReport} />
      {cursor && !loading && (
        <button type="button" className="btn-secondary mt-6" onClick={() => fetchReports(cursor)}>
          Load more reports
        </button>
      )}
    </DashboardLayout>
  );
};
