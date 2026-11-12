# GoGreen Club

GoGreen Club brings together environmental action and STEAM. The website publishes club events and stories and lets members register, submit impact reports, and track Green Points. Administrators manage events, attendance, reports, accounts, posts, and partners.

## Local development

Use Node.js 22.12 or newer. The Firebase Emulator Suite also needs Java 21 or newer.

```sh
npm ci
npm ci --prefix functions
cp -n .env.example .env
npm run dev
```

Set the Firebase web configuration in `.env` for an authorized development project, or set `VITE_FIREBASE_EMULATORS=true` and `VITE_FIREBASE_PROJECT_ID=demo-gogreen` for local development. In emulator mode, use any non-empty demo API key and the bucket `demo-gogreen.appspot.com`. Start the services in a second terminal:

```sh
npx firebase-tools@15.9.1 emulators:start --project demo-gogreen --only auth,firestore,functions,storage
```

## Verification

```sh
npm run lint
npm test
npm run build
npm run test:emulator
npx playwright install chromium
npm run test:browser
```

CI builds and runs these checks without Firebase credentials. The browser tests run the production bundle with emulator configuration. Set `GOGREEN_SCREENSHOT_DIR` to capture screenshots, or set `GOGREEN_CHROMIUM_PATH` to use a local Chromium executable. A baseline Vite server can be supplied with `GOGREEN_BASELINE_URL` for comparison captures.

## Application structure

- `src/pages/` contains public, member, and administrator routes. `src/layout/` and `src/components/ui/` contain shared navigation and UI components.
- `functions/` contains trusted Firebase workflows. Transactions enforce event capacity, review reports, and adjust Green Points.
- `firestore.rules` and `storage.rules` define client permissions. Firestore keeps user profiles, report narratives, registrations, and partner inquiries private.
- `publicStats/overview` publishes aggregate figures. Waste and tree totals come from the trusted award ledger. A scheduled function refreshes the document hourly.
- The visual system uses Forest, Leaf, Lime, Ivory, and Ink tokens, a shared focus treatment, and locally hosted Latin subsets of Instrument Sans and Inter under the SIL Open Font License.

See [release and migration notes](RELEASE.md) for configuration, legacy data review, and the staged rollout.
