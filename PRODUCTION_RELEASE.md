# Production release runbook

The owner approved direct release to the existing `gogreen-club-c5b8d` project on 19 November 2026. This supersedes the staging-only rollout in RELEASE.md for this release. Never target the older `gogreen-club` project.

## Safety and configuration

- Preserve all ten existing Authentication accounts, custom claims, disabled states and UIDs. Missing profiles are created on authenticated first login or account creation through the shared transactional initializer. Do not bulk-backfill profiles or rewrite claims.
- A verified encrypted local backup contains the three existing Firestore documents, thirteen Storage objects, Auth metadata/configuration and the prior Hosting assets/configuration. The archive and separately stored key have owner-only filesystem permissions outside this repository. Auth credentials are intentionally excluded; this is not a substitute for retaining existing accounts. No restore has been executed.
- Use the existing default Firestore database, Storage bucket `gogreen-club-c5b8d.firebasestorage.app`, and Functions region `us-central1` with Node.js 22.
- Email/password and Google providers are already enabled; official web.app and firebaseapp.com domains are authorized. No provider or account changes are required.
- Production App Check uses a score-based reCAPTCHA Enterprise key restricted to the two official Hosting domains. Set `VITE_FIREBASE_APP_CHECK_PROVIDER=enterprise` and the public `VITE_FIREBASE_APP_CHECK_SITE_KEY` in the local production build environment. Existing v3 configurations continue to work with the default provider. Do not authorize localhost on a production key or use debug tokens in production.
- Store `PARTNER_RATE_KEY` only in Secret Manager. The inquiry callable binds it. A temporary `PARTNER_ENFORCE_APP_CHECK=false` project-specific Functions environment allows initial token verification; set it to true and redeploy the inquiry callable after the real client successfully attests. Leave unrelated service-wide enforcement unchanged during cutover.

## Deployment order

Every command explicitly targets production. Stop on failed checks, missing backups, index errors or incompatible legacy records; never bypass rules.

1. Run clean installs, lint, unit tests, production build, dependency audits and all Firebase emulator/browser/accessibility/responsive tests. Review and merge the release PR after checks pass.
2. Configure required APIs, Secret Manager and the registered App Check provider. These operations do not modify club records or Auth accounts.
3. `firebase deploy --project gogreen-club-c5b8d --only firestore:indexes --non-interactive`
4. Wait for composite indexes to report READY and verify the configured TTL applies only to expiring inquiry limiter records.
5. `firebase deploy --project gogreen-club-c5b8d --only functions --non-interactive`
6. `firebase deploy --project gogreen-club-c5b8d --only firestore:rules,storage --non-interactive`
7. Verify Storage's Firebase service agent has the cross-service Firestore rules permission. Rebuild with the exact project/app/provider configuration, record the merged commit in a public release marker, then `firebase deploy --project gogreen-club-c5b8d --only hosting --non-interactive`.
8. Verify valid client App Check tokens before enforcing the inquiry callable; redeploy only `functions:submitPartnerInquiry` with enforcement enabled. Verify missing tokens are rejected without writing inquiry records.
9. Confirm assets, Functions, rules, indexes, scheduler and public stats. Compare current Auth metadata with the backup, preserving all UIDs/claims/disabled states. Live authenticated workflows require authorized account interaction; local emulator results do not establish OAuth, live email delivery or deployed IAM behavior.

## Rollback and privacy

The old frontend uses direct writes that the hardened rules intentionally reject. Do not weaken rules, restore the old claims-overwriting trigger, or overwrite production data to recover frontend behavior. Keep the secured backend and repair forward, or publish a maintenance page while preparing a compatible frontend. The encrypted snapshot supports an individually reviewed record/asset recovery if required; any destructive recovery needs separate approval.

The Auth export was removed from current main through privacy PR #1. Historical commits, cached copies and clones can still expose the original record. Ignore patterns prevent common accidental exports but do not scan or purge history. Coordinate a separate exposure assessment and approved history cleanup; never reproduce personal records or force-push as part of this release.

The deployed impact aggregate requires the `pointAwards` index ordered by `type`, `treesPlanted`, then `wasteKg`. Both aggregate field orders are retained during this rollout to avoid deleting an existing index. The emulator does not enforce composite index requirements; verify the scheduled publisher against deployed Firestore.
