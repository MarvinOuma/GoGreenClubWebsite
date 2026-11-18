import { collection, getDocs, limit, orderBy, query, startAfter, Timestamp, where } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { eventDate, eventStatus, eventTimeZone } from '../../functions/lib/eventTime.mjs';

export async function nextPublicEvents(size) {
  const now = new Date();
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: eventTimeZone }).format(now);
  const filters = [today, Timestamp.fromDate(now)];
  const groups = await Promise.all(filters.map(async minimum => {
    const events = [];
    let cursor;
    do {
      const snapshot = await getDocs(query(
        collection(db, 'events'), where('isPublic', '==', true), where('date', '>=', minimum),
        orderBy('date'), ...(cursor ? [startAfter(cursor)] : []), limit(15),
      ));
      for (const doc of snapshot.docs) {
        const event = { id: doc.id, ...doc.data() };
        if (eventStatus(event, now.getTime()) === 'upcoming') events.push(event);
      }
      cursor = snapshot.size === 15 ? snapshot.docs.at(-1) : null;
    } while (cursor && events.length < size);
    return events.slice(0, size);
  }));
  return [...new Map(groups.flat().map(event => [event.id, event])).values()]
    .sort((a, b) => eventDate(a.date) - eventDate(b.date)).slice(0, size);
}
