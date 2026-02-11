import { Link, useLocation } from '../../lib/router';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

const Sidebar = () => {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const NAV_ITEMS = useMemo(() => [
    { label: t('layout.nav.dashboard'), href: '/dashboard' },
    { label: t('layout.nav.jobs'), href: '/jobs' },
    { label: t('layout.nav.clients'), href: '/clients' },
    { label: t('layout.nav.settings'), href: '/settings' },
  ], [t]);

  return (
    <aside className="hidden w-56 shrink-0 md:block">
      <nav className="space-y-1 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition ${
                active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              <span>{item.label}</span>
              {active ? (
                <span className="text-xs font-medium text-white/80" aria-hidden>
                  {t('layout.nav.active')}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export const BottomNav = () => {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const NAV_ITEMS = useMemo(() => [
    { label: t('layout.nav.dashboard'), href: '/dashboard' },
    { label: t('layout.nav.jobs'), href: '/jobs' },
    { label: t('layout.nav.clients'), href: '/clients' },
    { label: t('layout.nav.settings'), href: '/settings' },
  ], [t]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-slate-200 bg-white shadow-inner md:hidden">
      <ul className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href} className="w-full">
              <Link
                to={item.href}
                className={`flex h-full flex-col items-center justify-center gap-1 rounded-md px-3 py-2 text-xs font-semibold transition ${
                  active ? 'bg-slate-900 text-white' : 'text-slate-800 hover:bg-slate-100'
                }`}
              >
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Sidebar;
