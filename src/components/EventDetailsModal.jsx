import { Dialog } from './ui/Dialog';
import { eventDate, eventStatus, formatEventDate } from '../../functions/lib/eventTime.mjs';
import { useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ui/ToastProvider';


export const EventDetailsModal = ({ event, isOpen, onClose, onRegister, onUnregister, isRegistered, currentUserId }) => {
  const titleId = useId();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const toast = useToast();
  const navigate = useNavigate();
  const eventId = event?.id;
  useEffect(() => {
    setError('');
    setShareMessage('');
  }, [eventId]);

  if (!isOpen || !event) return null;

  const spotsLeft = (event.maxParticipants || 0) - (event.registeredCount || 0);
  const isFull = event.registrationCountVersion >= 1 && event.maxParticipants && spotsLeft <= 0;
  const isPast = eventStatus(event) !== 'upcoming';
  const isDeadlinePassed = event.registrationDeadline && (eventDate(event.registrationDeadline)?.getTime() ?? 0) < Date.now();
  const canRegisterBase = !isRegistered && !isFull && !isPast && !isDeadlinePassed;
  const needsAuth = !currentUserId;
  const canClickRegister = canRegisterBase && !loading;

  const updateRegistration = async action => {
    setLoading(true);
    setError('');
    try {
      const message = await action(event.id);
      if (message) setError(message);
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = async ({ currentTarget: button }) => {
    const url = new URL('/events', window.location.origin);
    url.searchParams.set('event', event.id);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url.href);
      } else {
        const input = document.createElement('textarea');
        input.value = url.href;
        input.readOnly = true;
        input.className = 'sr-only';
        button.closest('dialog').append(input);
        try {
          input.select();
          if (!document.execCommand('copy')) throw new Error('Clipboard unavailable');
        } finally {
          input.remove();
          button.focus();
        }
      }
      setShareMessage('Link copied.');
    } catch {
      setShareMessage('Copy the link from the address bar.');
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} titleId={titleId} className="dialog-panel max-w-2xl">
          {event.imageUrl && (
            <img src={event.imageUrl} alt={event.title} className="w-full h-48 md:h-64 object-cover rounded-t-2xl" />
          )}
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 id={titleId} className="text-2xl font-bold text-brand-green mb-1">{event.title}</h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  {event.category?.toUpperCase() || 'EVENT'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyShareLink}
                  className="px-3 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition"
                >
                  Copy link
                </button>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Close">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <p role="status" className="text-sm font-semibold text-leaf empty:hidden">{shareMessage}</p>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted">Description</p>
                <p className="text-gray-700">{event.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted">Date</p>
                  <p className="font-semibold">📅 {formatEventDate(event.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted">Location</p>
                  <p className="font-semibold">📍 {event.location}</p>
                </div>
                {event.registrationDeadline && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted">Registration Deadline</p>
                    <p className={`font-semibold ${isDeadlinePassed ? 'text-danger' : ''}`}>
                      ⏰ {formatEventDate(event.registrationDeadline)} {isDeadlinePassed && '(Passed)'}
                    </p>
                  </div>
                )}
              </div>

              {event.maxParticipants && event.registrationCountVersion >= 1 ? (
                <div>
                  <p className="text-sm text-muted">Availability</p>
                  <div className="mt-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{event.registeredCount || 0} / {event.maxParticipants} registered</span>
                      <span className={spotsLeft <= 5 ? 'text-danger font-semibold' : 'text-gray-600'}>
                        {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${spotsLeft <= 5 ? 'bg-red-500' : 'bg-brand-green'}`}
                        style={{ width: `${Math.min(((event.registeredCount || 0) / event.maxParticipants) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {event.pointsReward && (
                <div className="bg-green-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600">Attendance Reward</p>
                  <p className="text-2xl font-bold text-brand-green">+{event.pointsReward} Green Points</p>
                </div>
              )}

              {isPast && (
                <div className="bg-gray-100 p-4 rounded-xl text-center">
                  <p className="text-gray-600">This event has ended</p>
                </div>
              )}

              {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-danger">{error}</p>}
              {!isPast && isDeadlinePassed && !isRegistered && (
                <div className="bg-yellow-50 p-4 rounded-xl text-center">
                  <p className="text-yellow-700 font-semibold">Registration deadline has passed</p>
                </div>
              )}

              {!isPast && (
                <div className="pt-4 space-y-3">
                  {isRegistered ? (
                    <>
                      <div className="bg-green-50 p-4 rounded-xl text-center">
                        <p className="text-green-700 font-semibold">✓ You're registered for this event!</p>
                      </div>
                      <button 
                        onClick={() => updateRegistration(onUnregister)}
                        disabled={loading}
                        className="w-full btn-danger"
                      >
                        {loading ? 'Processing...' : 'Unregister'}
                      </button>
                    </>
                  ) : (
                    <>
                      {needsAuth && canRegisterBase ? (
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-center">
                          <p className="text-sm font-semibold text-emerald-800">
                            You need an account to register for this event.
                          </p>
                          <p className="mt-1 text-xs text-emerald-800/80">Log in or sign up to reserve your spot.</p>
                        </div>
                      ) : null}

                      <button
                        onClick={() => {
                          if (!canRegisterBase) return;
                          if (needsAuth) {
                            toast.info('Account required', 'Please log in or sign up to register for events.');
                            onClose?.();
                            navigate('/login');
                            return;
                          }
                          updateRegistration(onRegister);
                        }}
                        disabled={!canClickRegister}
                        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading
                          ? 'Processing...'
                          : isFull
                            ? 'Event Full'
                            : isDeadlinePassed
                              ? 'Registration Closed'
                              : needsAuth
                                ? 'Login to Register'
                                : 'Register for Event'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
    </Dialog>
  );
};
