import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, getDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

export const EventParticipantsDrawer = ({ event, isOpen, onClose, onUpdate }) => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && event) {
      fetchParticipants();
    }
  }, [isOpen, event]);

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'eventRegistrations'), where('eventId', '==', event.id));
      const snapshot = await getDocs(q);
      
      const participantsData = await Promise.all(
        snapshot.docs.map(async (regDoc) => {
          const reg = { id: regDoc.id, ...regDoc.data() };
          const userDoc = await getDoc(doc(db, 'users', reg.userId));
          return {
            ...reg,
            user: userDoc.exists() ? userDoc.data() : null
          };
        })
      );
      
      setParticipants(participantsData);
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (regId, userId, attended) => {
    try {
      const updates = { attended };
      
      if (attended && event.pointsReward) {
        updates.pointsAwarded = event.pointsReward;
        await updateDoc(doc(db, 'users', userId), {
          greenPoints: increment(event.pointsReward)
        });
      }
      
      await updateDoc(doc(db, 'eventRegistrations', regId), updates);
      alert(`Attendance marked as ${attended ? 'attended' : 'absent'}`);
      fetchParticipants();
      onUpdate?.();
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance');
    }
  };

  const removeParticipant = async (regId) => {
    if (!confirm('Remove this participant?')) return;
    
    try {
      await deleteDoc(doc(db, 'eventRegistrations', regId));
      await updateDoc(doc(db, 'events', event.id), {
        registeredCount: increment(-1)
      });
      alert('Participant removed');
      fetchParticipants();
      onUpdate?.();
    } catch (error) {
      console.error('Error removing participant:', error);
      alert('Failed to remove participant');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full md:w-[500px] bg-white shadow-2xl z-50 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-brand-green">Participants</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <h3 className="font-bold text-lg">{event.title}</h3>
            <p className="text-sm text-gray-500">📅 {event.date}</p>
            <p className="text-sm text-gray-600 mt-2">
              {participants.length} registered / {event.maxParticipants || '∞'} max
            </p>
          </div>

          {loading ? (
            <p className="text-center py-8 text-gray-500">Loading...</p>
          ) : participants.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No participants yet</p>
          ) : (
            <div className="space-y-3">
              {participants.map(p => (
                <div key={p.id} className="bg-gray-50 rounded-xl p-4 border">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{p.user?.displayName || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{p.user?.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Registered: {new Date(p.registeredAt?.toDate?.() || p.registeredAt).toLocaleDateString()}
                      </p>
                    </div>
                    {p.attended === true && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        ✓ Attended
                      </span>
                    )}
                    {p.attended === false && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                        Absent
                      </span>
                    )}
                  </div>

                  {new Date(event.date) < new Date() && p.attended === undefined && (
                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={() => markAttendance(p.id, p.userId, true)}
                        className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold"
                      >
                        Mark Attended
                      </button>
                      <button
                        onClick={() => markAttendance(p.id, p.userId, false)}
                        className="flex-1 px-3 py-2 bg-gray-400 text-white rounded-lg text-sm font-semibold"
                      >
                        Mark Absent
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => removeParticipant(p.id)}
                    className="w-full px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
