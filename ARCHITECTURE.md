# GoGreen Club Platform - Architecture Documentation

## 🏗️ System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (React + Vite)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Public     │  │   Member     │  │    Admin     │      │
│  │  Dashboard   │  │  Dashboard   │  │  Dashboard   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Firebase Services                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │     Auth     │  │  Firestore   │  │   Storage    │      │
│  │  (Email/     │  │  (Database)  │  │   (Images)   │      │
│  │   Google)    │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │   Cloud      │  │   Hosting    │                         │
│  │  Functions   │  │              │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 Authentication Flow

### New User Registration

```
User Signs Up
    │
    ├─→ Firebase Auth creates user
    │
    ├─→ Cloud Function (onCreate trigger)
    │   └─→ Assigns custom claim: { role: 'member', admin: false }
    │
    ├─→ Redirect to /welcome
    │
    ├─→ User completes profile
    │   └─→ Data saved to Firestore users collection
    │
    └─→ Redirect to /member dashboard
```

### Login Flow

```
User Logs In
    │
    ├─→ Firebase Auth validates credentials
    │
    ├─→ AuthContext fetches user + custom claims
    │
    ├─→ Check role from custom claims
    │
    └─→ Redirect based on role:
        ├─→ Admin: /admin
        └─→ Member: /member
```

## 📊 Data Model

### Firestore Collections

#### users
```javascript
{
  uid: string,              // Firebase Auth UID
  name: string,
  email: string,
  branch: string,
  interests: string[],
  greenPoints: number,
  role: 'member' | 'admin',
  createdAt: timestamp
}
```

#### events
```javascript
{
  id: string,
  title: string,
  description: string,
  date: string,
  location: string,
  participants: string[],   // Array of user UIDs
  maxParticipants: number,
  createdAt: timestamp
}
```

#### posts
```javascript
{
  id: string,
  title: string,
  content: string,          // HTML or markdown
  authorName: string,
  coverImageUrl: string,    // Firebase Storage URL
  tags: string[],
  isPublished: boolean,
  createdAt: timestamp
}
```

#### impactReports
```javascript
{
  id: string,
  userId: string,
  activityType: string,     // 'recycling', 'tree_planting', etc.
  amount: string,           // '5kg', '3 trees', etc.
  description: string,
  status: 'pending' | 'approved' | 'rejected',
  greenPointsAwarded: number,
  createdAt: timestamp
}
```

## 🛡️ Security Model

### Firestore Security Rules

```
users/
  ├─ Read: Authenticated users
  ├─ Create: Owner only
  ├─ Update: Owner or Admin
  └─ Delete: Admin only

posts/
  ├─ Read: Public (if isPublished) or Admin
  ├─ Create: Admin only
  ├─ Update: Admin only
  └─ Delete: Admin only

events/
  ├─ Read: Public
  ├─ Create: Admin only
  ├─ Update: Admin only
  └─ Delete: Admin only

impactReports/
  ├─ Read: Authenticated users
  ├─ Create: Authenticated users
  ├─ Update: Admin only
  └─ Delete: Admin only
```

### Custom Claims

```javascript
// Member (default)
{
  role: 'member',
  admin: false
}

// Admin
{
  role: 'admin',
  admin: true
}
```

## 🎨 Component Architecture

### Component Hierarchy

```
App
├── AuthProvider (Context)
│   └── Router
│       ├── Navbar
│       └── Routes
│           ├── PublicDashboard (/)
│           ├── Login (/login)
│           ├── Signup (/signup)
│           ├── Welcome (/welcome) [Protected]
│           ├── MemberDashboard (/member) [Protected]
│           │   └── Sidebar
│           ├── AdminDashboard (/admin) [Protected + Admin]
│           │   └── Sidebar
│           └── BlogCMS (/admin/blog) [Protected + Admin]
│               └── Sidebar
```

### Reusable Components

- **Navbar**: Global navigation with auth-aware links
- **Sidebar**: Dashboard navigation (different links for member/admin)
- **ProtectedRoute**: HOC for route protection with role checking

### Context Providers

- **AuthContext**: Manages authentication state, user data, and role information

## 🔄 State Management

### Global State (Context)
- Current user
- User role
- Admin status
- Loading state

### Local State (Component)
- Form inputs
- UI toggles
- Fetched data (events, posts, reports)

## 🚀 Deployment Architecture

```
Development
    │
    ├─→ npm run dev (Vite dev server)
    └─→ localhost:5173

Production
    │
    ├─→ npm run build (Vite builds to /dist)
    │
    ├─→ firebase deploy --only hosting
    │   └─→ Uploads /dist to Firebase Hosting
    │
    ├─→ firebase deploy --only functions
    │   └─→ Deploys Cloud Functions
    │
    └─→ Live at: https://PROJECT_ID.web.app
```

## 📱 Responsive Design Strategy

### Breakpoints (Tailwind)
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Layout Strategy
- Mobile: Single column, hamburger menu
- Tablet: Flexible grid, collapsible sidebar
- Desktop: Full sidebar, multi-column grids

## ⚡ Performance Optimizations

### Frontend
- Code splitting with React Router
- Lazy loading for images
- Vite's optimized build process
- Minimal bundle size

### Backend
- Firestore indexes for common queries
- Pagination for large lists
- Caching with React state
- Optimistic UI updates

## 🔧 Environment Configuration

### Development
```
.env (local)
├─ Firebase config (dev project)
└─ Debug mode enabled
```

### Production
```
.env.production
├─ Firebase config (prod project)
└─ Analytics enabled
```

## 📈 Scalability Considerations

### Current Architecture (MVP)
- Single Firebase project
- Client-side rendering
- Direct Firestore queries

### Future Enhancements
- Server-side rendering (Next.js)
- API layer (Cloud Functions)
- Caching layer (Redis)
- CDN for static assets
- Multi-region deployment
- Real-time notifications (FCM)
- Advanced analytics (BigQuery)

## 🧪 Testing Strategy

### Unit Tests
- Component rendering
- Utility functions
- Form validation

### Integration Tests
- Authentication flow
- CRUD operations
- Role-based access

### E2E Tests
- User signup → profile completion
- Admin creates event → visible on public dashboard
- Member logs activity → admin approves

## 📊 Monitoring & Analytics

### Firebase Analytics
- User engagement
- Screen views
- Custom events

### Performance Monitoring
- Page load times
- API response times
- Error tracking

### Crashlytics
- Client-side error reporting
- Stack traces

## 🔐 Security Best Practices

1. ✅ Environment variables for sensitive data
2. ✅ Firestore security rules
3. ✅ Storage security rules
4. ✅ Custom claims for role-based access
5. ✅ Input validation
6. ✅ XSS protection (React escapes by default)
7. ✅ HTTPS only (Firebase Hosting)

## 🎯 Future Roadmap

### Phase 1 (MVP) ✅
- Basic authentication
- Three dashboards
- Blog CMS
- Event management

### Phase 2 (Enhancement)
- Real-time notifications
- Advanced gamification
- Social sharing
- Mobile app (React Native)

### Phase 3 (Scale)
- Multi-campus support
- Sponsor system
- Payment integration
- Advanced analytics

---

**Architecture Version**: 1.0  
**Last Updated**: January 2024
