const { getStorage } = require('firebase-admin/storage');
const { runWith } = require('firebase-functions/v1');

function removeSupersededImage(collection, field, directory) {
  return runWith({ failurePolicy: true }).firestore.document(`${collection}/{id}`).onWrite(async change => {
    const previous = change.before.get(field);
    const current = change.after.get(field);
    if (!previous || previous === current ||
        !new RegExp(`^${directory}/[a-f0-9-]{36}$`).test(previous)) return;
    // Check the current document before acting on a delayed or retried trigger.
    const latest = await change.after.ref.get();
    if (latest.get(field) === previous) return;
    await getStorage().bucket().file(previous).delete({ ignoreNotFound: true });
  });
}

exports.cleanPostImage = removeSupersededImage('posts', 'coverImagePath', 'blog');
exports.cleanEventImage = removeSupersededImage('events', 'imagePath', 'events');
exports.cleanPartnerLogo = removeSupersededImage('partners', 'logoPath', 'partners');
