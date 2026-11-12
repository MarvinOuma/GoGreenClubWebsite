import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { logout } from '../firebase/auth';
import { useEffect, useRef, useState } from 'react';
import { useToast } from './ui/ToastProvider';

const publicLinks = [
  ['/', 'Home'], ['/about', 'About'], ['/events', 'Events'], ['/blog', 'Blog'],
];

const linkClass = ({ isActive }) => `flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold ${isActive
  ? 'bg-ivory text-forest' : 'text-muted hover:bg-ivory hover:text-forest'}`;

export function Navbar() {
  const { currentUser, isAdminUser } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const toast = useToast();
  const trigger = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Signed out');
      navigate('/');
    } catch {
      toast.error('Sign out failed', 'Please try again.');
    }
  };

  const links = [...publicLinks, ...(currentUser ? [
    ['/member', 'Dashboard'], ...(isAdminUser ? [['/admin', 'Admin']] : []),
  ] : [['/login', 'Sign in']])];

  const renderLinks = () => (
    <>
      {links.map(([path, label]) => (
        <NavLink to={path} key={path} end={path === '/'} className={linkClass} onClick={() => setOpen(false)}>{label}</NavLink>
      ))}
      {currentUser ? (
        <button type="button" className="btn-secondary text-sm" onClick={handleLogout}>Sign out</button>
      ) : (
        <Link to="/signup" className="btn-primary text-sm" onClick={() => setOpen(false)}>Join the club</Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white">
      <nav aria-label="Main navigation" className="site-container" onKeyDown={event => {
        if (event.key === 'Escape' && open) {
          setOpen(false);
          trigger.current?.focus();
        }
      }}>
        <div className="flex h-16 items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight text-forest">
            <img src="/logo.png" alt="" className="size-9 object-contain" width="36" height="36" />
            GoGreen Club
          </Link>
          <div className="hidden items-center gap-1 lg:flex">{renderLinks()}</div>
          <button
            ref={trigger}
            type="button"
            onClick={() => setOpen(value => !value)}
            aria-expanded={open}
            aria-controls="site-mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="btn-secondary px-3 py-2 lg:hidden"
          >
            {open ? <FiX aria-hidden="true" size={20} /> : <FiMenu aria-hidden="true" size={20} />}
          </button>
        </div>
        <div id="site-mobile-menu" hidden={!open} className="border-t border-line py-3 lg:hidden">
          {open && <div className="grid gap-1">{renderLinks()}</div>}
        </div>
      </nav>
    </header>
  );
}
