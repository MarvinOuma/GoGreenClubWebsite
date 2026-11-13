import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import { useEffect, useId, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { logout } from '../firebase/auth';
import { adminLinks, memberLinks } from '../layout/dashboardLinks';
import { Dialog } from './ui/Dialog';
import { useToast } from './ui/ToastProvider';

const publicLinks = [
  { path: '/', label: 'Home' }, { path: '/about', label: 'About' },
  { path: '/events', label: 'Events' }, { path: '/blog', label: 'Blog' },
];

const linkClass = ({ isActive }) => `flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold ${isActive
  ? 'bg-ivory text-forest' : 'text-muted hover:bg-ivory hover:text-forest'}`;

function NavigationLinks({ links, onNavigate, exact = false }) {
  return links.map(({ path, label }) => (
    <NavLink to={path} key={path} end={exact || path === '/'} className={linkClass} onClick={onNavigate}>
      {label}
    </NavLink>
  ));
}

export function Navbar() {
  const { currentUser, isAdminUser } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const toast = useToast();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = ({ matches }) => { if (matches) setOpen(false); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      close();
      toast.success('Signed out');
      navigate('/');
    } catch {
      close();
      toast.error('Sign out failed', 'Please try again.');
    }
  };

  const accountAction = currentUser ? (
    <button type="button" className="btn-secondary text-sm" onClick={handleLogout}>Sign out</button>
  ) : (
    <>
      <NavLink to="/login" className={linkClass} onClick={close}>Sign in</NavLink>
      <Link to="/signup" className="btn-primary text-sm" onClick={close}>Join the club</Link>
    </>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white">
      <nav aria-label="Main navigation" className="site-container">
        <div className="flex h-16 items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-forest">
            <img src="/logo.png" alt="" className="size-10 shrink-0 object-contain" width="40" height="40" />
            GoGreen Club
          </Link>
          <div className="hidden items-center gap-1 lg:flex">
            <NavigationLinks links={publicLinks} />
            {currentUser && <NavLink to="/member" className={linkClass}>Dashboard</NavLink>}
            {isAdminUser && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
            {accountAction}
          </div>
          <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}
            className="btn-secondary px-3 py-2 text-sm lg:hidden">
            <FiMenu aria-hidden="true" size={19} /> Menu
          </button>
        </div>
      </nav>
      <Dialog open={open} onClose={close} titleId={titleId} className="dialog-drawer max-w-sm">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-5 py-3">
          <h2 id={titleId} className="text-xl font-semibold text-forest">GoGreen Club menu</h2>
          <button type="button" onClick={close} aria-label="Close menu" className="btn-secondary px-3 py-2">
            <FiX aria-hidden="true" size={19} />
          </button>
        </div>
        <div className="space-y-5 p-5">
          <nav aria-label="Public pages">
            <h3 className="px-3 text-sm font-semibold text-forest">Public pages</h3>
            <div className="mt-1 grid grid-cols-2"><NavigationLinks links={publicLinks} onNavigate={close} /></div>
          </nav>
          {currentUser && (
            <nav aria-label="Impact Hub" className="border-t border-line pt-4">
              <h3 className="px-3 text-sm font-semibold text-forest">Impact Hub</h3>
              <div className="mt-1 grid grid-cols-2"><NavigationLinks links={memberLinks} onNavigate={close} exact /></div>
            </nav>
          )}
          {isAdminUser && (
            <nav aria-label="Command Center" className="border-t border-line pt-4">
              <h3 className="px-3 text-sm font-semibold text-forest">Command Center</h3>
              <NavigationLinks links={adminLinks} onNavigate={close} exact />
            </nav>
          )}
          <div className="grid gap-2 border-t border-line pt-4">{accountAction}</div>
        </div>
      </Dialog>
    </header>
  );
}
