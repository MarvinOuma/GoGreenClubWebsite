# 🌍 GoGreen Club Platform

**Green Steps, Big Impact!**

A full-stack web application for managing environmental club activities with gamification, role-based dashboards, and public transparency.

## ✨ Features

### 🎮 Member Dashboard - "Impact Hub"
- Gamified personal workspace
- Green Points tracking
- Activity feed with upcoming events
- Badges and milestones
- Impact tracker with progress bars
- Quick action: Log Activity

### 🎛️ Admin Dashboard - "Command Center"
- Event Manager (CRUD with calendar view)
- User Management (approve/remove users)
- Approval Queue for Impact Reports
- Analytics Summary (waste collected, trees planted, active members)
- Blog CMS (create, edit, publish posts)

### 🌐 Public Dashboard - "Transparency Portal"
- No login required
- Public Event Calendar
- Live Impact Counter
- News/Blog section (published posts only)
- Impact Map placeholder

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Backend**: Firebase
  - Authentication (Email/Password + Google OAuth)
  - Firestore Database
  - Cloud Storage
  - Cloud Functions
  - Hosting

## 🔐 Authentication & Authorization

- Email/Password authentication
- Google OAuth
- Role-based access control using Firebase Custom Claims
- Default role: `member`
- Admin role: `admin: true`
- Cloud Function auto-assigns member role on signup

## 📁 Project Structure

```
src/
├── components/       # Reusable UI components
├── pages/           # Page components
├── firebase/        # Firebase config and helpers
├── context/         # React Context (Auth)
├── routes/          # Protected route wrapper
└── index.css        # Tailwind + custom styles
```

## 🚀 Quick Start

See [SETUP.md](./SETUP.md) for detailed instructions.

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Add your Firebase config to .env

# Run development server
npm run dev

# Deploy to Firebase
npm run build
firebase deploy
```

## 🎨 Brand Identity

- **Primary Color**: Forest Green (#15803d)
- **Accent**: Light Green (#86efac)
- **Logo**: Place at `public/logo.png`
- **Tagline**: "Green Steps, Big Impact!"

## 🔒 Security

- Firestore security rules enforce role-based access
- Storage rules protect user uploads
- Custom claims validate admin actions
- Published content only visible to public

## 📊 Collections

- `users` - User profiles and green points
- `events` - Club events and activities
- `posts` - Blog posts (CMS)
- `impactReports` - Member activity submissions

## 🌟 Key Workflows

1. **New User Signup**
   - Sign up → Cloud Function assigns member role → Welcome page → Complete profile → Member Dashboard

2. **Admin Creates Event**
   - Admin Dashboard → Event Manager → Create Event → Visible on Public Dashboard

3. **Member Logs Activity**
   - Member Dashboard → Log Activity → Submit Report → Admin Approval Queue

4. **Admin Publishes Blog**
   - Admin Dashboard → Blog CMS → Create Post → Publish → Visible on Public Dashboard

## 📝 License

MIT

---

**Made with 💚 for environmental impact**
