import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../firebase/auth';
import { useEffect, useState } from 'react';
import { useToast } from './ui/ToastProvider';

export const Navbar = () => {
  const { currentUser, isAdminUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Signed out', 'See you next time.');
      navigate('/');
    } catch (e) {
      console.error('Logout failed:', e);
      toast.error('Sign out failed', 'Please try again.');
    }
  };

  const closeMobile = () => setMobileMenuOpen(false);

  useEffect(() => {
    closeMobile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const navLinkClass = ({ isActive }) =>
    `text-sm font-semibold transition ${
      isActive ? 'text-brand-green' : 'text-gray-700 hover:text-brand-green'
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b border-green-100 bg-white/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-3">
            <img src="/logo.png" alt="GoGreen Club" className="h-10 w-10" />
            <span className="text-lg font-extrabold tracking-tight text-brand-green hidden sm:block">GoGreen Club</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/about" className={navLinkClass}>
              About
            </NavLink>
            <NavLink to="/events" className={navLinkClass}>
              Events
            </NavLink>
            <NavLink to="/blog" className={navLinkClass}>
              Blog
            </NavLink>
            
            {currentUser ? (
              <>
                <NavLink to="/member" className={navLinkClass}>
                  Dashboard
                </NavLink>
                {isAdminUser && (
                  <NavLink to="/admin" className={navLinkClass}>
                    Admin
                  </NavLink>
                )}
                <button onClick={handleLogout} className="btn-secondary text-sm py-2">
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navLinkClass}>
                  Login
                </NavLink>
                <Link to="/signup" className="btn-primary text-sm py-2">Join Now</Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden rounded-xl p-2 text-gray-700 hover:bg-green-50"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white animate-fade-in">
          <div className="px-4 py-4 space-y-3">
            <Link to="/" onClick={closeMobile} className={`block py-2 font-semibold ${location.pathname === '/' ? 'text-brand-green' : 'text-gray-700'}`}>Home</Link>
            <Link to="/about" onClick={closeMobile} className={`block py-2 font-semibold ${location.pathname === '/about' ? 'text-brand-green' : 'text-gray-700'}`}>About</Link>
            <Link to="/events" onClick={closeMobile} className={`block py-2 font-semibold ${location.pathname === '/events' ? 'text-brand-green' : 'text-gray-700'}`}>Events</Link>
            <Link to="/blog" onClick={closeMobile} className={`block py-2 font-semibold ${location.pathname.startsWith('/blog') ? 'text-brand-green' : 'text-gray-700'}`}>Blog</Link>
            
            {currentUser ? (
              <>
                <Link to="/member" onClick={closeMobile} className={`block py-2 font-semibold ${location.pathname.startsWith('/member') ? 'text-brand-green' : 'text-gray-700'}`}>Dashboard</Link>
                {isAdminUser && (
                  <Link to="/admin" onClick={closeMobile} className={`block py-2 font-semibold ${location.pathname.startsWith('/admin') ? 'text-brand-green' : 'text-gray-700'}`}>Admin</Link>
                )}
                <button onClick={() => { handleLogout(); closeMobile(); }} className="w-full btn-secondary text-sm py-3 mt-2">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={closeMobile} className={`block py-2 font-semibold ${location.pathname === '/login' ? 'text-brand-green' : 'text-gray-700'}`}>Login</Link>
                <Link to="/signup" onClick={closeMobile} className="block w-full btn-primary text-sm py-3 mt-2 text-center">Join Now</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
