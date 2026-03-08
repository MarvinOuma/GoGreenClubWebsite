# GoGreen Club Platform - Setup Instructions (macOS)

## 🎯 Prerequisites

1. **Node.js** (v18 or higher)
   ```bash
   brew install node
   ```

2. **Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

3. **Git** (usually pre-installed on macOS)

---

## 🚀 Initial Setup

### 1. Install Dependencies

```bash
cd /Users/MarvinDaniel/Desktop/GoGreenClubWebsite
npm install
cd functions
npm install
cd ..
```

### 2. Firebase Project Setup

```bash
# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init

# Select the following:
# ✓ Firestore
# ✓ Functions
# ✓ Hosting
# ✓ Storage

# Choose existing project or create new one
# Use default options for most prompts
```

### 3. Configure Environment Variables

Create `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your Firebase credentials:
- Go to Firebase Console → Project Settings → General
- Scroll to "Your apps" section
- Copy the config values

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Add Your Logo

Place your logo file at:
```
public/logo.png
```

---

## 🔐 Firebase Authentication Setup

1. Go to Firebase Console → Authentication
2. Click "Get Started"
3. Enable sign-in methods:
   - ✓ Email/Password
   - ✓ Google

---

## 🗄️ Firestore Database Setup

1. Go to Firebase Console → Firestore Database
2. Click "Create Database"
3. Choose "Start in production mode"
4. Select your region

### Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

---

## 📦 Firebase Storage Setup

1. Go to Firebase Console → Storage
2. Click "Get Started"
3. Choose "Start in production mode"

### Deploy Storage Rules

```bash
firebase deploy --only storage
```

---

## ⚡ Deploy Cloud Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

This will deploy:
- `assignMemberRole` - Auto-assigns member role on signup
- `promoteToAdmin` - Allows admins to promote users

---

## 🧪 Test Data Setup

### Create First Admin User

1. Sign up normally through the app
2. Go to Firebase Console → Authentication
3. Copy the User UID
4. Open Firebase Console → Functions
5. Run this in Cloud Functions shell or use Firebase Admin SDK:

```javascript
admin.auth().setCustomUserClaims('USER_UID_HERE', {
  role: 'admin',
  admin: true
});
```

Or use Firebase CLI:
```bash
firebase functions:shell
> admin.auth().setCustomUserClaims('USER_UID_HERE', { role: 'admin', admin: true })
```

### Add Sample Events

Go to Firestore Console and add to `events` collection:

```json
{
  "title": "Beach Cleanup Drive",
  "description": "Join us for a coastal cleanup",
  "date": "2024-02-15",
  "location": "Marina Beach",
  "participants": []
}
```

### Add Sample Blog Post

Go to Firestore Console and add to `posts` collection:

```json
{
  "title": "Our First Tree Plantation Drive",
  "content": "We planted 50 trees today...",
  "authorName": "Admin",
  "coverImageUrl": "",
  "tags": ["events", "trees"],
  "isPublished": true,
  "createdAt": "2024-01-20T10:00:00Z"
}
```

---

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

Visit: `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

---

## 🚀 Deploy to Firebase Hosting

```bash
# Build the app
npm run build

# Deploy everything
firebase deploy

# Or deploy only hosting
firebase deploy --only hosting
```

Your app will be live at: `https://YOUR_PROJECT_ID.web.app`

---

## 📁 Project Structure

```
GoGreenClubWebsite/
├── public/
│   └── logo.png
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   └── Sidebar.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── firebase/
│   │   ├── firebaseConfig.js
│   │   └── auth.js
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Welcome.jsx
│   │   ├── MemberDashboard.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── BlogCMS.jsx
│   │   └── PublicDashboard.jsx
│   ├── routes/
│   │   └── ProtectedRoute.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── functions/
│   ├── index.js
│   └── package.json
├── firestore.rules
├── storage.rules
├── firebase.json
├── .env
└── package.json
```

---

## 🔑 User Roles & Access

### Member (Default)
- Access to Impact Hub dashboard
- View events
- Log activities
- Edit own profile

### Admin
- All member permissions
- Access to Command Center
- Create/edit/delete events
- Approve impact reports
- Manage users
- Blog CMS (create/edit/publish posts)

---

## 🎨 Customization

### Brand Colors (tailwind.config.js)

```javascript
colors: {
  'brand-green': '#15803d',
  'brand-light': '#86efac',
}
```

### Modify as needed to match your exact brand colors.

---

## 🐛 Troubleshooting

### Issue: "Firebase not initialized"
- Check `.env` file exists and has correct values
- Restart dev server after changing `.env`

### Issue: "Permission denied" in Firestore
- Deploy Firestore rules: `firebase deploy --only firestore:rules`
- Check user has correct custom claims

### Issue: Cloud Functions not working
- Check Functions logs: `firebase functions:log`
- Ensure billing is enabled (Blaze plan required for Cloud Functions)

### Issue: Images not uploading
- Deploy Storage rules: `firebase deploy --only storage`
- Check file size limits

---

## 📊 Firestore Collections Structure

### users
```javascript
{
  uid: "user_id",
  name: "John Doe",
  email: "john@example.com",
  branch: "Computer Science",
  interests: ["recycling", "tree planting"],
  greenPoints: 150,
  role: "member",
  createdAt: timestamp
}
```

### events
```javascript
{
  title: "Beach Cleanup",
  description: "...",
  date: "2024-02-15",
  location: "Marina Beach",
  participants: ["uid1", "uid2"],
  createdAt: timestamp
}
```

### posts
```javascript
{
  title: "Blog Post Title",
  content: "Full content...",
  authorName: "Admin",
  coverImageUrl: "https://...",
  tags: ["tag1", "tag2"],
  isPublished: true,
  createdAt: timestamp
}
```

### impactReports
```javascript
{
  userId: "user_id",
  activityType: "recycling",
  amount: "5kg",
  description: "...",
  status: "pending", // or "approved"
  createdAt: timestamp
}
```

---

## 🎯 Next Steps

1. ✅ Complete Firebase setup
2. ✅ Deploy Cloud Functions
3. ✅ Create first admin user
4. ✅ Add sample data
5. ✅ Test all features
6. ✅ Deploy to Firebase Hosting

---

## 📞 Support

For issues or questions:
- Check Firebase Console logs
- Review Firestore rules
- Check browser console for errors

---

## 🔥 Production Checklist

Before going live:

- [ ] Update `.env` with production Firebase config
- [ ] Deploy Firestore security rules
- [ ] Deploy Storage security rules
- [ ] Deploy Cloud Functions
- [ ] Test authentication flow
- [ ] Test role-based access
- [ ] Add real logo to `public/logo.png`
- [ ] Build and deploy: `npm run build && firebase deploy`
- [ ] Test production URL
- [ ] Set up custom domain (optional)

---

**Built with ❤️ for GoGreen Club**
