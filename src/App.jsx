import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { ToastProvider } from './components/ui/ToastProvider';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ResetPassword } from './pages/ResetPassword';
import { Welcome } from './pages/Welcome';
import { MemberDashboard } from './pages/MemberDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { BlogCMS } from './pages/BlogCMS';
import { PublicDashboard } from './pages/PublicDashboard';
import { About } from './pages/About';
import { Events } from './pages/Events';
import { Blog } from './pages/Blog';
import { BlogPost } from './pages/BlogPost';
import { EventManager } from './pages/EventManager';
import { UserManagement } from './pages/UserManagement';
import { ApprovalQueue } from './pages/ApprovalQueue';
import { MemberProfile } from './pages/MemberProfile';
import { MemberActivities } from './pages/MemberActivities';
import { MyEvents } from './pages/MyEvents';
import { PartnersAdmin } from './pages/PartnersAdmin';
import { PartnerInbox } from './pages/PartnerInbox';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <Navbar />
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
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
