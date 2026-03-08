import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../layout/DashboardLayout';
import { EventStatsOverview } from '../components/EventStatsOverview';
import { EventParticipantsDrawer } from '../components/EventParticipantsDrawer';

export const EventManager = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
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
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const snapshot = await getDocs(collection(db, 'events'));
    const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    eventsData.sort((a, b) => new Date(b.createdAt?.toDate?.() || b.createdAt) - new Date(a.createdAt?.toDate?.() || a.createdAt));
    setEvents(eventsData);
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
      setShowForm(false);
      setEditingId(null);
      fetchEvents();
      alert(editingId ? 'Event updated!' : 'Event created!');
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event');
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
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this event? All registrations will be lost.')) return;
    
    try {
      const regsQuery = query(collection(db, 'eventRegistrations'), where('eventId', '==', id));
      const regsSnap = await getDocs(regsQuery);
      await Promise.all(regsSnap.docs.map(d => deleteDoc(d.ref)));
      await deleteDoc(doc(db, 'events', id));
      alert('Event deleted');
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, 'events', id), { status });
      alert(`Event marked as ${status}`);
      fetchEvents();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const viewParticipants = (event) => {
    setSelectedEvent(event);
    setDrawerOpen(true);
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', date: '', location: '', category: 'cleanup', maxParticipants: '', registrationDeadline: '', pointsReward: '', isPublic: true, imageUrl: '' });
    setImageFile(null);
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

  return (
    <DashboardLayout links={adminLinks} title="Event Manager">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-brand-green">Event Manager</h1>
          <button onClick={() => showForm ? resetForm() : setShowForm(true)} className="btn-primary text-sm md:text-base">
            {showForm ? 'Cancel' : '+ Create Event'}
          </button>
        </div>

        <EventStatsOverview />

        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-brand-green mb-4">{editingId ? 'Edit Event' : 'Create New Event'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Event Title *</label>
                  <input type="text" placeholder="Beach Cleanup Drive" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-3 border rounded-xl" required />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                  <textarea placeholder="Join us for a community beach cleanup..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 border rounded-xl h-32" required />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 border rounded-xl" required>
                    <option value="cleanup">Cleanup</option>
                    <option value="tree-planting">Tree Planting</option>
                    <option value="workshop">Workshop</option>
                    <option value="awareness">Awareness Campaign</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Event Date *</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 border rounded-xl" required />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location *</label>
                  <input type="text" placeholder="Central Park" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full px-4 py-3 border rounded-xl" required />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Registration Deadline</label>
                  <input type="date" value={formData.registrationDeadline} onChange={(e) => setFormData({...formData, registrationDeadline: e.target.value})} className="w-full px-4 py-3 border rounded-xl" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Max Participants</label>
                  <input type="number" placeholder="50" value={formData.maxParticipants} onChange={(e) => setFormData({...formData, maxParticipants: e.target.value})} className="w-full px-4 py-3 border rounded-xl" min="1" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Points Reward</label>
                  <input type="number" placeholder="20" value={formData.pointsReward} onChange={(e) => setFormData({...formData, pointsReward: e.target.value})} className="w-full px-4 py-3 border rounded-xl" min="0" />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Event Image</label>
                  <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="w-full px-4 py-3 border rounded-xl" />
                  {formData.imageUrl && !imageFile && (
                    <p className="text-sm text-gray-500 mt-1">Current image uploaded</p>
                  )}
                </div>
                
                <div className="md:col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="isPublic" checked={formData.isPublic} onChange={(e) => setFormData({...formData, isPublic: e.target.checked})} className="w-5 h-5" />
                  <label htmlFor="isPublic" className="text-sm font-semibold text-gray-700">Public Event (visible to all)</label>
                </div>
              </div>
              
              <button type="submit" disabled={uploading} className="w-full btn-primary disabled:opacity-50">
                {uploading ? 'Uploading...' : editingId ? 'Update Event' : 'Create Event'}
              </button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {events.map(event => (
            <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-brand-green mb-1">{event.title}</h3>
                  <span className="text-xs text-gray-500 uppercase">{event.category || 'General'}</span>
                </div>
                {getStatusBadge(event)}
              </div>
              
              {event.imageUrl && (
                <img src={event.imageUrl} alt={event.title} className="w-full h-32 object-cover rounded-xl mb-3" />
              )}
              
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>
              
              <div className="space-y-1 text-sm text-gray-500 mb-3">
                <p>📅 {event.date}</p>
                <p>📍 {event.location}</p>
                {event.maxParticipants && (
                  <p>👥 {event.registeredCount || 0} / {event.maxParticipants} registered</p>
                )}
                {event.pointsReward && (
                  <p className="text-brand-green font-semibold">🏆 +{event.pointsReward} points</p>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button onClick={() => viewParticipants(event)} className="flex-1 px-3 py-2 bg-purple-500 text-white rounded-lg text-sm font-semibold min-h-[44px]">
                  Participants ({event.registeredCount || 0})
                </button>
                <button onClick={() => handleEdit(event)} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold min-h-[44px]">Edit</button>
              </div>
              
              <div className="flex gap-2 mt-2">
                {event.status !== 'cancelled' && (
                  <select 
                    value={event.status || 'upcoming'} 
                    onChange={(e) => updateStatus(event.id, e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                )}
                <button onClick={() => handleDelete(event.id)} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold min-h-[44px]">Delete</button>
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
      </div>
    </DashboardLayout>
  );
};
