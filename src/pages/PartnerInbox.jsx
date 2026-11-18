import { useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { DashboardLayout } from '../layout/DashboardLayout';
import { useToast } from '../components/ui/ToastProvider';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

const toJsDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatDateTime = (value) => {
  const d = toJsDate(value);
  if (!d) return '';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

export const PartnerInbox = () => {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState('');

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      let snap;
      try {
        snap = await getDocs(query(collection(db, 'partnerMessages'), orderBy('createdAt', 'desc')));
      } catch (e) {
        // Fallback if orderBy/index isn't available.
        snap = await getDocs(collection(db, 'partnerMessages'));
      }
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => (toJsDate(b?.createdAt)?.getTime?.() ?? 0) - (toJsDate(a?.createdAt)?.getTime?.() ?? 0));
      setItems(docs);
    } catch (err) {
      console.error('Error loading partner messages:', err);
      toast.error('Load failed', err?.message ?? 'Unable to load inbox.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((m) => {
      const status = (m?.status ?? 'new').toString();
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      const matchesSearch =
        !q ||
        m?.name?.toLowerCase?.().includes(q) ||
        m?.email?.toLowerCase?.().includes(q) ||
        m?.organization?.toLowerCase?.().includes(q) ||
        m?.message?.toLowerCase?.().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [items, statusFilter, search]);

  const toggleResolved = async (id, currentStatus) => {
    try {
      const next = currentStatus === 'resolved' ? 'new' : 'resolved';
      await updateDoc(doc(db, 'partnerMessages', id), { status: next, updatedAt: new Date() });
      toast.success('Updated', next === 'resolved' ? 'Marked as resolved.' : 'Reopened message.');
      fetchMessages();
    } catch (err) {
      console.error('Error updating message:', err);
      toast.error('Update failed', err?.message ?? 'Please try again.');
    }
  };

  const deleteMessage = async (id) => {
    try {
      await deleteDoc(doc(db, 'partnerMessages', id));
      toast.success('Deleted', 'Message deleted.');
      fetchMessages();
    } catch (err) {
      console.error('Error deleting message:', err);
      toast.error('Delete failed', err?.message ?? 'Please try again.');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold text-gray-500">Admin</p>
          <h1 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">Partner Inbox</h1>
          <p className="mt-2 text-sm text-gray-600">Messages submitted from the home page “Partner With Us” form.</p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, organization, message..."
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-semibold text-gray-800 shadow-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                aria-label="Filter by status"
              >
                <option value="all">All</option>
                <option value="new">New</option>
                <option value="resolved">Resolved</option>
              </select>
              <button className="btn-secondary" onClick={fetchMessages}>
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold tracking-tight text-gray-900">Messages</h2>
            <span className="text-xs font-semibold text-gray-500">{filtered.length} shown</span>
          </div>

          {loading ? (
            <div className="mt-6 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5">
                  <div className="h-4 w-44 animate-pulse rounded bg-gray-100" />
                  <div className="mt-3 h-3 w-64 animate-pulse rounded bg-gray-100" />
                  <div className="mt-3 h-16 w-full animate-pulse rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center">
              <p className="text-sm font-semibold text-gray-700">No messages</p>
              <p className="mt-1 text-sm text-gray-600">New partner inquiries will appear here.</p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {filtered.map((m) => {
                const status = (m?.status ?? 'new').toString();
                return (
                  <article key={m.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-base font-extrabold tracking-tight text-gray-900">
                          {m?.name ?? 'Unknown'}{' '}
                          <span className="ml-2 text-xs font-semibold text-gray-500">
                            {m?.createdAt ? `· ${formatDateTime(m.createdAt)}` : ''}
                          </span>
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {m?.organization ? <span className="font-semibold text-gray-800">{m.organization}</span> : null}
                          {m?.organization ? ' · ' : null}
                          <a className="font-bold text-emerald-700 hover:underline" href={`mailto:${m?.email ?? ''}`}>
                            {m?.email ?? 'No email'}
                          </a>
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                          status === 'resolved'
                            ? 'bg-gray-50 text-gray-700 ring-gray-200'
                            : 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                        }`}
                      >
                        {status.toUpperCase()}
                      </span>
                    </div>

                    <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{m?.message ?? ''}</p>

                    <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                      <button className="btn-secondary text-sm" onClick={() => toggleResolved(m.id, status)}>
                        {status === 'resolved' ? 'Reopen' : 'Mark Resolved'}
                      </button>
                      <button className="btn-danger text-sm" onClick={() => setConfirmDeleteId(m.id)}>
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirmDeleteId)}
        title="Delete message?"
        description="This will permanently delete the partner inquiry."
        confirmLabel="Delete"
        tone="danger"
        onCancel={() => setConfirmDeleteId('')}
        onConfirm={() => {
          const id = confirmDeleteId;
          setConfirmDeleteId('');
          deleteMessage(id);
        }}
      />
    </DashboardLayout>
  );
};
