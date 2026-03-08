import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, deleteDoc, query, where, doc, setDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { EventDetailsModal } from '../components/EventDetailsModal';

export const Events = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    fetchEvents();
    if (currentUser) {
      fetchMyRegistrations();
    }
  }, [currentUser]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchEvents = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'events'));
      const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      eventsData.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
      setEvents(eventsData.filter(e => e.isPublic !== false && e.status !== 'cancelled'));
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRegistrations = async () => {
    if (!currentUser?.uid) return;
    try {
      const q = query(collection(db, 'eventRegistrations'), where('userId', '==', currentUser.uid));
      const snapshot = await getDocs(q);
      setMyRegistrations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching registrations:', error);
      setMyRegistrations([]);
    }
  };

  const isRegistered = (eventId) => {
    return myRegistrations.some(reg => reg.eventId === eventId);
  };

  const handleRegister = async (eventId) => {
    if (!currentUser?.uid) {
      alert('Please log in to register');
      return;
    }
    try {
      const event = events.find(e => e.id === eventId);
      if (!event) return;
      
      if (isRegistered(eventId)) {
        alert('You are already registered for this event');
        return;
      }
      
      if (event.registrationDeadline && new Date(event.registrationDeadline) < new Date()) {
        alert('Registration deadline has passed');
        return;
      }
      
      if (event.maxParticipants && (event.registeredCount || 0) >= event.maxParticipants) {
        alert('Event is full');
        return;
      }
      
      const registrationId = `${currentUser.uid}_${eventId}`;
      await setDoc(doc(db, 'eventRegistrations', registrationId), {
        userId: currentUser.uid,
        eventId,
        registeredAt: new Date(),
        status: 'registered'
      });

      await runTransaction(db, async (transaction) => {
        const eventRef = doc(db, 'events', eventId);
        const eventDoc = await transaction.get(eventRef);
        if (eventDoc.exists()) {
          transaction.update(eventRef, {
            registeredCount: (eventDoc.data().registeredCount || 0) + 1
          });
        }
      });

      alert('Successfully registered for event!');
      fetchEvents();
      fetchMyRegistrations();
      setModalOpen(false);
    } catch (error) {
      console.error('Error registering:', error);
      alert(error.code === 'permission-denied' ? 'Registration failed. Please ensure your account is active.' : `Failed to register: ${error.message}`);
    }
  };

  const handleUnregister = async (eventId) => {
    if (!currentUser?.uid) return;
    try {
      const registrationId = `${currentUser.uid}_${eventId}`;
      await deleteDoc(doc(db, 'eventRegistrations', registrationId));
      
      await runTransaction(db, async (transaction) => {
        const eventRef = doc(db, 'events', eventId);
        const eventDoc = await transaction.get(eventRef);
        if (eventDoc.exists()) {
          transaction.update(eventRef, {
            registeredCount: Math.max(0, (eventDoc.data().registeredCount || 0) - 1)
          });
        }
      });

      alert('Successfully unregistered from event');
      fetchEvents();
      fetchMyRegistrations();
      setModalOpen(false);
    } catch (error) {
      console.error('Error unregistering:', error);
      alert('Failed to unregister from event');
    }
  };

  const openEventDetails = (event) => {
    setSelectedEvent(event);
    setModalOpen(true);
  };

  const now = new Date();
  const upcomingEvents = events.filter(e => e?.date && new Date(e.date) >= now);
  const pastEvents = events.filter(e => e?.date && new Date(e.date) < now);
  
  const filteredEvents = useMemo(() => {
    let filtered = upcomingEvents;
    if (filter !== 'all') {
      filtered = filtered.filter(e => e.category === filter);
    }
    if (debouncedSearch.trim()) {
      const search = debouncedSearch.toLowerCase();
      filtered = filtered.filter(e => 
        e.title?.toLowerCase().includes(search) ||
        e.description?.toLowerCase().includes(search) ||
        e.location?.toLowerCase().includes(search) ||
        e.category?.toLowerCase().includes(search)
      );
    }
    return filtered;
  }, [upcomingEvents, filter, debouncedSearch]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-brand-green to-green-600 rounded-3xl p-8 md:p-12 mb-12 text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Join Our Events</h1>
          <p className="text-lg md:text-xl opacity-90 mb-6">Participate in environmental activities and earn Green Points!</p>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
              <p className="text-sm opacity-80">Upcoming Events</p>
              <p className="text-2xl font-bold">{upcomingEvents.length}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
              <p className="text-sm opacity-80">Your Registrations</p>
              <p className="text-2xl font-bold">{myRegistrations.length}</p>
            </div>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search events by title, description, location, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-green focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'cleanup', 'tree-planting', 'workshop'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all ${
                filter === cat ? 'bg-brand-green text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {cat === 'all' ? 'All Events' : cat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </button>
          ))}
        </div>
        
        <h2 className="text-3xl font-bold text-brand-green mb-6">
          {debouncedSearch ? 'Search Results' : 'Upcoming Events'}
        </h2>
        
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-2">
              {debouncedSearch ? 'No events match your search.' : 'No upcoming events in this category'}
            </p>
            {debouncedSearch && (
              <button onClick={() => setSearchQuery('')} className="text-brand-green font-semibold hover:underline">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredEvents.map(event => {
              const registered = isRegistered(event.id);
              const spotsLeft = (event.maxParticipants || 0) - (event.registeredCount || 0);
              
              return (
                <div 
                  key={event.id} 
                  onClick={() => openEventDetails(event)}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all cursor-pointer"
                >
                  {event.imageUrl && (
                    <img src={event.imageUrl} alt={event.title} className="w-full h-40 object-cover" />
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                        {event.category?.toUpperCase() || 'EVENT'}
                      </span>
                      {registered && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                          ✓ Registered
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-brand-green mb-2">{event.title}</h3>
                    <p className="text-gray-600 mb-4 text-sm line-clamp-2">{event.description}</p>
                    <div className="space-y-2 text-sm text-gray-500">
                      <p>📅 {event.date}</p>
                      <p>📍 {event.location}</p>
                      {event.maxParticipants && (
                        <p className={spotsLeft <= 5 ? 'text-red-500 font-semibold' : ''}>
                          👥 {spotsLeft} spots left
                        </p>
                      )}
                      {event.pointsReward && (
                        <p className="text-brand-green font-semibold">🏆 +{event.pointsReward} points</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pastEvents.length > 0 && (
          <>
            <h2 className="text-2xl font-bold text-gray-700 mb-6 mt-12">Past Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents.map(event => (
                <div key={event.id} className="bg-gray-100 rounded-2xl p-5 opacity-75">
                  <h3 className="text-lg font-bold text-gray-700 mb-2">{event.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{event.description}</p>
                  <p className="text-sm text-gray-500">📅 {event.date}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <EventDetailsModal
        event={selectedEvent}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onRegister={handleRegister}
        onUnregister={handleUnregister}
        isRegistered={selectedEvent ? isRegistered(selectedEvent.id) : false}
        currentUserId={currentUser?.uid}
      />
    </div>
  );
};
