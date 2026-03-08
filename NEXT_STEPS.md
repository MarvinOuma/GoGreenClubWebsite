# 🚀 Next Steps - Complete These Now

## Step 1: Run Firebase Setup Script

```bash
./setup-firebase.sh
```

This will:
- Login to Firebase
- Show your projects
- Let you select a project

---

## Step 2: Get Firebase Credentials

### Option A: Use the helper script
```bash
./get-firebase-config.sh
```

### Option B: Manual steps
1. Go to https://console.firebase.google.com
2. Select your project
3. Click ⚙️ → Project Settings
4. Scroll to "Your apps" section
5. Click "</>" (Web) icon to add web app (if needed)
6. Copy the config values

---

## Step 3: Edit .env File

```bash
nano .env
```

Paste your Firebase config:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Save: `Ctrl+O`, `Enter`, `Ctrl+X`

---

## Step 4: Enable Firebase Services

Go to Firebase Console for your project:

### Enable Authentication
1. Click **Authentication** → Get Started
2. Enable **Email/Password**
3. Enable **Google**

### Create Firestore Database
1. Click **Firestore Database** → Create Database
2. Choose **Production mode**
3. Select your region (closest to you)

### Enable Storage
1. Click **Storage** → Get Started
2. Choose **Production mode**

---

## Step 5: Deploy Rules & Functions

```bash
firebase deploy --only firestore:rules,storage:rules,functions
```

---

## Step 6: Test Locally

```bash
npm run dev
```

Visit: http://localhost:5173

---

## Step 7: Deploy to Production (when ready)

```bash
npm run build
firebase deploy
```

---

## Quick Commands

```bash
# Setup Firebase project
./setup-firebase.sh

# Get config instructions
./get-firebase-config.sh

# Edit environment
nano .env

# Deploy rules & functions
firebase deploy --only firestore:rules,storage:rules,functions

# Run dev server
npm run dev

# Deploy everything
npm run build && firebase deploy
```

---

## Troubleshooting

### "No project selected"
```bash
firebase use --add
```

### "Permission denied"
```bash
firebase login --reauth
```

### ".env not working"
- Restart dev server after editing .env
- Check variable names start with VITE_

---

**Start with Step 1 now!** 🚀
