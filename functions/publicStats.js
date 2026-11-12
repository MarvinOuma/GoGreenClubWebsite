const { https, pubsub } = require('firebase-functions/v1');
const { AggregateField, FieldPath, Timestamp } = require('firebase-admin/firestore');
const { admin, requireAdmin } = require('./lib/access.cjs');
const { eventStatus } = require('./lib/eventTime.mjs');

async function publishStats(db) {
  const calculatedAt = Timestamp.now();
  const users = db.collection('users');
  const verified = db.collection('impactReports').where('verifiedImpact', '==', true);
  const [all, inactive, reports] = await Promise.all([
    users.count().get(),
    users.where('isActive', '==', false).count().get(),
    verified.aggregate({
      count: AggregateField.count(),
      waste: AggregateField.sum('wasteAmount'),
      trees: AggregateField.sum('treesPlanted'),
    }).get(),
  ]);

  let eventsHosted = 0;
  let cursor;
  const publicEvents = db.collection('events').where('isPublic', '==', true).orderBy(FieldPath.documentId()).limit(300);
  for (;;) {
    const page = await (cursor ? publicEvents.startAfter(cursor) : publicEvents).get();
    if (page.empty) break;
    eventsHosted += page.docs.filter(doc => doc.get('date') && eventStatus(doc.data(), calculatedAt.toMillis()) === 'completed').length;
    cursor = page.docs.at(-1);
  }

  const stats = {
    activeMembers: all.data().count - inactive.data().count,
    eventsHosted,
    verifiedReports: reports.data().count,
    wasteKg: reports.data().count ? reports.data().waste : null,
    treesPlanted: reports.data().count ? reports.data().trees : null,
    calculatedAt,
  };
  const ref = db.collection('publicStats').doc('overview');
  await db.runTransaction(async transaction => {
    const previous = await transaction.get(ref);
    if ((previous.get('calculatedAt')?.toMillis() ?? 0) < calculatedAt.toMillis()) {
      transaction.set(ref, stats);
    }
  });
}

exports.publishPublicStats = pubsub.schedule('every 60 minutes').onRun(() => publishStats(admin.firestore()));
exports.refreshPublicStats = https.onCall(async (_, context) => {
  const db = admin.firestore();
  await db.runTransaction(transaction => requireAdmin(transaction, db, context));
  await publishStats(db);
  return { updated: true };
});
