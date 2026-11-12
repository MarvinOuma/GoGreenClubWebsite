import { useId, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FiArrowUpRight, FiMenu, FiX } from 'react-icons/fi';
import { Dialog } from '../components/ui/Dialog';
import { adminLinks, memberLinks } from './dashboardLinks';

function DashboardNav({ links, onNavigate }) {
  return (
    <nav aria-label="Dashboard" className="mt-5 space-y-1">
      {links.map(({ path, label }) => (
        <NavLink
          key={path}
          to={path}
          end
          onClick={onNavigate}
          className={({ isActive }) => `block rounded-lg px-3 py-3 text-sm font-semibold ${isActive
            ? 'bg-lime-accent text-ink'
            : 'text-emerald-50 hover:bg-white/10'}`}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export function DashboardLayout({ children, title }) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const isAdmin = useLocation().pathname.startsWith('/admin');
  const links = isAdmin ? adminLinks : memberLinks;
  const area = isAdmin ? 'Command Center' : 'Impact Hub';
  const close = () => setOpen(false);

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-ivory">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-white px-5 py-2 md:hidden">
        <span className="font-display text-lg font-semibold text-forest">{title}</span>
        <button type="button" onClick={() => setOpen(true)} className="btn-secondary px-3 py-2" aria-label="Open dashboard navigation" aria-haspopup="dialog">
          <FiMenu aria-hidden="true" size={19} />
        </button>
      </div>

      <div className="mx-auto md:flex md:min-h-[calc(100dvh-4rem)]">
        <aside className="hidden w-52 shrink-0 bg-forest text-white md:block xl:w-60">
          <div className="sticky top-16 max-h-[calc(100dvh-4rem)] overflow-y-auto p-5">
            <Link to="/" className="flex items-center justify-between gap-2 border-b border-white/20 pb-5 font-display text-lg font-semibold">
              {area} <FiArrowUpRight aria-hidden="true" className="shrink-0 text-lime-accent" />
            </Link>
            <DashboardNav links={links} />
          </div>
        </aside>
        <main className="min-w-0 flex-1 px-5 py-6 md:p-7 lg:p-10">
          {children}
        </main>
      </div>

      <Dialog open={open} onClose={close} titleId={titleId} className="dialog-drawer max-w-xs bg-forest text-white">
        <div className="p-5">
          <div className="flex items-center justify-between gap-3 border-b border-white/20 pb-5">
            <h2 id={titleId} className="text-xl font-semibold">{area}</h2>
            <button type="button" onClick={close} className="btn-secondary px-3 py-2" aria-label="Close dashboard navigation">
              <FiX aria-hidden="true" size={18} />
            </button>
          </div>
          <DashboardNav links={links} onNavigate={close} />
        </div>
      </Dialog>
    </div>
  );
}
