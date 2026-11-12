import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { imageAccept, uploadImage } from '../firebase/images';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
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

export const PartnersAdmin = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState('');
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState('');
  const [form, setForm] = useState({
    name: '',
    websiteUrl: '',
    order: 0,
    isActive: true,
    logoUrl: '',
  });

  const adminLinks = useMemo(
    () => [
      { path: '/admin', label: 'Overview' },
      { path: '/admin/events', label: 'Event Manager' },
      { path: '/admin/users', label: 'User Management' },
      { path: '/admin/reports', label: 'Approval Queue' },
      { path: '/admin/blog', label: 'Blog CMS' },
      { path: '/admin/partners', label: 'Partners' },
      { path: '/admin/messages', label: 'Partner Inbox' },
    ],
    []
  );

  useEffect(() => {
    fetchPartners();
  }, []);

  useEffect(() => {
    if (!logoFile) return;
    const url = URL.createObjectURL(logoFile);
    setLogoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'partners'));
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => (Number(a?.order ?? 0) || 0) - (Number(b?.order ?? 0) || 0));
      setPartners(items);
    } catch (e) {
      console.error('Error loading partners:', e);
      toast.error('Load failed', 'Unable to load partners.');
      setPartners([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: '', websiteUrl: '', order: 0, isActive: true, logoUrl: '' });
    setEditingId('');
    setLogoFile(null);
    setLogoPreviewUrl('');
    setShowForm(false);
  };

  const startEdit = (p) => {
    setForm({
      name: p?.name ?? '',
      websiteUrl: p?.websiteUrl ?? '',
      order: Number(p?.order ?? 0) || 0,
      isActive: p?.isActive !== false,
      logoUrl: p?.logoUrl ?? '',
    });
    setEditingId(p.id);
    setLogoFile(null);
    setLogoPreviewUrl('');
    setShowForm(true);
  };

  const savePartner = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      toast.error('Missing name', 'Partner name is required.');
      return;
    }
    if (!editingId && !logoFile && !form.logoUrl) {
      toast.error('Missing logo', 'Please upload a partner logo.');
      return;
    }

    setSaving(true);
    try {
      let logoUrl = form.logoUrl || '';
      if (logoFile) {
        logoUrl = (await uploadImage('partners', logoFile)).url;
      }

      const payload = {
        name,
        websiteUrl: form.websiteUrl.trim(),
        order: Number(form.order ?? 0) || 0,
        isActive: form.isActive !== false,
        logoUrl,
      };

      if (editingId) {
        await updateDoc(doc(db, 'partners', editingId), payload);
        toast.success('Updated', 'Partner updated.');
      } else {
        await addDoc(collection(db, 'partners'), {
          ...payload,
          createdAt: new Date(),
          createdBy: currentUser?.uid ?? null,
        });
        toast.success('Created', 'Partner added.');
      }

      await fetchPartners();
      resetForm();
    } catch (err) {
      console.error('Error saving partner:', err);
      toast.error('Save failed', err?.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deletePartner = async (id) => {
    try {
      await deleteDoc(doc(db, 'partners', id));
      toast.success('Deleted', 'Partner removed.');
      fetchPartners();
    } catch (err) {
      console.error('Error deleting partner:', err);
      toast.error('Delete failed', err?.message ?? 'Please try again.');
    }
  };

  return (
    <DashboardLayout links={adminLinks} title="Partners">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500">Admin</p>
            <h1 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">Partners</h1>
            <p className="mt-2 text-sm text-gray-600">Add partner logos (e.g., REREC) and show them on the home page.</p>
          </div>
          <button onClick={() => (showForm ? resetForm() : setShowForm(true))} className="btn-primary text-sm md:text-base">
            {showForm ? 'Cancel' : '+ Add Partner'}
          </button>
        </div>

        {showForm ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-extrabold tracking-tight text-gray-900">
              {editingId ? 'Edit Partner' : 'New Partner'}
            </h2>

            <form onSubmit={savePartner} className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Name</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  placeholder="REREC"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Website URL (optional)</span>
                <input
                  value={form.websiteUrl}
                  onChange={(e) => setForm((s) => ({ ...s, websiteUrl: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  placeholder="https://example.org"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Display Order</span>
                <input
                  value={form.order}
                  onChange={(e) => setForm((s) => ({ ...s, order: e.target.value }))}
                  type="number"
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  min="0"
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-200"
                />
                <span className="text-sm font-semibold text-gray-700">Active (visible on home page)</span>
              </label>

              <div className="md:col-span-2">
                <span className="block text-sm font-semibold text-gray-700">Logo</span>
                <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-gray-100 bg-white p-4">
                    <input
                      type="file"
                      accept={imageAccept}
                      onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                      className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-bold file:text-emerald-700 hover:file:bg-emerald-100"
                    />
                    <p className="mt-2 text-xs text-gray-500">Upload a PNG/JPG/SVG logo. This will be stored in Firebase Storage.</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-semibold text-gray-500">Preview</p>
                    <div className="mt-3 flex h-20 items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-white">
                      {logoPreviewUrl || form.logoUrl ? (
                        <img
                          src={logoPreviewUrl || form.logoUrl}
                          alt="Partner logo preview"
                          className="max-h-12 w-auto max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-xs font-bold text-gray-500">No logo selected</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editingId ? 'Update Partner' : 'Create Partner'}
                </button>
              </div>
            </form>
          </div>
        ) : null}

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold tracking-tight text-gray-900">All Partners</h2>
            <span className="text-xs font-semibold text-gray-500">{partners.length} total</span>
          </div>

          {loading ? (
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5">
                  <div className="h-4 w-40 animate-pulse rounded bg-gray-100" />
                  <div className="mt-3 h-3 w-24 animate-pulse rounded bg-gray-100" />
                  <div className="mt-5 h-10 w-28 animate-pulse rounded-xl bg-gray-100" />
                </div>
              ))}
            </div>
          ) : partners.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center">
              <p className="text-sm font-semibold text-gray-700">No partners yet</p>
              <p className="mt-1 text-sm text-gray-600">Click “Add Partner” to upload a logo and show it on the home page.</p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {partners.map((p) => (
                <div key={p.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-extrabold tracking-tight text-gray-900">{p?.name ?? 'Partner'}</p>
                      <p className="mt-1 text-xs font-semibold text-gray-500">
                        {p?.isActive === false ? 'Draft / Hidden' : 'Active'} · Order {Number(p?.order ?? 0) || 0}
                        {p?.createdAt ? ` · Added ${formatDateTime(p.createdAt)}` : ''}
                      </p>
                      {p?.websiteUrl ? (
                        <a
                          href={p.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block text-sm font-bold text-emerald-700 hover:underline"
                        >
                          Visit Website →
                        </a>
                      ) : null}
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                        p?.isActive === false
                          ? 'bg-gray-50 text-gray-700 ring-gray-200'
                          : 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                      }`}
                    >
                      {p?.isActive === false ? 'DRAFT' : 'ACTIVE'}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-4">
                    <div className="flex h-14 w-28 items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                      {p?.logoUrl ? (
                        <img src={p.logoUrl} alt={`${p?.name ?? 'Partner'} logo`} className="max-h-10 w-auto object-contain" />
                      ) : (
                        <span className="text-xs font-bold text-gray-500">No logo</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="btn-secondary text-sm" onClick={() => startEdit(p)}>
                        Edit
                      </button>
                      <button className="btn-danger text-sm" onClick={() => setConfirmDeleteId(p.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirmDeleteId)}
        title="Delete partner?"
        description="This will remove the partner from the site."
        confirmLabel="Delete"
        tone="danger"
        onCancel={() => setConfirmDeleteId('')}
        onConfirm={() => {
          const id = confirmDeleteId;
          setConfirmDeleteId('');
          deletePartner(id);
        }}
      />
    </DashboardLayout>
  );
};
