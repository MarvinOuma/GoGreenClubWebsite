import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
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
        const registrations = regsSnapshot.docs.map(doc => doc.data());
        setEventsJoined(registrations.length);

        // Fetch upcoming registered events
        const eventIds = registrations.map(r => r.eventId);
        if (eventIds.length > 0) {
          const eventsSnapshot = await getDocs(collection(db, 'events'));
          const allEvents = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const upcoming = allEvents.filter(e => 
            eventIds.includes(e.id) && new Date(e.date) >= new Date()
          );
          setUpcomingEvents(upcoming);
        }
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

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const greenPoints = userData?.greenPoints || 0;
  const nextBadgeProgress = Math.min((greenPoints % 100), 100);

  return (
    <DashboardLayout links={memberLinks} title="Impact Hub">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Green Points" value={greenPoints} icon="🌟" />
          <StatCard label="Events Joined" value={eventsJoined} icon="📅" />
          <StatCard 
            label="Impact Level" 
            value={greenPoints > 100 ? 'Champion' : greenPoints > 50 ? 'Active' : 'Beginner'} 
            icon="🏆" 
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Events */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Upcoming Events</h2>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map(event => (
                  <div key={event.id} className="p-4 bg-green-50 rounded-xl">
                    <h3 className="font-semibold text-brand-green">{event.title}</h3>
                    <p className="text-sm text-gray-600">{event.date}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No upcoming events</p>
            )}
          </div>

          {/* Impact Tracker */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Impact Tracker</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold">Progress to Next Badge</span>
                  <span className="text-sm text-brand-green">{nextBadgeProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-brand-green h-3 rounded-full transition-all" style={{ width: `${nextBadgeProgress}%` }}></div>
                </div>
              </div>
              
              <button onClick={() => navigate('/member/activities')} className="w-full btn-primary min-h-[44px]">
                Log Activity
              </button>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Badges & Milestones</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className={`text-center p-4 rounded-xl ${greenPoints >= 10 ? 'bg-green-50' : 'bg-gray-100 opacity-50'}`}>
              <div className="text-4xl mb-2">🌱</div>
              <p className="text-sm font-semibold">First Step</p>
              <p className="text-xs text-gray-600">10 points</p>
            </div>
            <div className={`text-center p-4 rounded-xl ${greenPoints >= 50 ? 'bg-green-50' : 'bg-gray-100 opacity-50'}`}>
              <div className="text-4xl mb-2">🌿</div>
              <p className="text-sm font-semibold">Eco Warrior</p>
              <p className="text-xs text-gray-600">50 points</p>
            </div>
            <div className={`text-center p-4 rounded-xl ${greenPoints >= 100 ? 'bg-green-50' : 'bg-gray-100 opacity-50'}`}>
              <div className="text-4xl mb-2">🌳</div>
              <p className="text-sm font-semibold">Tree Planter</p>
              <p className="text-xs text-gray-600">100 points</p>
            </div>
            <div className={`text-center p-4 rounded-xl ${greenPoints >= 200 ? 'bg-green-50' : 'bg-gray-100 opacity-50'}`}>
              <div className="text-4xl mb-2">🏆</div>
              <p className="text-sm font-semibold">Champion</p>
              <p className="text-xs text-gray-600">200 points</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
