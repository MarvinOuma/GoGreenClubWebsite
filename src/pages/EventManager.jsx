import { useEffect, useMemo, useState } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../layout/DashboardLayout';
import { EventStatsOverview } from '../components/EventStatsOverview';
import { EventParticipantsDrawer } from '../components/EventParticipantsDrawer';
import { useToast } from '../components/ui/ToastProvider';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

const toDateSafe = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatEventDate = (value) => {
  const d = toDateSafe(value);
  if (!d) return value ?? '';
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
};

export const EventManager = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    category: 'cleanup',
    maxParticipants: '',
    registrationDeadline: '',
    pointsReward: '',
    isPublic: true,
    imageUrl: ''
  });

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
    fetchEvents();
  }, []);

  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const fetchEvents = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'events'));
      const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      eventsData.sort((a, b) => {
        const ad = toDateSafe(a?.createdAt?.toDate?.() || a?.createdAt)?.getTime?.() ?? 0;
        const bd = toDateSafe(b?.createdAt?.toDate?.() || b?.createdAt)?.getTime?.() ?? 0;
        return bd - ad;
      });
      setEvents(eventsData);
    } catch (e) {
      console.error('Error loading events:', e);
      toast.error('Load failed', 'Unable to load events.');
      setEvents([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      let imageUrl = formData.imageUrl;
      
      if (imageFile) {
        const imageRef = ref(storage, `events/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }
      
      const eventData = {
        ...formData,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        pointsReward: formData.pointsReward ? parseInt(formData.pointsReward) : null,
        imageUrl,
        status: new Date(formData.date) >= new Date() ? 'upcoming' : 'completed'
      };
      
      if (editingId) {
        await updateDoc(doc(db, 'events', editingId), eventData);
      } else {
        await addDoc(collection(db, 'events'), {
          ...eventData,
          registeredCount: 0,
          createdAt: new Date(),
          createdBy: currentUser.uid
        });
      }
      
      setFormData({ title: '', description: '', date: '', location: '', category: 'cleanup', maxParticipants: '', registrationDeadline: '', pointsReward: '', isPublic: true, imageUrl: '' });
      setImageFile(null);
      setImagePreviewUrl('');
      setShowForm(false);
      setEditingId(null);
      fetchEvents();
      toast.success('Saved', editingId ? 'Event updated.' : 'Event created.');
    } catch (error) {
      console.error('Error saving event:', error);
      if (error?.code === 'permission-denied') {
        toast.error(
          'Save blocked by permissions',
          'Your account may be missing the admin claim. Try logging out/in, then retry. If it still fails, update admin claims in Firebase Auth.'
        );
      }
      toast.error(
        'Save failed',
        error?.code ? `${error.code}: ${error?.message ?? 'Please try again.'}` : error?.message ?? 'Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (event) => {
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date,
      location: event.location,
      category: event.category || 'cleanup',
      maxParticipants: event.maxParticipants || '',
      registrationDeadline: event.registrationDeadline || '',
      pointsReward: event.pointsReward || '',
      isPublic: event.isPublic !== false,
      imageUrl: event.imageUrl || ''
    });
    setEditingId(event.id);
    setImageFile(null);
    setImagePreviewUrl('');
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      const regsQuery = query(collection(db, 'eventRegistrations'), where('eventId', '==', id));
      const regsSnap = await getDocs(regsQuery);
      await Promise.all(regsSnap.docs.map(d => deleteDoc(d.ref)));
      await deleteDoc(doc(db, 'events', id));
      toast.success('Deleted', 'Event deleted.');
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Delete failed', 'Failed to delete event. Please try again.');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, 'events', id), { status });
      toast.success('Status updated', `Event marked as ${status}.`);
      fetchEvents();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Update failed', 'Failed to update status. Please try again.');
    }
  };

  const viewParticipants = (event) => {
    setSelectedEvent(event);
    setDrawerOpen(true);
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', date: '', location: '', category: 'cleanup', maxParticipants: '', registrationDeadline: '', pointsReward: '', isPublic: true, imageUrl: '' });
    setImageFile(null);
    setImagePreviewUrl('');
    setEditingId(null);
    setShowForm(false);
  };

  const getStatusBadge = (event) => {
    const status = event.status || (new Date(event.date) >= new Date() ? 'upcoming' : 'completed');
    const colors = {
      upcoming: 'bg-blue-100 text-blue-700',
      ongoing: 'bg-green-100 text-green-700',
      completed: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return <span className={`px-3 py-1 ${colors[status]} text-xs font-semibold rounded-full`}>{status.toUpperCase()}</span>;
  };

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      const matchesSearch =
        !q ||
        e?.title?.toLowerCase?.().includes(q) ||
        e?.description?.toLowerCase?.().includes(q) ||
        e?.location?.toLowerCase?.().includes(q);
      const status = e?.status || (toDateSafe(e?.date) && toDateSafe(e?.date) >= new Date() ? 'upcoming' : 'completed');
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [events, search, statusFilter]);

  return (
    <DashboardLayout links={adminLinks} title="Event Manager">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">Event Manager</h1>
            <p className="mt-2 text-sm text-gray-600">Create, publish, and manage event registrations.</p>
          </div>
          <button onClick={() => showForm ? resetForm() : setShowForm(true)} className="btn-primary text-sm md:text-base">
            {showForm ? 'Cancel' : '+ Create Event'}
          </button>
        </div>

        <EventStatsOverview />

        {showForm && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-gray-900">{editingId ? 'Edit Event' : 'Create New Event'}</h2>
                <p className="mt-1 text-sm text-gray-600">Add details, image, and visibility.</p>
              </div>
              {editingId ? <span className="text-xs font-bold rounded-full bg-gray-100 text-gray-700 px-3 py-1">Editing</span> : null}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Event Title *</label>
                  <input
                    type="text"
                    placeholder="Beach Cleanup Drive"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                  <textarea
                    placeholder="Join us for a community beach cleanup..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    rows={6}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    required
                  >
                    <option value="cleanup">Cleanup</option>
                    <option value="tree-planting">Tree Planting</option>
                    <option value="workshop">Workshop</option>
                    <option value="awareness">Awareness Campaign</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Event Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location *</label>
                  <input
                    type="text"
                    placeholder="Central Park"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Registration Deadline</label>
                  <input
                    type="date"
                    value={formData.registrationDeadline}
                    onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Max Participants</label>
                  <input
                    type="number"
                    placeholder="50"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    min="1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Points Reward</label>
                  <input
                    type="number"
                    placeholder="20"
                    value={formData.pointsReward}
                    onChange={(e) => setFormData({ ...formData, pointsReward: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    min="0"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Event Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm shadow-sm"
                  />
                  <div className="mt-3 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                    {imagePreviewUrl || formData.imageUrl ? (
                      <img
                        src={imagePreviewUrl || formData.imageUrl}
                        alt="Event preview"
                        className="h-40 w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-40 items-center justify-center text-xs font-semibold text-gray-500">
                        No image selected
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="md:col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <label htmlFor="isPublic" className="text-sm font-semibold text-gray-700">Public Event (visible to all)</label>
                </div>
              </div>
              
              <button type="submit" disabled={uploading} className="w-full btn-primary disabled:opacity-50">
                {uploading ? 'Uploading...' : editingId ? 'Update Event' : 'Create Event'}
              </button>
            </form>
          </div>
        )}

        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 md:col-span-2"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="all">All statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredEvents.map(event => (
            <div key={event.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 hover:-translate-y-0.5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight text-gray-900 mb-1">{event.title}</h3>
                  <span className="text-xs text-gray-500 uppercase">{event.category || 'General'}</span>
                </div>
                {getStatusBadge(event)}
              </div>
              
              {event.imageUrl && (
                <img src={event.imageUrl} alt={event.title} className="w-full h-36 object-cover rounded-2xl mb-3" loading="lazy" />
              )}
              
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>
              
              <div className="space-y-1 text-sm text-gray-500 mb-3">
                <p>📅 {formatEventDate(event.date)}</p>
                <p>📍 {event.location}</p>
                {event.maxParticipants && (
                  <p>👥 {event.registeredCount || 0} / {event.maxParticipants} registered</p>
                )}
                {event.pointsReward && (
                  <p className="text-brand-green font-semibold">🏆 +{event.pointsReward} points</p>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button onClick={() => viewParticipants(event)} className="flex-1 px-3 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold min-h-[44px] hover:bg-gray-800 transition">
                  Participants ({event.registeredCount || 0})
                </button>
                <button onClick={() => handleEdit(event)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold min-h-[44px] hover:bg-emerald-700 transition">Edit</button>
              </div>
              
              <div className="flex gap-2 mt-2">
                {event.status !== 'cancelled' && (
                  <select 
                    value={event.status || 'upcoming'} 
                    onChange={(e) => updateStatus(event.id, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm shadow-sm"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                )}
                <button onClick={() => setConfirmDeleteId(event.id)} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold min-h-[44px] hover:bg-red-700 transition">Delete</button>
              </div>
            </div>
          ))}
        </div>
        
        <EventParticipantsDrawer 
          event={selectedEvent} 
          isOpen={drawerOpen} 
          onClose={() => setDrawerOpen(false)}
          onUpdate={fetchEvents}
        />

        <ConfirmDialog
          open={!!confirmDeleteId}
          title="Delete this event?"
          description="This will permanently delete the event and all registrations for it. This action cannot be undone."
          confirmLabel="Delete event"
          tone="danger"
          onCancel={() => setConfirmDeleteId('')}
          onConfirm={async () => {
            const id = confirmDeleteId;
            setConfirmDeleteId('');
            await handleDelete(id);
          }}
        />
      </div>
    </DashboardLayout>
  );
};
