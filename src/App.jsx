import { Component, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { ToastProvider } from './components/ui/ToastProvider';
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Signup = lazy(() => import('./pages/Signup').then(module => ({ default: module.Signup })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(module => ({ default: module.ResetPassword })));
const Welcome = lazy(() => import('./pages/Welcome').then(module => ({ default: module.Welcome })));
const MemberDashboard = lazy(() => import('./pages/MemberDashboard').then(module => ({ default: module.MemberDashboard })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const BlogCMS = lazy(() => import('./pages/BlogCMS').then(module => ({ default: module.BlogCMS })));
const PublicDashboard = lazy(() => import('./pages/PublicDashboard').then(module => ({ default: module.PublicDashboard })));
const About = lazy(() => import('./pages/About').then(module => ({ default: module.About })));
const Events = lazy(() => import('./pages/Events').then(module => ({ default: module.Events })));
const Blog = lazy(() => import('./pages/Blog').then(module => ({ default: module.Blog })));
const BlogPost = lazy(() => import('./pages/BlogPost').then(module => ({ default: module.BlogPost })));
const EventManager = lazy(() => import('./pages/EventManager').then(module => ({ default: module.EventManager })));
const UserManagement = lazy(() => import('./pages/UserManagement').then(module => ({ default: module.UserManagement })));
const ApprovalQueue = lazy(() => import('./pages/ApprovalQueue').then(module => ({ default: module.ApprovalQueue })));
const MemberProfile = lazy(() => import('./pages/MemberProfile').then(module => ({ default: module.MemberProfile })));
const MemberActivities = lazy(() => import('./pages/MemberActivities').then(module => ({ default: module.MemberActivities })));
const MyEvents = lazy(() => import('./pages/MyEvents').then(module => ({ default: module.MyEvents })));
const PartnersAdmin = lazy(() => import('./pages/PartnersAdmin').then(module => ({ default: module.PartnersAdmin })));
const PartnerInbox = lazy(() => import('./pages/PartnerInbox').then(module => ({ default: module.PartnerInbox })));

class PageErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? (
      <main className="mx-auto max-w-2xl space-y-4 p-6">
        <h1>This page couldn’t load</h1>
        <button className="btn-primary" onClick={() => window.location.reload()}>Reload page</button>
      </main>
    ) : this.props.children;
  }
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <Navbar />
          <PageErrorBoundary>
            <Suspense fallback={<p className="p-6" role="status">Loading page…</p>}>
              <Routes>
            <Route path="/" element={<PublicDashboard />} />
            <Route path="/about" element={<About />} />
            <Route path="/events" element={<Events />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:id" element={<BlogPost />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/welcome" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
            <Route path="/member" element={<ProtectedRoute><MemberDashboard /></ProtectedRoute>} />
            <Route path="/member/profile" element={<ProtectedRoute><MemberProfile /></ProtectedRoute>} />
            <Route path="/member/activities" element={<ProtectedRoute><MemberActivities /></ProtectedRoute>} />
            <Route path="/member/events" element={<ProtectedRoute><MyEvents /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/events" element={<ProtectedRoute adminOnly><EventManager /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute adminOnly><UserManagement /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute adminOnly><ApprovalQueue /></ProtectedRoute>} />
            <Route path="/admin/blog" element={<ProtectedRoute adminOnly><BlogCMS /></ProtectedRoute>} />
            <Route path="/admin/partners" element={<ProtectedRoute adminOnly><PartnersAdmin /></ProtectedRoute>} />
            <Route path="/admin/messages" element={<ProtectedRoute adminOnly><PartnerInbox /></ProtectedRoute>} />
              </Routes>
            </Suspense>
          </PageErrorBoundary>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
