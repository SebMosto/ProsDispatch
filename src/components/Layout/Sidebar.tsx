import { Link, useLocation } from '../../lib/router';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { useInvoicesByContractor } from '../../hooks/useInvoices';
import { useAuth } from '../../lib/auth';

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

const useOverdueCount = () => {
  const { invoices } = useInvoicesByContractor();
  return useMemo(() => invoices.filter((inv) => inv.status === 'overdue').length, [invoices]);
};

const Sidebar = () => {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { profile } = useAuth();
  const overdueCount = useOverdueCount();
  const initials = useMemo(() => {
    const fullName = profile?.full_name?.trim() ?? '';
    if (!fullName) return 'PD';
    const parts = fullName.split(/\s+/).filter(Boolean);
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase() || 'PD';
  }, [profile?.full_name]);

  const NAV_ITEMS = useMemo(() => [
    {
      label: t('layout.nav.dashboard'),
      href: '/dashboard',
      section: 'main',
      icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="1" width="6" height="6" rx="1" /><rect x="9" y="1" width="6" height="6" rx="1" /><rect x="1" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" /></svg>,
    },
    {
      label: t('layout.nav.jobs'),
      href: '/jobs',
      section: 'main',
      icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="12" height="11" rx="1" /><path d="M5 3V1M11 3V1M2 7h12" /></svg>,
    },
    {
      label: t('layout.nav.clients'),
      href: '/clients',
      section: 'main',
      icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="5" r="3" /><path d="M2 14c0-3 2.7-5 6-5s6 2 6 5" /></svg>,
    },
    {
      label: t('layout.nav.invoices'),
      href: '/invoices',
      section: 'main',
      icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="12" height="13" rx="1" /><path d="M5 6h6M5 9h6M5 12h4" /></svg>,
      badge: overdueCount > 0 ? overdueCount : undefined,
    },
    {
      label: t('layout.nav.settings'),
      href: '/settings',
      section: 'account',
      icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="3" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M3.2 12.8l1.4-1.4M11.4 4.6l1.4-1.4" /></svg>,
    },
  ], [t, overdueCount]);

  return (
    <aside className="hidden w-[160px] shrink-0 border-r-[1.5px] border-[#0F172A] bg-white py-3 md:flex md:flex-col">
      <div className="mb-1 mt-[14px] px-3 text-[9px] font-bold uppercase tracking-[1px] text-[#CBD5E1]">
        {t('layout.nav.main')}
      </div>
      {NAV_ITEMS.filter((item) => item.section === 'main').map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            to={item.href}
            className={`flex w-full items-center gap-2 border-l-[3px] px-3 py-2 text-[12px] transition-colors ${
              active
                ? 'border-[#FF5C1B] bg-[hsl(220_20%_97%)] font-bold text-[#0F172A]'
                : 'border-transparent font-medium text-[#64748B] hover:bg-[hsl(220_20%_97%)] hover:text-[#0F172A]'
            }`}
          >
            <span className="size-[14px]">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge != null ? (
              <span
                className="ml-auto rounded-full bg-[#FF5C1B] px-[5px] py-[1px] text-[9px] font-bold text-[#1F1308]"
                aria-label={t('layout.nav.overdueCount', { count: item.badge })}
              >
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
      <div className="mb-1 mt-[14px] px-3 text-[9px] font-bold uppercase tracking-[1px] text-[#CBD5E1]">
        {t('layout.nav.account')}
      </div>
      {NAV_ITEMS.filter((item) => item.section === 'account').map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            to={item.href}
            className={`flex w-full items-center gap-2 border-l-[3px] px-3 py-2 text-[12px] transition-colors ${
              active
                ? 'border-[#FF5C1B] bg-[hsl(220_20%_97%)] font-bold text-[#0F172A]'
                : 'border-transparent font-medium text-[#64748B] hover:bg-[hsl(220_20%_97%)] hover:text-[#0F172A]'
            }`}
          >
            <span className="size-[14px]">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
      <div className="mt-auto border-t border-[#E2E8F0] px-3 pt-[10px]">
        <div className="flex items-center gap-[7px]">
          <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full border-[1.5px] border-[#0F172A] bg-[#FF5C1B] text-[9px] font-bold text-[#1F1308]">
            {initials}
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#0F172A]">{profile?.full_name ?? t('layout.brand')}</div>
            <div className="text-[10px] text-[#94A3B8]">{profile?.business_name ?? 'Contractor'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export const BottomNav = () => {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const overdueCount = useOverdueCount();

  const NAV_ITEMS = useMemo(() => [
    { label: t('layout.nav.dashboard'), href: '/dashboard' },
    { label: t('layout.nav.jobs'), href: '/jobs' },
    { label: t('layout.nav.clients'), href: '/clients' },
    { label: t('layout.nav.invoices'), href: '/invoices', badge: overdueCount > 0 ? overdueCount : undefined },
    { label: t('layout.nav.settings'), href: '/settings' },
  ], [t, overdueCount]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 h-[56px] border-t-[1.5px] border-[#0F172A] bg-white md:hidden">
      <ul className="flex h-full items-center justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href} className="w-full">
              <Link
                to={item.href}
                className={`relative flex h-full flex-col items-center justify-center gap-1 px-3 py-2 text-xs font-semibold transition ${
                  active ? 'text-[#0F172A]' : 'text-[#64748B]'
                }`}
              >
                <span>{item.label}</span>
                {item.badge != null ? (
                  <span
                    className="absolute right-1 top-1 inline-flex min-w-[1rem] items-center justify-center rounded-full bg-[#FF5C1B] px-1 py-0.5 text-[10px] font-bold text-[#1F1308]"
                    aria-label={t('layout.nav.overdueCount', { count: item.badge })}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Sidebar;
