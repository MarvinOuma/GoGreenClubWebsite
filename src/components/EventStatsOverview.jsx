import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
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
      
      const now = new Date();
      const upcoming = events.filter(e => e.status === 'upcoming' || (new Date(e.date) >= now && !e.status));
      const completed = events.filter(e => e.status === 'completed' || (new Date(e.date) < now && e.status !== 'cancelled'));
      
      const regsSnap = await getDocs(collection(db, 'eventRegistrations'));
      const registrations = regsSnap.docs.map(doc => doc.data());
      
      const attended = registrations.filter(r => r.attended === true).length;
      const eligible = registrations.filter(r => {
        const event = events.find(e => e.id === r.eventId);
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
