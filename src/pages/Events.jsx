import { FiCalendar, FiMapPin } from 'react-icons/fi';
import { eventDate, eventStatus, formatEventDate } from '../../functions/lib/eventTime.mjs';
import { callFunction } from '../firebase/callable';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { EventDetailsModal } from '../components/EventDetailsModal';
import { useToast } from '../components/ui/ToastProvider';


const EventCardSkeleton = () => (
  <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
    <div className="h-40 w-full animate-pulse bg-gray-100" />
    <div className="space-y-3 p-5">
      <div className="flex items-center justify-between">
        <div className="h-5 w-20 animate-pulse rounded-full bg-gray-100" />
        <div className="h-5 w-24 animate-pulse rounded-full bg-gray-100" />
      </div>
      <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
      <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
      <div className="h-3 w-5/6 animate-pulse rounded bg-gray-100" />
    </div>
  </div>
);

export const Events = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(9);
  const [registeredOnly, setRegisteredOnly] = useState(false);

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

  useEffect(() => {
    setVisibleCount(9);
  }, [filter, debouncedSearch]);

  const fetchEvents = async () => {
    try {
      // IMPORTANT: Use a constrained query so this won't fail if private events exist.
      const snapshot = await getDocs(query(collection(db, 'events'), where('isPublic', '==', true)));
      const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      eventsData.sort((a, b) => eventDate(a.date) - eventDate(b.date));
      setEvents(eventsData.filter(e => e.isPublic !== false && e.status !== 'cancelled'));
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Unable to load events right now. Please try again.');
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

  const changeRegistration = async (eventId, register) => {
    if (!currentUser?.uid) {
      toast.info('Login required', 'Please log in to manage event registrations.');
      return;
    }
    try {
      await callFunction(register ? 'registerForEvent' : 'cancelEventRegistration', { eventId });
      toast.success(register ? 'Registered' : 'Registration cancelled');
      closeEventDetails();
      await Promise.all([fetchEvents(), fetchMyRegistrations()]);
    } catch (error) {
      toast.error(register ? 'Registration failed' : 'Cancellation failed', error.message);
    }
  };

  const handleRegister = eventId => changeRegistration(eventId, true);
  const handleUnregister = eventId => changeRegistration(eventId, false);

  const openEventDetails = (event) => {
    setSelectedEvent(event);
    setModalOpen(true);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('event', event.id);
      return next;
    });
  };

  const closeEventDetails = () => {
    setModalOpen(false);
    setSelectedEvent(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('event');
      return next;
    });
  };

  // If someone opens /events?event=<id>, auto-open that event in the modal.
  useEffect(() => {
    const eventId = searchParams.get('event');
    if (!eventId) return;
    if (!events.length) return;
    const found = events.find((e) => e.id === eventId);
    if (found) {
      setSelectedEvent(found);
      setModalOpen(true);
    } else {
      toast.error('Event not found', 'This shared event link may be invalid or the event is no longer public.');
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('event');
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  const upcomingEvents = events.filter(event => eventStatus(event) === 'upcoming');
  const pastEvents = events.filter(event => eventStatus(event) === 'completed');
  
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
    if (registeredOnly && currentUser?.uid) {
      const regSet = new Set(myRegistrations.map((r) => r.eventId));
      filtered = filtered.filter((e) => regSet.has(e.id));
    }
    return filtered;
  }, [upcomingEvents, filter, debouncedSearch, registeredOnly, currentUser?.uid, myRegistrations]);

  const visibleEvents = filteredEvents.slice(0, visibleCount);
  const categoryOptions = useMemo(() => {
    const set = new Set();
    for (const e of upcomingEvents) if (e?.category) set.add(e.category);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [upcomingEvents]);

  const registeredSet = useMemo(() => new Set(myRegistrations.map((r) => r.eventId)), [myRegistrations]);
  const featuredEvent = visibleEvents[0] ?? null;
  const gridEvents = featuredEvent ? visibleEvents.slice(1) : visibleEvents;

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory py-10 sm:py-14">
        <div className="site-container">
          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
            <div className="h-6 w-40 animate-pulse rounded bg-gray-100" />
            <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-gray-100" />
            <div className="mt-6 h-12 w-full animate-pulse rounded-xl bg-gray-100" />
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory py-10 sm:py-14">
      <div className="site-container">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8 sm:mb-10">
          <div>
            <h1 className="site-heading">Join our events</h1>
            <p className="mt-4 max-w-lg text-muted">Find cleanups, workshops, and other ways to take action with the club.</p>
          </div>
          {!error && (
            <dl className="flex gap-6 border-l-2 border-leaf pl-4">
              <div>
                <dt className="text-sm text-muted">Upcoming</dt>
                <dd className="font-display text-2xl font-semibold tabular-nums">{upcomingEvents.length}</dd>
              </div>
              {currentUser && <div>
                <dt className="text-sm text-muted">Registered</dt>
                <dd className="font-display text-2xl font-semibold tabular-nums">{registeredSet.size}</dd>
              </div>}
            </dl>
          )}
        </header>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="relative md:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              aria-label="Search events"
              placeholder="Search events"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300"
            />
            {searchQuery && (
              <button
                aria-label="Clear search"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500">Show</p>
                  <p className="text-sm font-bold text-gray-900">{registeredOnly ? 'Registered only' : 'All events'}</p>
                </div>
                <button
                  type="button"
                  disabled={!currentUser?.uid}
                  onClick={() => setRegisteredOnly((v) => !v)}
                  className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                    !currentUser?.uid
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : registeredOnly
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-white text-gray-900 ring-1 ring-gray-200 hover:bg-gray-50'
                  }`}
                  title={!currentUser?.uid ? 'Login to use this filter' : undefined}
                >
                  Toggle
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {['all', ...categoryOptions].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all ${
                filter === cat ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-emerald-50'
              }`}
            >
              {cat === 'all'
                ? 'All Events'
                : cat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </button>
          ))}
        </div>
        </div>
        
        {error ? (
          <div className="mb-6 rounded-3xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-800">
            {error}
          </div>
        ) : null}

        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-6">
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
          <>
            {featuredEvent ? (
              <div
                className="group relative mb-8 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
              >
                <div className="grid gap-0 md:grid-cols-2">
                  <div className="relative h-56 overflow-hidden bg-gray-100 md:h-full">
                    {featuredEvent.imageUrl ? (
                      <img
                        src={featuredEvent.imageUrl}
                        alt={featuredEvent.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="editorial-cover h-full" aria-hidden="true">
                        <FiCalendar size={38} />
                      </div>
                    )}
                    <div className="absolute left-4 top-4 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                      Featured
                    </div>
                  </div>
                  <div className="p-6 md:p-8">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                        {featuredEvent.category?.toUpperCase() || 'EVENT'}
                      </span>
                      {registeredSet.has(featuredEvent.id) ? (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                          ✓ Registered
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-gray-900">{featuredEvent.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-gray-600 line-clamp-3">{featuredEvent.description}</p>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                      <span>📅 {formatEventDate(featuredEvent.date)}</span>
                      <span>📍 {featuredEvent.location}</span>
                      {featuredEvent.pointsReward ? (
                        <span className="font-bold text-emerald-700">🏆 +{featuredEvent.pointsReward} points</span>
                      ) : null}
                    </div>
                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={() => openEventDetails(featuredEvent)}
                        aria-label={`View details for ${featuredEvent.title}`}
                        className="card-action inline-flex items-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white hover:bg-gray-800"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {gridEvents.map(event => {
                const registered = registeredSet.has(event.id);
                const spotsLeft = (event.maxParticipants || 0) - (event.registeredCount || 0);
                
                return (
                  <div 
                    key={event.id} 
                    className="group relative bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer"
                  >
                    {event.imageUrl ? (
                      <div className="relative h-40 overflow-hidden bg-gray-100">
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="editorial-cover h-40" aria-hidden="true"><FiCalendar size={32} /></div>
                    )}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                          {event.category?.toUpperCase() || 'EVENT'}
                        </span>
                        {registered ? (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                            ✓ Registered
                          </span>
                        ) : null}
                      </div>
                      <h3 className="text-xl font-extrabold tracking-tight text-gray-900 mb-2"><button type="button" className="card-action text-left" onClick={() => openEventDetails(event)}>{event.title}</button></h3>
                      <p className="text-gray-600 mb-4 text-sm line-clamp-2">{event.description}</p>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p className="flex items-center gap-2"><FiCalendar aria-hidden="true" />{formatEventDate(event.date)}</p>
                        <p className="flex items-center gap-2"><FiMapPin aria-hidden="true" />{event.location}</p>
                        {event.maxParticipants && event.registrationCountVersion === 1 ? (
                          <p className={spotsLeft <= 5 ? 'text-red-600 font-bold' : ''}>
                            👥 {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
                          </p>
                        ) : null}
                        {event.pointsReward ? (
                          <p className="text-emerald-700 font-bold">🏆 +{event.pointsReward} points</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {filteredEvents.length > visibleEvents.length ? (
          <div className="flex justify-center pb-8">
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + 9)}
              className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-gray-900 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50 hover:shadow-md"
            >
              Load more
            </button>
          </div>
        ) : null}

        {pastEvents.length > 0 && (
          <>
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-6 mt-12">Past Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents.map(event => (
                <div key={event.id} className="bg-gray-100 rounded-2xl p-5 opacity-75">
                  <h3 className="text-lg font-bold text-gray-700 mb-2">{event.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{event.description}</p>
                  <p className="text-sm text-gray-500">📅 {formatEventDate(event.date)}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <EventDetailsModal
        event={selectedEvent}
        isOpen={modalOpen}
        onClose={closeEventDetails}
        onRegister={handleRegister}
        onUnregister={handleUnregister}
        isRegistered={selectedEvent ? isRegistered(selectedEvent.id) : false}
        currentUserId={currentUser?.uid}
      />
    </div>
  );
};
