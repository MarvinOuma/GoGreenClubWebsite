const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { https } = require('firebase-functions/v1');
const { documentId, fail, requireAdmin } = require('./lib/access.cjs');

const activities = new Set(['recycling', 'tree_planting', 'cleanup', 'other']);

function quantity(value, integer = false) {
  if (typeof value !== 'number' && (typeof value !== 'string' ||
      !/^(?:\d+(?:\.\d+)?|)$/.test(value.trim()))) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 10000 &&
    (!integer || Number.isInteger(number)) ? number : null;
}

function validatedImpact(report) {
  const waste = quantity(report.wasteAmount);
  const trees = quantity(report.treesPlanted, true);
  if (!activities.has(report.activityType) || waste === null || trees === null ||
      typeof report.description !== 'string' || !report.description.trim() ||
      report.description.length > 2000) {
    fail('failed-precondition', 'This report has invalid activity details or quantities.');
  }
  return { waste, trees };
}

exports.reviewImpactReport = https.onCall(async (data, context) => {
  const id = documentId(data?.reportId);
  const decision = data?.decision;
  if (!['approved', 'rejected'].includes(decision)) fail('invalid-argument', 'Choose a review decision.');
  const db = getFirestore();
  const reportRef = db.collection('impactReports').doc(id);
  return db.runTransaction(async transaction => {
    const reviewedBy = await requireAdmin(transaction, db, context);
    const snapshot = await transaction.get(reportRef);
    if (!snapshot.exists) fail('not-found', 'Report not found.');
    const report = snapshot.data();
    if (report.status === decision) return { changed: false, points: report.pointsAwarded ?? 0 };
    if (report.status !== 'pending') fail('failed-precondition', 'This report has already been reviewed.');
    const reviewedAt = FieldValue.serverTimestamp();
    let points = 0;
    if (decision === 'approved') {
      const { waste, trees } = validatedImpact(report);
      const user = await transaction.get(db.collection('users').doc(documentId(report.userId)));
      if (!user.exists || user.get('deleting')) fail('failed-precondition', 'The member profile is unavailable.');
      points = Math.floor(waste) * 5 + trees * 10;
      transaction.create(db.collection('pointAwards').doc('impact_' + id), {
        type: 'impact', reportId: id, userId: report.userId, points, reviewedBy, updatedAt: reviewedAt,
        wasteKg: waste, treesPlanted: trees,
      });
      transaction.update(user.ref, { greenPoints: FieldValue.increment(points) });
      transaction.update(reportRef, { wasteAmount: waste, treesPlanted: trees, verifiedImpact: true });
    }
    transaction.update(reportRef, { status: decision, pointsAwarded: points, reviewedAt, reviewedBy });
    return { changed: true, points };
  });
});

// Legacy approvals predate the trusted ledger. Verification publishes metrics
// after an admin reviews the evidence and leaves historical point balances alone.
exports.verifyLegacyImpactReport = https.onCall(async (data, context) => {
  const id = documentId(data?.reportId);
  const db = getFirestore();
  const ref = db.collection('impactReports').doc(id);
  const ledger = db.collection('pointAwards').doc('impact_' + id);
  return db.runTransaction(async transaction => {
    const reviewedBy = await requireAdmin(transaction, db, context);
    const report = await transaction.get(ref);
    const award = await transaction.get(ledger);
    if (!report.exists || report.get('status') !== 'approved') {
      fail('failed-precondition', 'Choose a previously approved report.');
    }
    if (award.exists) return { changed: false };
    const { waste, trees } = validatedImpact(report.data());
    const userId = report.get('userId');
    transaction.create(ledger, {
      type: 'impact', reportId: id, ...(typeof userId === 'string' ? { userId } : {}),
      wasteKg: waste, treesPlanted: trees, reviewedBy, legacyVerification: true, updatedAt: FieldValue.serverTimestamp(),
    });
    return { changed: true };
  });
});
