# 🚀 Quick Start Guide - GoGreen Club Platform

## ⚡ 5-Minute Setup

### 1. Install Dependencies
```bash
cd /Users/MarvinDaniel/Desktop/GoGreenClubWebsite
npm install
cd functions && npm install && cd ..
```

### 2. Configure Firebase
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your Firebase credentials
# Get them from: Firebase Console → Project Settings → General
```

### 3. Add Your Logo
```bash
# Place your logo at:
# public/logo.png
```

### 4. Run Development Server
```bash
npm run dev
```

Visit: http://localhost:5173

---

## 🔥 Firebase Setup (One-Time)

### Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Name it "gogreen-club" (or your choice)
4. Disable Google Analytics (optional)

### Enable Authentication
1. Firebase Console → Authentication → Get Started
2. Enable "Email/Password"
3. Enable "Google"

### Create Firestore Database
1. Firebase Console → Firestore Database → Create Database
2. Start in "Production mode"
3. Choose your region

### Enable Storage
1. Firebase Console → Storage → Get Started
2. Start in "Production mode"

### Deploy Rules & Functions
```bash
# Login to Firebase
firebase login

# Initialize (if needed)
firebase init

# Deploy everything
firebase deploy
```

---

## 👤 Create First Admin User

### Method 1: Firebase Console
1. Sign up through your app
2. Go to Firebase Console → Authentication
3. Copy the User UID
4. Go to Cloud Functions → Run in shell:
```javascript
admin.auth().setCustomUserClaims('USER_UID_HERE', {
  role: 'admin',
  admin: true
});
```

### Method 2: Firebase CLI
```bash
firebase functions:shell

# In shell:
admin.auth().setCustomUserClaims('USER_UID_HERE', { 
  role: 'admin', 
  admin: true 
})
```

---

## 📊 Add Test Data

See [TEST_DATA.md](./TEST_DATA.md) for sample data.

Quick add via Firebase Console:
1. Go to Firestore Database
2. Create collections: `events`, `posts`
3. Add documents with sample data

---

## 🚀 Deploy to Production

```bash
# Build the app
npm run build

# Deploy everything
firebase deploy

# Or use the deployment script
./deploy.sh
```

Your app will be live at: `https://YOUR_PROJECT_ID.web.app`

---

## 📁 Project Structure

```
GoGreenClubWebsite/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Page components (dashboards)
│   ├── firebase/       # Firebase config & helpers
│   ├── context/        # React Context (Auth)
│   └── routes/         # Protected route wrapper
├── functions/          # Cloud Functions
├── public/            # Static assets (logo)
├── firestore.rules    # Database security rules
├── storage.rules      # Storage security rules
└── firebase.json      # Firebase configuration
```

---

## 🎯 Key Features

### ✅ Three Dashboards
1. **Public Dashboard** - No login required
   - Live impact counter
   - Public events
   - Published blog posts

2. **Member Dashboard** - For registered users
   - Green Points tracker
   - Upcoming events
   - Activity logging
   - Badges & milestones

3. **Admin Dashboard** - For admins only
   - Event management (CRUD)
   - User management
   - Approve impact reports
   - Blog CMS
   - Analytics

### ✅ Authentication
- Email/Password
- Google OAuth
- Auto role assignment (Cloud Function)
- Custom claims for role-based access

### ✅ Blog CMS
- Create, edit, delete posts
- Upload cover images
- Publish/unpublish
- Tag system
- Admin-only access

### ✅ Security
- Firestore security rules
- Storage security rules
- Role-based access control
- Protected routes

---

## 🎨 Customization

### Brand Colors
Edit `tailwind.config.js`:
```javascript
colors: {
  'brand-green': '#15803d',  // Your primary color
  'brand-light': '#86efac',  // Your accent color
}
```

### Logo
Replace `public/logo.png` with your logo (512x512px recommended)

---

## 🐛 Common Issues

### "Firebase not initialized"
- Check `.env` file exists
- Restart dev server: `npm run dev`

### "Permission denied"
- Deploy Firestore rules: `firebase deploy --only firestore:rules`
- Check user has correct custom claims

### Cloud Functions not working
- Enable Blaze plan (pay-as-you-go)
- Check logs: `firebase functions:log`

---

## 📚 Documentation

- [README.md](./README.md) - Project overview
- [SETUP.md](./SETUP.md) - Detailed setup instructions
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [TEST_DATA.md](./TEST_DATA.md) - Sample data

---

## 🎓 Learning Resources

- [React Docs](https://react.dev)
- [Firebase Docs](https://firebase.google.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide)

---

## ✅ Pre-Launch Checklist

- [ ] Firebase project created
- [ ] Authentication enabled (Email + Google)
- [ ] Firestore database created
- [ ] Storage enabled
- [ ] Cloud Functions deployed
- [ ] Security rules deployed
- [ ] First admin user created
- [ ] Test data added
- [ ] Logo added to `public/logo.png`
- [ ] `.env` configured
- [ ] App tested locally
- [ ] Production build successful
- [ ] Deployed to Firebase Hosting

---

## 🎉 You're Ready!

Your GoGreen Club Platform is now set up and ready to make an impact!

**Green Steps, Big Impact!** 🌍💚

---

## 📞 Need Help?

Check the documentation files or review:
- Firebase Console logs
- Browser console errors
- Firestore security rules
- Cloud Functions logs

---

**Built with ❤️ for environmental impact**
