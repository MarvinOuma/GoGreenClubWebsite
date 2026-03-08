# 🎯 EXACT COMMANDS TO RUN - GoGreen Club Platform

## Copy and paste these commands in order

---

## STEP 1: Install Dependencies

```bash
cd /Users/MarvinDaniel/Desktop/GoGreenClubWebsite
npm install
cd functions
npm install
cd ..
```

---

## STEP 2: Create Environment File

```bash
cp .env.example .env
```

Now edit `.env` file and add your Firebase credentials:
- Get them from: https://console.firebase.google.com
- Project Settings → General → Your apps → Config

---

## STEP 3: Install Firebase CLI (if not installed)

```bash
npm install -g firebase-tools
```

---

## STEP 4: Login to Firebase

```bash
firebase login
```

---

## STEP 5: Initialize Firebase (if needed)

```bash
firebase init
```

Select:
- Firestore
- Functions
- Hosting
- Storage

Choose existing project or create new one.

---

## STEP 6: Run Development Server

```bash
npm run dev
```

Visit: http://localhost:5173

---

## STEP 7: Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

---

## STEP 8: Deploy Storage Rules

```bash
firebase deploy --only storage
```

---

## STEP 9: Deploy Cloud Functions

```bash
firebase deploy --only functions
```

---

## STEP 10: Build for Production

```bash
npm run build
```

---

## STEP 11: Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

---

## STEP 12: Deploy Everything at Once

```bash
firebase deploy
```

---

## BONUS: Create First Admin User

After signing up through the app:

```bash
firebase functions:shell
```

Then in the shell:

```javascript
admin.auth().setCustomUserClaims('PASTE_USER_UID_HERE', { 
  role: 'admin', 
  admin: true 
})
```

Get User UID from:
- Firebase Console → Authentication → Users → Copy UID

---

## Quick Commands Reference

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy everything
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions

# View Firebase logs
firebase functions:log

# Open Firebase console
firebase open

# Check Firebase project
firebase use
```

---

## Troubleshooting Commands

```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check Node version (need v18+)
node --version

# Check Firebase CLI version
firebase --version

# List Firebase projects
firebase projects:list

# Switch Firebase project
firebase use PROJECT_ID
```

---

## File Locations

- Logo: `public/logo.png` ✅ (Already added!)
- Environment: `.env` (Create from .env.example)
- Firebase Config: `firebase.json`
- Firestore Rules: `firestore.rules`
- Storage Rules: `storage.rules`
- Cloud Functions: `functions/index.js`

---

## Documentation to Read

1. **QUICKSTART.md** - Start here!
2. **SETUP.md** - Detailed setup guide
3. **README.md** - Project overview
4. **ARCHITECTURE.md** - How it works
5. **TEST_DATA.md** - Sample data
6. **TROUBLESHOOTING.md** - If issues arise

---

## Firebase Console URLs

- Main Console: https://console.firebase.google.com
- Authentication: https://console.firebase.google.com/project/YOUR_PROJECT/authentication
- Firestore: https://console.firebase.google.com/project/YOUR_PROJECT/firestore
- Storage: https://console.firebase.google.com/project/YOUR_PROJECT/storage
- Functions: https://console.firebase.google.com/project/YOUR_PROJECT/functions
- Hosting: https://console.firebase.google.com/project/YOUR_PROJECT/hosting

---

## What to Do First

1. ✅ Read QUICKSTART.md
2. ✅ Run: `npm install`
3. ✅ Create .env file
4. ✅ Add Firebase credentials to .env
5. ✅ Run: `npm run dev`
6. ✅ Test locally
7. ✅ Deploy to Firebase

---

## Your App URLs

- Development: http://localhost:5173
- Production: https://YOUR_PROJECT_ID.web.app
- Firebase Console: https://console.firebase.google.com/project/YOUR_PROJECT

---

**Ready to launch! 🚀**

Green Steps, Big Impact! 🌍💚
