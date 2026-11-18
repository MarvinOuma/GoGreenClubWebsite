import { FiCalendar, FiCheck, FiMapPin } from 'react-icons/fi';
import { nextPublicEvents } from '../firebase/eventQueries';
import { eventDate, eventStatus, formatEventDate } from '../../functions/lib/eventTime.mjs';
import { useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layout/DashboardLayout';
import { StatCard } from '../components/ui/StatCard';


const badges = [
  { title: 'First Step', points: 50 },
  { title: 'Eco Warrior', points: 250 },
  { title: 'Tree Planter', points: 500 },
  { title: 'Champion', points: 1000 },
];

export const MemberDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [discoverEvents, setDiscoverEvents] = useState([]);
  const [eventsJoined, setEventsJoined] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let current = true;
    const fetchData = async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));


        // Fetch user's event registrations
        const regsQuery = query(
          collection(db, 'eventRegistrations'),
          where('userId', '==', currentUser.uid)
        );
        const regsSnapshot = await getDocs(regsQuery);
        const registrations = regsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const eventIds = Array.from(new Set(registrations.map(record => record.eventId).filter(Boolean)));

        const [joined, discover] = await Promise.all([
          Promise.allSettled(eventIds.map(id => getDoc(doc(db, 'events', id)))),
          nextPublicEvents(3).catch(() => []),
        ]);
        if (!current) return;
        setUserData(userDoc.data());
        setEventsJoined(eventIds.length);
        setUpcomingEvents(joined
          .filter(result => result.status === 'fulfilled' && result.value.exists())
          .map(({ value }) => ({ id: value.id, ...value.data() }))
          .filter(event => eventStatus(event) === 'upcoming')
          .sort((a, b) => eventDate(a.date) - eventDate(b.date))
          .slice(0, 4));
        setDiscoverEvents(discover);
      } catch (error) {
        console.error('Error fetching data:', error);
        if (current) setLoadError(true);
      } finally {
        if (current) setLoading(false);
      }
    };
    fetchData();
    return () => { current = false; };
  }, [currentUser, retry]);

  const greenPoints = Number.isFinite(userData?.greenPoints) ? userData.greenPoints : 0;
  const nextBadge = badges.find(badge => badge.points > greenPoints);
  const earnedBadge = badges.findLast(badge => badge.points <= greenPoints);
  const previousThreshold = earnedBadge?.points ?? 0;
  const pointsToNext = nextBadge ? nextBadge.points - greenPoints : 0;
  const progress = nextBadge ? Math.max(0, greenPoints - previousThreshold) : 100;
  const milestoneRange = nextBadge ? nextBadge.points - previousThreshold : 100;

  return (
    <DashboardLayout>
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
        ) : loadError ? (
          <div className="panel p-5">
            <h1 className="text-2xl font-semibold text-forest">Impact Hub</h1>
            <p role="alert" className="my-3 text-danger">Your dashboard couldn’t be loaded.</p>
            <button type="button" onClick={() => setRetry(value => value + 1)} className="btn-secondary">Try again</button>
          </div>
        ) : (
          <>
        <div className="dashboard-hero">
          <p className="text-sm font-semibold">Impact Hub</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            {userData?.name ? `${userData.name}` : 'Member Dashboard'}
          </h1>
          <p className="mt-2 text-sm">
            Track your points, upcoming events, and milestones.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button onClick={() => navigate('/member/activities')} className="btn-primary bg-lime-accent text-ink hover:bg-white">
              Log Activity
            </button>
            <button onClick={() => navigate('/events')} className="btn-secondary">
              Browse Events
            </button>
          </div>
        </div>

        <section aria-labelledby="member-impact" className="panel grid gap-5 p-4 sm:p-6 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 id="member-impact" className="text-xl font-semibold text-forest">Your impact</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-semibold text-muted">Green Points</dt>
                <dd className="mt-1 font-display text-4xl font-semibold tabular-nums text-forest">{greenPoints.toLocaleString('en-KE')}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-muted">Impact level</dt>
                <dd className="mt-2 break-words font-display text-xl font-semibold">{earnedBadge?.title ?? 'Beginner'}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-xl bg-ivory p-4">
            <h3 className="font-semibold">{nextBadge ? `Next milestone · ${nextBadge.title}` : 'All milestones reached'}</h3>
            <p className="mt-1 text-sm text-muted">
              {nextBadge ? `${pointsToNext.toLocaleString('en-KE')} points to go · ${nextBadge.points.toLocaleString('en-KE')} points total`
                : 'Your Green Points continue to track your contributions.'}
            </p>
            <progress className="milestone-progress mt-3 h-2 w-full" value={progress} max={milestoneRange} aria-label="Progress toward the next milestone" />
            {greenPoints === 0 && <p className="mt-2 text-sm text-muted">Earn points through approved activities or verified event attendance.</p>}
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Events */}
          <div className="panel p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-semibold text-forest">Your upcoming events</h2>
              <button onClick={() => navigate('/member/events')} className="text-sm font-bold text-emerald-700 hover:underline">
                My events →
              </button>
            </div>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map(event => (
                  <div key={event.id} className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <h3 className="font-extrabold tracking-tight text-gray-900">{event.title}</h3>
                    <p className="mt-1 text-sm text-gray-600"><FiCalendar className="mr-1 inline" aria-hidden="true" /> {formatEventDate(event.date)}</p>
                    <p className="text-sm text-gray-600"><FiMapPin className="mr-1 inline" aria-hidden="true" /> {event.location}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center">
                <p className="text-sm font-semibold text-gray-700">You have no upcoming registrations</p>
                <p className="mt-1 text-sm text-gray-600">Your next registered event will appear here.</p>
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
                      <p className="mt-1 text-xs text-gray-600">{formatEventDate(e.date)} · {e.location}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <section aria-labelledby="member-milestones" className="panel p-5">
            <StatCard label="Events joined" value={eventsJoined} icon={FiCalendar} />
            <h2 id="member-milestones" className="mb-2 mt-5 text-xl font-semibold text-forest">Milestones</h2>
            <ol className="divide-y divide-line">
              {badges.map(({ title, points }) => (
                <li key={title} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <span className="font-semibold">{title}</span>
                  <span className="inline-flex items-center gap-1 text-muted">
                    {greenPoints >= points ? <><FiCheck aria-hidden="true" className="text-leaf" /> Earned</>
                      : `${points.toLocaleString('en-KE')} points`}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};
