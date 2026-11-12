const { createHash } = require('node:crypto');
const { https } = require('firebase-functions');
const { active, actorId, admin, documentId, fail, requireAdmin } = require('./lib/access.cjs');
const { eventDate, eventStatus } = require('./lib/eventTime.mjs');

const stamp = () => admin.firestore.FieldValue.serverTimestamp();
const registrationKey = (uid, eventId) => 'v2_' + createHash('sha256')
  .update(JSON.stringify([uid, eventId])).digest('hex');

function eventRecords(db, eventId) {
  return db.collection('eventRegistrations').where('eventId', '==', eventId);
}

function validCapacity(value) {
  if (value == null || value === '' || value === 0) return Infinity;
  const capacity = Number(value);
  if (!Number.isSafeInteger(capacity) || capacity < 1) {
    fail('failed-precondition', 'An administrator must correct this event’s capacity.');
  }
  return capacity;
}

async function registeredCount(transaction, db, event) {
  const count = event.get('registeredCount');
  if (event.get('registrationCountVersion') === 1 && Number.isSafeInteger(count) && count >= 0) return count;
  const records = await transaction.get(eventRecords(db, event.id));
  return new Set(records.docs.map(doc => doc.get('userId')).filter(uid => typeof uid === 'string' && uid)).size;
}

function setCount(transaction, event, count) {
  transaction.update(event.ref, { registeredCount: count, registrationCountVersion: 1 });
}

const changeRegistration = (action) => https.onCall(async (data, context) => {
  const eventId = documentId(data?.eventId);
  const uid = action === 'remove' ? documentId(data?.userId) : actorId(context);
  const db = admin.firestore();
  return db.runTransaction(async transaction => {
    if (action === 'remove') {
      await requireAdmin(transaction, db, context);
    } else {
      const profile = await transaction.get(db.collection('users').doc(uid));
      if (!active(profile)) fail('permission-denied', 'An active member profile is required.');
    }
    const event = await transaction.get(db.collection('events').doc(eventId));
    if (!event.exists || event.get('deleting')) fail('not-found', 'Event not found.');
    const records = await transaction.get(eventRecords(db, eventId).where('userId', '==', uid));
    const count = await registeredCount(transaction, db, event);
    if (action === 'register') {
      if (records.size) {
        setCount(transaction, event, count);
        return { registered: true, changed: false };
      }
      if (event.get('isPublic') !== true || eventStatus(event.data()) !== 'upcoming') {
        fail('failed-precondition', 'This event is closed to registrations.');
      }
      const deadline = event.get('registrationDeadline');
      const deadlineDate = eventDate(deadline);
      if (deadline && (!deadlineDate || deadlineDate.getTime() < Date.now())) {
        fail('deadline-exceeded', 'Registration has closed.');
      }
      if (count >= validCapacity(event.get('maxParticipants'))) {
        fail('resource-exhausted', 'This event is full.');
      }
      transaction.create(db.collection('eventRegistrations').doc(registrationKey(uid, eventId)), {
        eventId, userId: uid, status: 'registered', registeredAt: stamp(),
      });
      setCount(transaction, event, count + 1);
      return { registered: true, changed: true };
    }

    if (!records.size) return { registered: false, changed: false };
    if (records.size > 400) fail('failed-precondition', 'These legacy registrations require administrator review.');
    if (records.docs.some(record => typeof record.get('attended') === 'boolean')) {
      fail('failed-precondition', 'An attendance record exists. Keep it for the event history.');
    }
    if (action === 'cancel' && eventStatus(event.data()) === 'completed') {
      fail('failed-precondition', 'This event has ended.');
    }
    records.docs.forEach(record => transaction.delete(record.ref));
    setCount(transaction, event, Math.max(count - 1, 0));
    return { registered: false, changed: true };
  });
});

exports.registerForEvent = changeRegistration('register');
exports.cancelEventRegistration = changeRegistration('cancel');
exports.removeEventParticipant = changeRegistration('remove');

exports.markEventAttendance = https.onCall(async (data, context) => {
  const eventId = documentId(data?.eventId);
  const uid = documentId(data?.userId);
  if (typeof data?.attended !== 'boolean') fail('invalid-argument', 'Choose an attendance status.');
  const db = admin.firestore();
  const userRef = db.collection('users').doc(uid);
  const ledger = db.collection('pointAwards').doc('attendance_' + registrationKey(uid, eventId));
  return db.runTransaction(async transaction => {
    const reviewedBy = await requireAdmin(transaction, db, context);
    const event = await transaction.get(db.collection('events').doc(eventId));
    if (!event.exists || event.get('deleting') || eventStatus(event.data()) !== 'completed') {
      fail('failed-precondition', 'Attendance can be recorded after the event.');
    }
    const records = await transaction.get(eventRecords(db, eventId).where('userId', '==', uid));
    if (records.empty) fail('not-found', 'Registration not found.');
    if (records.size > 1) fail('failed-precondition', 'Review duplicate registrations before recording attendance.');
    const registration = records.docs[0];
    const award = await transaction.get(ledger);
    const user = await transaction.get(userRef);
    if (!user.exists || user.get('deleting')) fail('failed-precondition', 'The member profile is unavailable.');
    if (registration.get('attended') === data.attended) return { pointsDelta: 0 };
    if (!award.exists && (registration.get('attended') === true || registration.get('pointsAwarded') > 0)) {
      fail('failed-precondition', 'A legacy award requires manual review before changing attendance.');
    }
    const reward = award.exists ? award.get('originalPoints') : Number(event.get('pointsReward') ?? 0);
    if (!Number.isSafeInteger(reward) || reward < 0 || reward > 10000) {
      fail('failed-precondition', 'Correct the event points reward first.');
    }
    const amount = data.attended ? reward : 0;
    const pointsDelta = amount - (award.get('points') ?? 0);
    transaction.set(ledger, {
      type: 'attendance', eventId, userId: uid, originalPoints: reward,
      points: amount, reviewedBy, updatedAt: stamp(),
    });
    transaction.update(registration.ref, {
      attended: data.attended, pointsAwarded: amount, reviewedAt: stamp(),
    });
    if (pointsDelta) transaction.update(userRef, { greenPoints: admin.firestore.FieldValue.increment(pointsDelta) });
    return { pointsDelta };
  });
});

exports.deleteEvent = https.onCall(async (data, context) => {
  const id = documentId(data?.eventId);
  const db = admin.firestore();
  const ref = db.collection('events').doc(id);
  const event = await db.runTransaction(async transaction => {
    await requireAdmin(transaction, db, context);
    const snapshot = await transaction.get(ref);
    if (snapshot.exists) transaction.update(ref, { isPublic: false, deleting: true });
    return snapshot.data();
  });
  if (!event) return { deleted: true };
  let page;
  do {
    page = await eventRecords(db, id).limit(400).get();
    const batch = db.batch();
    page.docs.forEach(record => batch.delete(record.ref));
    if (!page.empty) await batch.commit();
  } while (!page.empty);
  if (typeof event.imagePath === 'string' && /^events\/[a-f0-9-]{36}$/.test(event.imagePath)) {
    await admin.storage().bucket().file(event.imagePath).delete({ ignoreNotFound: true });
  }
  await ref.delete();
  return { deleted: true };
});


async function removeAccountRegistrations(db, uid) {
  const records = db.collection('eventRegistrations').where('userId', '==', uid);
  let page;
  do {
    page = await records.limit(100).get();
    const eventIds = new Set(page.docs.map(record => record.get('eventId')));
    for (const eventId of eventIds) {
      if (typeof eventId !== 'string' || !eventId || eventId.includes('/')) {
        const batch = db.batch();
        page.docs.filter(record => record.get('eventId') === eventId).forEach(record => batch.delete(record.ref));
        await batch.commit();
        continue;
      }
      await db.runTransaction(async transaction => {
        const event = await transaction.get(db.collection('events').doc(eventId));
        const registrations = await transaction.get(eventRecords(db, eventId).where('userId', '==', uid).limit(400));
        if (registrations.empty) return;
        const count = event.exists && !event.get('deleting') ? await registeredCount(transaction, db, event) : null;
        registrations.docs.forEach(record => transaction.delete(record.ref));
        if (count !== null) {
          // With legacy duplicates, decrement only once all of this member's records are removed.
          if (registrations.size < 400) setCount(transaction, event, Math.max(count - 1, 0));
          else transaction.update(event.ref, { registrationCountVersion: 0 });
        }
      });
    }
  } while (!page.empty);
}

Object.defineProperty(exports, 'internals', { value: { removeAccountRegistrations } });
