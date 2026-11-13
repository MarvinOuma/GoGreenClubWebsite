import { Link, NavLink, useLocation } from 'react-router-dom';
import { FiArrowUpRight } from 'react-icons/fi';
import { adminLinks, memberLinks } from './dashboardLinks';

export function DashboardLayout({ children }) {
  const isAdmin = useLocation().pathname.startsWith('/admin');
  const links = isAdmin ? adminLinks : memberLinks;
  const area = isAdmin ? 'Command Center' : 'Impact Hub';

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-ivory lg:flex">
      <aside className="hidden w-52 shrink-0 bg-forest text-white lg:block xl:w-60">
        <div className="sticky top-16 max-h-[calc(100dvh-4rem)] overflow-y-auto p-5">
          <Link to="/" className="flex items-center justify-between gap-2 border-b border-white/20 pb-5 font-display text-lg font-semibold">
            {area} <FiArrowUpRight aria-hidden="true" className="shrink-0 text-lime-accent" />
          </Link>
          <nav aria-label={area} className="mt-5 space-y-1">
            {links.map(({ path, label }) => (
              <NavLink key={path} to={path} end
                className={({ isActive }) => `block rounded-lg px-3 py-3 text-sm font-semibold ${isActive
                  ? 'bg-lime-accent text-ink' : 'text-emerald-50 hover:bg-white/10'}`}>
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-5 py-6 md:p-7 lg:p-10">{children}</main>
    </div>
  );
}
