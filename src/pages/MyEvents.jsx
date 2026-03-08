import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../layout/DashboardLayout';

export const MyEvents = () => {
  const { currentUser } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(true);

  const memberLinks = [
    { path: '/member', label: 'Dashboard' },
    { path: '/member/profile', label: 'My Profile' },
    { path: '/member/activities', label: 'My Activities' },
    { path: '/member/events', label: 'My Events' },
  ];

  useEffect(() => {
    fetchMyEvents();
  }, [currentUser]);

  const fetchMyEvents = async () => {
    try {
      const q = query(collection(db, 'eventRegistrations'), where('userId', '==', currentUser.uid));
      const snapshot = await getDocs(q);
      const regs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRegistrations(regs);

      // Fetch event details
      const eventPromises = regs.map(reg => getDoc(doc(db, 'events', reg.eventId)));
      const eventDocs = await Promise.all(eventPromises);
      const eventsMap = {};
      eventDocs.forEach(eventDoc => {
        if (eventDoc.exists()) {
          eventsMap[eventDoc.id] = { id: eventDoc.id, ...eventDoc.data() };
        }
      });
      setEvents(eventsMap);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingRegs = registrations.filter(reg => {
    const event = events[reg.eventId];
    return event && new Date(event.date) >= new Date();
  });

  const pastRegs = registrations.filter(reg => {
    const event = events[reg.eventId];
    return event && new Date(event.date) < new Date();
  });

  const attendedRegs = pastRegs.filter(reg => reg.attended === true);
  const missedRegs = pastRegs.filter(reg => reg.attended === false);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <DashboardLayout links={memberLinks} title="My Events">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Upcoming Events */}
        <div>
          <h2 className="text-2xl font-bold text-brand-green mb-4">Upcoming Events ({upcomingRegs.length})</h2>
          {upcomingRegs.length === 0 ? (
            <p className="text-gray-500">No upcoming events registered</p>
          ) : (
            <div className="space-y-4">
              {upcomingRegs.map(reg => {
                const event = events[reg.eventId];
                if (!event) return null;
                return (
                  <div key={reg.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-brand-green">{event.title}</h3>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        Registered
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{event.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>📅 {event.date}</span>
                      <span>📍 {event.location}</span>
                      {event.pointsReward && <span className="text-brand-green font-semibold">🏆 +{event.pointsReward} points</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Attended Events */}
        {attendedRegs.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Attended Events ({attendedRegs.length})</h2>
            <div className="space-y-4">
              {attendedRegs.map(reg => {
                const event = events[reg.eventId];
                if (!event) return null;
                return (
                  <div key={reg.id} className="bg-green-50 rounded-2xl border border-green-200 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-brand-green">{event.title}</h3>
                      <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                        ✓ Attended
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span>📅 {event.date}</span>
                      {reg.pointsAwarded && <span className="text-brand-green font-semibold">+{reg.pointsAwarded} points earned</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Missed Events */}
        {missedRegs.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Missed Events ({missedRegs.length})</h2>
            <div className="space-y-4">
              {missedRegs.map(reg => {
                const event = events[reg.eventId];
                if (!event) return null;
                return (
                  <div key={reg.id} className="bg-gray-100 rounded-2xl p-5 opacity-75">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-700">{event.title}</h3>
                      <span className="px-3 py-1 bg-gray-300 text-gray-700 text-xs font-semibold rounded-full">
                        Missed
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">📅 {event.date}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {registrations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">You haven't registered for any events yet</p>
            <a href="/events" className="btn-primary inline-block">Browse Events</a>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
