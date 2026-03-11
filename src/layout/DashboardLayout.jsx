import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export const DashboardLayout = ({ children, links, title }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(134,239,172,0.35),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(167,243,208,0.25),transparent_40%)]" />
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-extrabold tracking-tight text-brand-green">{title}</h1>
        <button onClick={() => setDrawerOpen(true)} className="p-2 hover:bg-green-50 rounded-xl" aria-label="Open navigation">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div className="md:flex">
        {/* Desktop Sidebar - Hidden on Mobile */}
        <aside className="hidden md:block w-72 bg-white/80 backdrop-blur border-r border-gray-200 min-h-screen sticky top-0">
          <div className="p-6">
            <Link to="/" className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm hover:shadow-md transition">
              <img src="/logo.png" alt="GoGreen Club" className="h-10 w-10" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500">GoGreen Club</p>
                <p className="text-base font-extrabold tracking-tight text-brand-green truncate">{title}</p>
              </div>
            </Link>
            <nav className="space-y-2">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-4 py-3 rounded-xl transition-all ${
                    location.pathname === link.path
                      ? 'bg-brand-green text-white shadow-sm'
                      : 'text-gray-700 hover:bg-green-50 hover:text-brand-green'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Mobile Drawer - Only on Mobile */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" 
            onClick={closeDrawer}
          />
          
          {/* Drawer */}
          <div className="fixed top-0 right-0 h-full w-80 max-w-[80vw] bg-white shadow-2xl z-50 md:hidden transform transition-transform duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-brand-green">{title}</h2>
                <button onClick={closeDrawer} className="p-2 hover:bg-green-50 rounded-xl" aria-label="Close navigation">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="space-y-2">
                {links.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={closeDrawer}
                    className={`block px-4 py-3 rounded-xl transition-all ${
                      location.pathname === link.path
                        ? 'bg-brand-green text-white'
                        : 'text-gray-700 hover:bg-green-50 hover:text-brand-green'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
