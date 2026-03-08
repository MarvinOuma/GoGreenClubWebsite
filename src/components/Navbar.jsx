import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../firebase/auth';
import { useState } from 'react';

export const Navbar = () => {
  const { currentUser, isAdminUser } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-3">
            <img src="/logo.png" alt="GoGreen Club" className="h-10 w-10" />
            <span className="text-xl font-bold text-brand-green hidden sm:block">GoGreen Club</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-brand-green">Home</Link>
            <Link to="/about" className="text-gray-700 hover:text-brand-green">About</Link>
            <Link to="/events" className="text-gray-700 hover:text-brand-green">Events</Link>
            <Link to="/blog" className="text-gray-700 hover:text-brand-green">Blog</Link>
            
            {currentUser ? (
              <>
                <Link to="/member" className="text-gray-700 hover:text-brand-green">Dashboard</Link>
                {isAdminUser && (
                  <Link to="/admin" className="text-gray-700 hover:text-brand-green">Admin</Link>
                )}
                <button onClick={handleLogout} className="btn-secondary text-sm py-2">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-brand-green">Login</Link>
                <Link to="/signup" className="btn-primary text-sm py-2">Join Now</Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-3">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-700">Home</Link>
            <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-700">About</Link>
            <Link to="/events" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-700">Events</Link>
            <Link to="/blog" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-700">Blog</Link>
            
            {currentUser ? (
              <>
                <Link to="/member" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-700">Dashboard</Link>
                {isAdminUser && (
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-700">Admin</Link>
                )}
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full btn-secondary text-sm py-3 mt-2">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-700">Login</Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="block w-full btn-primary text-sm py-3 mt-2 text-center">Join Now</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
