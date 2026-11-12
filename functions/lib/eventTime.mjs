const eventTimeZone = 'Africa/Nairobi';
const dateOnly = /^\d{4}-\d{2}-\d{2}$/;

function eventDate(value, endOfDay = true) {
  if (!value) return null;
  const calendarDate = typeof value === 'string' && dateOnly.test(value);
  if (calendarDate && new Date(`${value}T00:00:00Z`).toJSON()?.slice(0, 10) !== value) return null;
  const result = value.toDate?.() ?? new Date(calendarDate
    ? `${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}+03:00`
    : value);
  return Number.isFinite(result.getTime()) ? result : null;
}

function eventStatus(event, now = Date.now()) {
  if (event.status === 'cancelled' || event.deleting) return 'cancelled';
  if (event.status === 'completed') return 'completed';
  const end = eventDate(event.date);
  return end && end.getTime() >= now ? 'upcoming' : 'completed';
}

function formatEventDate(value) {
  const date = eventDate(value, false);
  return date ? new Intl.DateTimeFormat('en-KE', {
    timeZone: eventTimeZone, year: 'numeric', month: 'short', day: 'numeric',
  }).format(date) : '';
}

export { eventDate, eventStatus, formatEventDate, eventTimeZone };
