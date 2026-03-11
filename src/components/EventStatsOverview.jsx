import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

export const EventStatsOverview = () => {
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0,
    totalRegistrations: 0,
    attendanceRate: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const eventsSnap = await getDocs(collection(db, 'events'));
      const events = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const eventsById = new Map(events.map((e) => [e.id, e]));
      
      const now = new Date();
      const upcoming = events.filter(e => e.status === 'upcoming' || (new Date(e.date) >= now && !e.status));
      const completed = events.filter(e => e.status === 'completed' || (new Date(e.date) < now && e.status !== 'cancelled'));
      
      const regsSnap = await getDocs(collection(db, 'eventRegistrations'));
      const unique = new Map(); // key: userId_eventId -> reg
      regsSnap.docs.forEach((d) => {
        const r = d.data();
        if (!r?.userId || !r?.eventId) return;
        if (!eventsById.has(r.eventId)) return; // ignore orphan/legacy regs
        const key = `${r.userId}_${r.eventId}`;
        const prev = unique.get(key);
        const prevTs = prev?.registeredAt?.toDate?.() ? prev.registeredAt.toDate().getTime() : new Date(prev?.registeredAt ?? 0).getTime();
        const nextTs = r?.registeredAt?.toDate?.() ? r.registeredAt.toDate().getTime() : new Date(r?.registeredAt ?? 0).getTime();
        if (!prev || nextTs > prevTs) unique.set(key, r);
      });
      const registrations = Array.from(unique.values());
      
      const attended = registrations.filter(r => r.attended === true).length;
      const eligible = registrations.filter(r => {
        const event = eventsById.get(r.eventId);
        return event && new Date(event.date) < now;
      }).length;
      
      setStats({
        total: events.length,
        upcoming: upcoming.length,
        completed: completed.length,
        totalRegistrations: registrations.length,
        attendanceRate: eligible > 0 ? Math.round((attended / eligible) * 100) : 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <p className="text-sm text-gray-500">Total Events</p>
        <p className="text-2xl font-bold text-brand-green">{stats.total}</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <p className="text-sm text-gray-500">Upcoming</p>
        <p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <p className="text-sm text-gray-500">Completed</p>
        <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <p className="text-sm text-gray-500">Registrations</p>
        <p className="text-2xl font-bold text-purple-600">{stats.totalRegistrations}</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <p className="text-sm text-gray-500">Attendance</p>
        <p className="text-2xl font-bold text-orange-600">{stats.attendanceRate}%</p>
      </div>
    </div>
  );
};
