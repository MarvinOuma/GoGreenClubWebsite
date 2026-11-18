#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 || -z "$1" || "$1" == -* || "$1" == demo-* ]]; then
  printf 'Usage: %s <approved-firebase-project-id>\n' "$0" >&2
  exit 2
fi

cd "$(dirname "$0")"
project="$1"
npm ci
npm ci --prefix functions
node --input-type=module - "$project" <<'JS'
import { loadEnv } from 'vite';
const env = loadEnv('production', process.cwd(), 'VITE_');
for (const key of ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_APP_ID']) {
  if (!env[key]?.trim()) throw new Error(`Missing ${key}`);
}
if (env.VITE_FIREBASE_PROJECT_ID !== process.argv[2] || env.VITE_FIREBASE_EMULATORS === 'true') {
  throw new Error('The production build must use the selected Firebase project and live Firebase services.');
}
JS
npm run build
firebase deploy --project "$project"
