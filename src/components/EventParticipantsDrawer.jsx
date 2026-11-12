import { callFunction } from '../firebase/callable';
import { eventStatus, formatEventDate } from '../../functions/lib/eventTime.mjs';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useToast } from './ui/ToastProvider';
import { ConfirmDialog } from './ui/ConfirmDialog';

export const EventParticipantsDrawer = ({ event, isOpen, onClose, onUpdate }) => {
  const toast = useToast();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState('');
  const [saving, setSaving] = useState(false);

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

      // Dedupe by userId (legacy data may include duplicates).
      const regs = snapshot.docs.map((regDoc) => ({ id: regDoc.id, ...regDoc.data() }));
      regs.sort((a, b) => {
        const at = a?.registeredAt?.toDate?.() ? a.registeredAt.toDate().getTime() : new Date(a?.registeredAt ?? 0).getTime();
        const bt = b?.registeredAt?.toDate?.() ? b.registeredAt.toDate().getTime() : new Date(b?.registeredAt ?? 0).getTime();
        return bt - at;
      });

      const byUser = new Map();
      for (const r of regs) {
        if (!r?.userId) continue;
        if (!byUser.has(r.userId)) byUser.set(r.userId, r);
      }

      const uniqueRegs = Array.from(byUser.values());
      const participantsData = await Promise.all(
        uniqueRegs.map(async (reg) => {
          const userDoc = await getDoc(doc(db, 'users', reg.userId));
          return { ...reg, user: userDoc.exists() ? userDoc.data() : null };
        })
      );

      setParticipants(participantsData);
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateParticipant = async (userId, attended) => {
    setSaving(true);
    try {
      const remove = attended === undefined;
      await callFunction(remove ? 'removeEventParticipant' : 'markEventAttendance', {
        eventId: event.id, userId, ...(remove ? {} : { attended }),
      });
      toast.success(remove ? 'Participant removed' : 'Attendance updated');
      await fetchParticipants();
      onUpdate?.();
    } catch (error) {
      toast.error('Update failed', error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full md:w-[500px] bg-white shadow-2xl z-50 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-brand-green">Participants</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Close participants">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-bold text-lg">{event.title}</h3>
            <p className="text-sm text-gray-500">📅 {formatEventDate(event.date)}</p>
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
                      <p className="font-semibold">{p.user?.name || p.user?.displayName || 'Unknown'}</p>
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

                  {eventStatus(event) === 'completed' && (
                    <div className="flex gap-2 mb-2">
                      <button
                        disabled={saving || p.attended === true}
                        onClick={() => updateParticipant(p.userId, true)}
                        className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold"
                      >
                        Mark Attended
                      </button>
                      <button
                        disabled={saving || p.attended === false}
                        onClick={() => updateParticipant(p.userId, false)}
                        className="flex-1 px-3 py-2 bg-gray-400 text-white rounded-lg text-sm font-semibold"
                      >
                        Mark Absent
                      </button>
                    </div>
                  )}

                  <button
                    disabled={saving || typeof p.attended === 'boolean'}
                    onClick={() => setConfirmRemoveId(p.userId)}
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

      <ConfirmDialog
        open={!!confirmRemoveId}
        title="Remove this participant?"
        description="This will delete their registration and decrement the event’s registered count."
        confirmLabel="Remove"
        tone="danger"
        onCancel={() => setConfirmRemoveId('')}
        onConfirm={async () => {
          const id = confirmRemoveId;
          setConfirmRemoveId('');
          await updateParticipant(id);
        }}
      />
    </>
  );
};
