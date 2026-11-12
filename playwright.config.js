import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    launchOptions: { executablePath: process.env.GOGREEN_CHROMIUM_PATH || undefined },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build -- --mode emulators --outDir dist-emulator && npm run preview -- --outDir dist-emulator --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    env: {
      VITE_FIREBASE_EMULATORS: 'true',
      VITE_FIREBASE_PROJECT_ID: 'demo-gogreen',
      VITE_FIREBASE_API_KEY: 'demo-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'demo-gogreen.firebaseapp.com',
      VITE_FIREBASE_STORAGE_BUCKET: 'demo-gogreen.appspot.com',
      VITE_FIREBASE_APP_CHECK_SITE_KEY: '',
    },
  },
});
