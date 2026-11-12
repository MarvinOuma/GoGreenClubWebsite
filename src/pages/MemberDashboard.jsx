import { nextPublicEvents } from '../firebase/eventQueries';
import { eventDate, eventStatus, formatEventDate } from '../../functions/lib/eventTime.mjs';
import { useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layout/DashboardLayout';
import { StatCard } from '../components/ui/StatCard';


export const MemberDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [discoverEvents, setDiscoverEvents] = useState([]);
  const [eventsJoined, setEventsJoined] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        setUserData(userDoc.data());

        // Fetch user's event registrations
        const regsQuery = query(
          collection(db, 'eventRegistrations'),
          where('userId', '==', currentUser.uid)
        );
        const regsSnapshot = await getDocs(regsQuery);
        const registrations = regsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const eventIds = Array.from(new Set(registrations.map(record => record.eventId).filter(Boolean)));
        setEventsJoined(eventIds.length);
        const [joined, discover] = await Promise.all([
          Promise.allSettled(eventIds.map(id => getDoc(doc(db, 'events', id)))),
          nextPublicEvents(3).catch(() => []),
        ]);
        setUpcomingEvents(joined
          .filter(result => result.status === 'fulfilled' && result.value.exists())
          .map(({ value }) => ({ id: value.id, ...value.data() }))
          .filter(event => eventStatus(event) === 'upcoming')
          .sort((a, b) => eventDate(a.date) - eventDate(b.date))
          .slice(0, 4));
        setDiscoverEvents(discover);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  const memberLinks = [
    { path: '/member', label: 'Dashboard' },
    { path: '/member/profile', label: 'My Profile' },
    { path: '/member/activities', label: 'My Activities' },
    { path: '/member/events', label: 'My Events' },
  ];

  const greenPoints = userData?.greenPoints || 0;
  const nextBadge = [50, 250, 500, 1000].find(points => points > greenPoints);
  const nextBadgeProgressPct = nextBadge ? Math.min(100, Math.max(0, Math.round(greenPoints / nextBadge * 100))) : 100;

  return (
    <DashboardLayout links={memberLinks} title="Impact Hub">
      <div className="max-w-6xl mx-auto space-y-6">
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
                  <div className="mt-4 h-8 w-28 animate-pulse rounded bg-gray-100" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className="h-5 w-40 animate-pulse rounded bg-gray-100" />
                  <div className="mt-4 h-24 w-full animate-pulse rounded-xl bg-gray-100" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold text-gray-500">Welcome</p>
          <h1 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
            {userData?.name ? `${userData.name}` : 'Member Dashboard'}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Track your points, upcoming events, and milestones.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button onClick={() => navigate('/member/activities')} className="btn-primary">
              Log Activity
            </button>
            <button onClick={() => navigate('/events')} className="btn-secondary">
              Browse Events
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Green Points" value={greenPoints} icon="🌟" />
          <StatCard label="Events Joined" value={eventsJoined} icon="📅" />
          <StatCard 
            label="Impact Level" 
            value={greenPoints >= 1000 ? 'Champion' : greenPoints >= 500 ? 'Tree Planter' : greenPoints >= 250 ? 'Eco Warrior' : 'Beginner'} 
            icon="🏆" 
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Events */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-xl font-extrabold tracking-tight text-gray-900">Your Upcoming Events</h2>
              <button onClick={() => navigate('/member/events')} className="text-sm font-bold text-emerald-700 hover:underline">
                View all →
              </button>
            </div>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map(event => (
                  <div key={event.id} className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <h3 className="font-extrabold tracking-tight text-gray-900">{event.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">📅 {formatEventDate(event.date)}</p>
                    <p className="text-sm text-gray-600">📍 {event.location}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center">
                <p className="text-sm font-semibold text-gray-700">No upcoming events</p>
                <p className="mt-1 text-sm text-gray-600">Register for an event to see it here.</p>
                <div className="mt-4">
                  <button onClick={() => navigate('/events')} className="btn-secondary">
                    Explore Events
                  </button>
                </div>
              </div>
            )}

            {discoverEvents.length > 0 ? (
              <div className="mt-5">
                <p className="text-xs font-semibold text-gray-500">Discover</p>
                <div className="mt-2 space-y-2">
                  {discoverEvents.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => navigate(`/events?event=${e.id}`)}
                      className="w-full text-left rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm hover:shadow-md transition"
                    >
                      <p className="text-sm font-extrabold tracking-tight text-gray-900">{e.title}</p>
                      <p className="mt-1 text-xs text-gray-600">📅 {formatEventDate(e.date)} · 📍 {e.location}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Impact Tracker */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-xl font-extrabold tracking-tight text-gray-900 mb-4">Impact Tracker</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold">Progress to Next Badge</span>
                  <span className="text-sm text-emerald-700 font-bold">{nextBadgeProgressPct}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-emerald-600 h-3 rounded-full transition-all" style={{ width: `${nextBadgeProgressPct}%` }}></div>
                </div>
              </div>
              
              <button onClick={() => navigate('/member/activities')} className="w-full btn-primary min-h-[44px]">
                Log Activity
              </button>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-xl font-extrabold tracking-tight text-gray-900 mb-4">Badges & Milestones</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className={`text-center p-4 rounded-xl ${greenPoints >= 50 ? 'bg-green-50' : 'bg-gray-100 opacity-50'}`}>
              <div className="text-4xl mb-2">🌱</div>
              <p className="text-sm font-semibold">First Step</p>
              <p className="text-xs text-gray-600">50 points</p>
            </div>
            <div className={`text-center p-4 rounded-xl ${greenPoints >= 250 ? 'bg-green-50' : 'bg-gray-100 opacity-50'}`}>
              <div className="text-4xl mb-2">🌿</div>
              <p className="text-sm font-semibold">Eco Warrior</p>
              <p className="text-xs text-gray-600">250 points</p>
            </div>
            <div className={`text-center p-4 rounded-xl ${greenPoints >= 500 ? 'bg-green-50' : 'bg-gray-100 opacity-50'}`}>
              <div className="text-4xl mb-2">🌳</div>
              <p className="text-sm font-semibold">Tree Planter</p>
              <p className="text-xs text-gray-600">500 points</p>
            </div>
            <div className={`text-center p-4 rounded-xl ${greenPoints >= 1000 ? 'bg-green-50' : 'bg-gray-100 opacity-50'}`}>
              <div className="text-4xl mb-2">🏆</div>
              <p className="text-sm font-semibold">Champion</p>
              <p className="text-xs text-gray-600">1000 points</p>
            </div>
          </div>
        </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};
