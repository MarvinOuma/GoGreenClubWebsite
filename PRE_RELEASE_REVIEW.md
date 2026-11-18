# GoGreen Club pre-release review

Reviewed 14 November 2026. Local and remote `main` both resolve to `b00207b`. The implementation is on `mav/gogreen-audit-improvements`. The audit used source review, local emulators and public Hosting responses.

## Branch compared with main

| Commit | Change |
| --- | --- |
| `7b354b9` | Restricts private Firebase reads, validates member reports and uploads, adds a callable partner intake, and removes the tracked Auth export from the branch. |
| `c1324c6` | Moves registration, cancellation, attendance, points, reviews and account changes into trusted functions. |
| `ff23b44` | Adds verified aggregates, Nairobi date handling, keyboard-accessible dialogs, media cleanup and lazy routes. |
| `f0a2e73` | Introduces the forest-green and lime design, shared controls, and updated public and dashboard layouts. |
| `68d98f0` | Adds CI, emulator and browser coverage, deployment documentation, and dependency and workflow hardening. |
| `3b146e3` | Unifies mobile navigation, improves event filters and dialogs, adds approved photo support, and reorganizes the Impact Hub. |
| `941da75` | Adds the accessible name for the Event Manager status filter. |
| `444a1b6` | Binds the inquiry secret in Secret Manager, enforces verified App Check at runtime by default, labels the public count accurately, and fixes past-event contrast. |

All 20 paths in the main router remain present. Member signup, profile, activity reports, event registration and cancellation, My Events, and points remain implemented. Administrator event management, participant and attendance controls, account management, report review, blog publishing, partner management and inbox remain implemented. Browser coverage exercises representative journeys. The Functions emulator verifies permissions, concurrent capacity, award idempotency, reversal, partner throttling, cleanup and role transitions. Real OAuth, password reset delivery, deployed media IAM and scheduled jobs remain staging checks.

## Local verification

The production build, lint, two date/lifecycle unit tests, 14 Firebase rules and workflow tests, and 10 Chromium checks passed. The browser run skipped the optional baseline recapture and used the existing audited captures for comparison. Both npm audits reported zero advisories at review time. Four viewport widths were checked in Chrome at 320px, 390px, 768px and 1280px. The screenshot gallery compares the audited main build, approved redesign and refined branch using local fixtures. No production Firebase data or settings were changed.

## Firebase target

| Public Hosting URL | Hosting configuration project | Web bundle project |
| --- | --- | --- |
| [gogreen-club.web.app](https://gogreen-club.web.app/) | `gogreen-club` | `gogreen-club` |
| [gogreen-club-c5b8d.web.app](https://gogreen-club-c5b8d.web.app/) | `gogreen-club-c5b8d` | `gogreen-club-c5b8d` |

Both hosts responded with the GoGreen Club website. The project IDs were independently identified from the public Hosting initialization endpoint and each site's served JavaScript. The Firebase-app aliases agreed. The checkout's default project and local build project ID are `gogreen-club-c5b8d`. Public evidence establishes two active deployments. The club owner must identify the official domain, authoritative database and Auth tenant, and intended treatment of the other site. Deployed rules, Functions revisions, custom domains and actual production data were outside the public check.

## Review findings and release gates

- **Release blocker — Project and deploy identity.** Confirm the canonical domain and project in the Firebase console, identify the authoritative data, and set up separate staging. Validate deployed index queries, Storage service-agent access, real App Check tokens, partner rate limits across real clients and the hourly scheduler before requesting production approval.
- **Release blocker — Legacy records and retention.** Existing profiles may have missing or malformed flags and historical points. Pending legacy reports may be inconsistent. Already-approved reports can be verified individually for aggregate inclusion without another points award. Review ambiguous attendance awards and duplicate registrations before correction. Confirm which account audit entries, award links, tombstones and anonymous aggregate data the organization retains and for how long.
- **Release blocker — Public identity export.** The review branch removes the file at its tip. The public remote `main` and history still carry the Auth export. The file contains identifying account and role information. The scoped history scan found no private-key marker, which does not establish whether copies, forks or other records exist. Ask the privacy owner to assess exposure and approve remediation. Removing the current file from main and handling past revisions are separate actions.
- **Security boundary — Media.** Storage limits MIME metadata and size and restricts writes by role. Content images under public media prefixes are accessible by URL, including draft uploads. Profile access is restricted by rules, but old download tokens can bypass rule checks. Use only publishable club photos with consent and inspect legacy token use before release. Replacement or deletion cleans tracked UUID objects. Older paths, interrupted uploads and copies require a separate inventory. Treat Storage metadata as a format declaration. If administrators handle untrusted uploads, a server-side decoding pipeline would provide a stronger content check.
- **Admin operations.** Destructive actions use retries or leases across Auth, Firestore and Storage and can partially complete. Event deletion hides the record, removes registrations and attendance, deletes a tracked cover, and then deletes the event document. It preserves awards. The media trigger can also retry a tracked deletion. Account authorization uses a claim and revocation state, with a compatibility path for claims-only administrators. Confirm those administrators have real Auth accounts and correct profiles. Keep a separately controlled recovery administrator because the current implementation blocks self-modification and does not enforce a global last-admin invariant across concurrent administrator actions.
- **Accuracy and scale.** The active member figure counts active profile records and may differ from the Auth account count. The event count is derived from date and status of completed public events. Counts update on the schedule. Archive search and some admin pages still load collections for client-side filtering. The Firestore browser chunk still exceeds Vite's default warning threshold. Profile photos remain outside the editor. The old `src/AppLanding.jsx` is unrouted, and older setup/status documents describe historical behavior. Use the current README and release checklist.
- **Visual scope.** The original logo and design tokens remain. The reviewed mobile menu and event dialog scroll inside their own surfaces. Approved image slots stay on their fallbacks until the club supplies assets. Automated accessibility checks and Chrome viewport coverage do not replace an on-device Safari and screen-reader pass. The support section routes inquiries pending approval of donation details.

## Backup and migration procedure

1. Get owner sign-off on the authoritative project and retention rules. Take a restricted Firestore export, secure Auth backup with separately recorded claims and disabled state, and Storage inventory/backup with object generations and access controls. Record index, TTL, rules, Hosting and Functions revisions. Keep all backups out of Git and limit access to named operators. Verify restore procedures in an approved isolated environment. [Firestore backup and export](https://firebase.google.com/docs/firestore/manage-data/export-import)
2. Run a read-only inventory. Compare Auth UIDs with profiles and roles, group registrations by user and event, flag orphan records and duplicates, reconcile attendance awards and point balances, identify legacy approvals and verify whether the image path is tracked. Record counts and checksums rather than publishing row data. Exclude public-download tokens and identifiers from reports.
3. Rehearse only approved, idempotent corrections in staging with disposable or approved de-identified data. Preserve original UIDs in the authoritative system. Resolve attendance and points discrepancies case by case. Verify legacy reports only after source review. Rehearse retries, record audit changes and compare totals before and after.
4. After separate production approval, coordinate a write window, take fresh backups, deploy the approved compatible release, reconcile checked records and run post-cutover verification. Keep the old system available for read-only comparison if the owner approves. Avoid destructive cleanup until the retention and rollback decisions are signed off.

**Recommendation:** Approve an isolated staging rehearsal once the owner confirms the target and completes the project setup. Keep production release blocked until the staging checklist, migration and privacy decisions are complete. [Staging deployment checklist](RELEASE.md#staging-deployment-checklist)
