import assert from 'node:assert/strict';
import test from 'node:test';
import { eventDate, eventStatus, formatEventDate } from '../functions/lib/eventTime.mjs';

test('date-only events stay open through the last millisecond of the Nairobi day', () => {
  const event = { date: '2027-02-03', status: 'upcoming' };
  assert.equal(eventDate(event.date).toISOString(), '2027-02-03T20:59:59.999Z');
  assert.equal(eventStatus(event, Date.parse('2027-02-03T20:59:59.999Z')), 'upcoming');
  assert.equal(eventStatus(event, Date.parse('2027-02-03T21:00:00Z')), 'completed');
  assert.equal(formatEventDate(event.date), formatEventDate('2027-02-02T21:00:00Z'));
  assert.equal(eventDate('2027-02-30'), null);
});

test('timestamp events and explicit cancellation/completion share the same lifecycle', () => {
  const date = { toDate: () => new Date('2027-02-03T11:00:00Z') };
  assert.equal(eventStatus({ date }, Date.parse('2027-02-03T12:00:00Z')), 'completed');
  assert.equal(eventStatus({ date, status: 'cancelled' }, 0), 'cancelled');
  assert.equal(eventStatus({ date, status: 'completed' }, 0), 'completed');
});
