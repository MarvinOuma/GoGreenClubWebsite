import { eventDate, eventStatus, formatEventDate } from '../../functions/lib/eventTime.mjs';
import { callFunction } from '../firebase/callable';
import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc } from 'firebase/firestore';
import { discardUpload, imageAccept, uploadImage } from '../firebase/images';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../layout/DashboardLayout';
import { EventStatsOverview } from '../components/EventStatsOverview';
import { EventParticipantsDrawer } from '../components/EventParticipantsDrawer';
import { useToast } from '../components/ui/ToastProvider';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';


const formatInputDate = value => {
  const date = eventDate(value, false);
  return date ? new Intl.DateTimeFormat('sv-SE', { timeZone: 'Africa/Nairobi' }).format(date) : '';
};

function managerStatus(event) {
  const status = eventStatus(event);
  return status === 'upcoming' && event.status === 'ongoing' ? 'ongoing' : status;
}

export const EventManager = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const editorTitle = useRef(null);
  const editorTrigger = useRef(null);
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
  const [deletingId, setDeletingId] = useState('');
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
    imageUrl: '', imageAlt: ''
  });

  useEffect(() => {
    if (showForm) editorTitle.current?.focus();
  }, [showForm, editingId]);

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
        const ad = eventDate(a?.createdAt?.toDate?.() || a?.createdAt)?.getTime?.() ?? 0;
        const bd = eventDate(b?.createdAt?.toDate?.() || b?.createdAt)?.getTime?.() ?? 0;
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
    const original = events.find(event => event.id === editingId);
    const date = original && formData.date === formatInputDate(original.date) ? original.date : formData.date;
    const registrationDeadline = original && formData.registrationDeadline === formatInputDate(original.registrationDeadline)
      ? original.registrationDeadline ?? '' : formData.registrationDeadline;
    if (registrationDeadline && eventDate(registrationDeadline) > eventDate(date)) {
      toast.error('Check the registration deadline', 'The deadline must be on or before the event date.');
      return;
    }
    setUploading(true);

    let uploaded;
    try {
      let imageUrl = formData.imageUrl;

      if (imageFile) {
        uploaded = await uploadImage('events', imageFile);
        imageUrl = uploaded.url;
      }

      const eventData = {
        ...formData,
        date,
        registrationDeadline,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        pointsReward: formData.pointsReward ? parseInt(formData.pointsReward) : null,
        imageUrl,
        imageAlt: formData.imageAlt.trim(),
        ...(uploaded ? { imagePath: uploaded.path } : {}),
        status: original?.status ?? 'upcoming'
      };

      if (editingId) {
        await updateDoc(doc(db, 'events', editingId), eventData);
      } else {
        await addDoc(collection(db, 'events'), {
          ...eventData,
          registeredCount: 0,
          registrationCountVersion: 2,
          createdAt: new Date(),
          createdBy: currentUser.uid
        });
      }

      uploaded = undefined;
      setFormData({ title: '', description: '', date: '', location: '', category: 'cleanup', maxParticipants: '', registrationDeadline: '', pointsReward: '', isPublic: true, imageUrl: '', imageAlt: '' });
      setImageFile(null);
      setImagePreviewUrl('');
      setShowForm(false);
      setEditingId(null);
      fetchEvents();
      toast.success('Saved', editingId ? 'Event updated.' : 'Event created.');
    } catch (error) {
      await discardUpload(uploaded);
      console.error('Error saving event:', error);
      if (error?.code === 'permission-denied' || error?.code === 'storage/unauthorized') {
        toast.error(
          'Admin claim required',
          'This action is allowed only for Firebase Auth users with the admin claim. Sign out and back in to refresh claims. If it still fails, update the user through the `updateUserRole` Cloud Function or Firebase Admin SDK.'
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

  const handleEdit = (event, trigger) => {
    editorTrigger.current = trigger;
    setFormData({
      title: event.title,
      description: event.description,
      date: formatInputDate(event.date),
      location: event.location,
      category: event.category || 'cleanup',
      maxParticipants: event.maxParticipants || '',
      registrationDeadline: formatInputDate(event.registrationDeadline),
      pointsReward: event.pointsReward || '',
      isPublic: event.isPublic !== false,
      imageUrl: event.imageUrl || '',
      imageAlt: event.imageAlt || ''
    });
    setEditingId(event.id);
    setImageFile(null);
    setImagePreviewUrl('');
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await callFunction('deleteEvent', { eventId: id });
      toast.success('Deleted', 'Event deleted.');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Deletion interrupted', 'The event may already be hidden. Retry deletion from Event Manager.');
    } finally {
      await fetchEvents();
      setDeletingId('');
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
    setFormData({ title: '', description: '', date: '', location: '', category: 'cleanup', maxParticipants: '', registrationDeadline: '', pointsReward: '', isPublic: true, imageUrl: '', imageAlt: '' });
    setImageFile(null);
    setImagePreviewUrl('');
    setEditingId(null);
    setShowForm(false);
    requestAnimationFrame(() => {
      const target = editorTrigger.current?.isConnected ? editorTrigger.current : document.getElementById('create-event');
      target?.focus();
    });
  };

  const getStatusBadge = (event) => {
    const status = managerStatus(event);
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
      const status = managerStatus(e);
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [events, search, statusFilter]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">Event Manager</h1>
            <p className="mt-2 text-sm text-gray-600">Create, publish, and manage event registrations.</p>
          </div>
          {!showForm && <button type="button" id="create-event" onClick={event => { editorTrigger.current = event.currentTarget; setShowForm(true); }} className="btn-primary self-start text-sm">
            Create event
          </button>}
        </div>

        <EventStatsOverview />

        {showForm && (
          <div className="panel p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 ref={editorTitle} tabIndex={-1} className="scroll-mt-24 text-xl font-extrabold tracking-tight text-gray-900">{editingId ? 'Edit Event' : 'Create New Event'}</h2>
                <p className="mt-1 text-sm text-gray-600">Add details, image, and visibility.</p>
              </div>
              {editingId ? <span className="text-xs font-bold rounded-full bg-gray-100 text-gray-700 px-3 py-1">Editing</span> : null}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="eventmanager-event-title" className="block text-sm font-semibold text-gray-700 mb-2">Event Title *</label>
                  <input id="eventmanager-event-title"
                    type="text"
                    placeholder="Beach Cleanup Drive"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full form-control"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="eventmanager-description" className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                  <textarea id="eventmanager-description"
                    placeholder="Join us for a community beach cleanup..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full form-control"
                    rows={6}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="eventmanager-category" className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                  <select id="eventmanager-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full form-control"
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
                  <label htmlFor="eventmanager-event-date" className="block text-sm font-semibold text-gray-700 mb-2">Event date (Nairobi time) *</label>
                  <input id="eventmanager-event-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full form-control"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="eventmanager-location" className="block text-sm font-semibold text-gray-700 mb-2">Location *</label>
                  <input id="eventmanager-location"
                    type="text"
                    placeholder="Central Park"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full form-control"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="eventmanager-registration-deadline" className="block text-sm font-semibold text-gray-700 mb-2">Registration deadline (Nairobi time)</label>
                  <input id="eventmanager-registration-deadline"
                    type="date"
                    value={formData.registrationDeadline}
                    onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                    className="w-full form-control"
                  />
                </div>

                <div>
                  <label htmlFor="eventmanager-max-participants" className="block text-sm font-semibold text-gray-700 mb-2">Max Participants</label>
                  <input id="eventmanager-max-participants"
                    type="number"
                    placeholder="50"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                    className="w-full form-control"
                    min="1"
                  />
                </div>

                <div>
                  <label htmlFor="eventmanager-points-reward" className="block text-sm font-semibold text-gray-700 mb-2">Points Reward</label>
                  <input id="eventmanager-points-reward"
                    type="number"
                    placeholder="20"
                    value={formData.pointsReward}
                    onChange={(e) => setFormData({ ...formData, pointsReward: e.target.value })}
                    className="w-full form-control"
                    min="0"
                    max="10000"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="eventmanager-event-image" className="block text-sm font-semibold text-gray-700 mb-2">Event Image</label>
                  <input id="eventmanager-event-image"
                    type="file"
                    accept={imageAccept}
                    onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm shadow-sm"
                  />
                  <p className="mt-2 text-xs text-muted">Use an approved club photo. JPEG, PNG, WebP or GIF up to 5 MB.</p>
                  {(imageFile || formData.imageUrl) && <label className="mt-3 block text-sm font-semibold">
                    Image description <span className="font-normal text-muted">(optional)</span>
                    <input className="form-control mt-1" value={formData.imageAlt} maxLength={180}
                      onChange={event => setFormData({ ...formData, imageAlt: event.target.value })} />
                  </label>}
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

                <div className="sm:col-span-2 flex items-center gap-2">
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

              <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
                <button type="button" onClick={resetForm} disabled={uploading} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={uploading} className="btn-primary text-sm">
                  {uploading ? 'Saving…' : editingId ? 'Update event' : 'Create event'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search managed events" placeholder="Search events"
              className="w-full form-control sm:col-span-2"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full form-control"
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
                {event.deleting ? <span className="shrink-0 text-xs font-semibold text-warning">Deletion pending</span> : getStatusBadge(event)}
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
                <button disabled={event.deleting} onClick={() => viewParticipants(event)} className="flex-1 px-3 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold min-h-[44px] hover:bg-gray-800 transition">
                  Participants ({event.registeredCount || 0})
                </button>
                <button disabled={event.deleting} onClick={click => handleEdit(event, click.currentTarget)} className="px-4 py-2 bg-leaf text-white rounded-xl text-sm font-semibold min-h-[44px] hover:bg-emerald-700 transition">Edit</button>
              </div>

              <div className="flex gap-2 mt-2">
                {event.status !== 'cancelled' && !event.deleting && (
                  <select
                    aria-label={`Status for ${event.title}`}
                    value={managerStatus(event)}
                    onChange={(e) => updateStatus(event.id, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm shadow-sm"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                )}
                <button type="button" disabled={!!deletingId} onClick={() => setConfirmDeleteId(event.id)} className="btn-danger text-sm">{deletingId === event.id ? 'Deleting…' : event.deleting ? 'Retry deletion' : 'Delete'}</button>
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
          description="The event is hidden first. The server then removes its registrations, attendance records, and tracked cover photo before deleting the event. Awarded Green Points and award history are retained. Photo cleanup can also retry in the background. Older photos without a tracked file path require separate cleanup."
          confirmLabel="Delete event"
          cancelLabel="Keep event"
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
