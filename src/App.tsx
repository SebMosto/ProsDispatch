import type { ReactNode } from 'react';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import LanguageSwitcher from './components/LanguageSwitcher';
import { AuthProvider, ProtectedRoute } from './lib/auth';
import { useTranslation } from 'react-i18next';
import { routePatterns } from './lib/router';
import { useAuth } from './lib/auth';
import Sidebar, { BottomNav } from './components/Layout/Sidebar';
import { PageLoader } from './components/ui/PageLoader';

// Lazy loaded pages
const HomePage = lazy(() => import('./pages/HomePage'));
const SignUpPage = lazy(() => import('./pages/auth/SignUpPage'));
const SignInPage = lazy(() => import('./pages/auth/SignInPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CreateJobPage = lazy(() => import('./pages/jobs/CreateJobPage'));
const JobDetailPage = lazy(() => import('./pages/jobs/JobDetailPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const BillingSettingsPage = lazy(() => import('./pages/BillingSettingsPage'));
const StripeConnectPage = lazy(() => import('./pages/StripeConnectPage'));
const CreateInvoicePage = lazy(() => import('./pages/invoices/CreateInvoicePage'));
const InvoiceDetailPage = lazy(() => import('./pages/invoices/InvoiceDetailPage'));
const InvoicesListPage = lazy(() => import('./pages/invoices/InvoicesListPage'));
const PublicInvoicePage = lazy(() => import('./pages/public/PublicInvoicePage'));
const JobsListPage = lazy(() => import('./pages/jobs/JobsListPage'));
const ClientsListPage = lazy(() => import('./pages/clients/ClientsListPage'));
const CreateClientPage = lazy(() => import('./pages/clients/CreateClientPage'));
const CreatePropertyPage = lazy(() => import('./pages/clients/CreatePropertyPage'));
const ClientDetailPage = lazy(() => import('./pages/clients/ClientDetailPage'));
const ClientEditPage = lazy(() => import('./pages/clients/ClientEditPage'));
const JobApprovalPage = lazy(() => import('./pages/JobApprovalPage'));
const SubscribePage = lazy(() => import('./pages/SubscribePage'));

const AuthRedirect = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const AppShell = ({ children }: { children: ReactNode }) => {
  const { t, i18n } = useTranslation();
  const { user, profile } = useAuth();
  const { pathname } = useLocation();
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const initials = useMemo(() => {
    const fullName = profile?.full_name?.trim() ?? '';
    if (!fullName) return t('layout.initials');
    const parts = fullName.split(/\s+/).filter(Boolean);
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase() || t('layout.initials');
  }, [profile?.full_name, t]);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const isPublicPage = pathname.startsWith('/pay/') || pathname.startsWith('/jobs/approve/');

  if (isPublicPage) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="text-lg font-semibold text-slate-900" aria-label={t('layout.brand')}>
              {t('layout.brand')}
            </div>
            <LanguageSwitcher />
          </div>
        </header>
        <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(220_20%_97%)] text-[13px] dark:bg-slate-900">
      <header className="flex h-[52px] items-center justify-between border-b border-[#CBD5E1] bg-white px-5 dark:border-slate-700 dark:bg-slate-900">
        <Link to="/dashboard" className="flex items-center gap-2" aria-label={t('layout.brand')}>
          <div className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] bg-[#0F172A] dark:bg-slate-700">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m15 12-8.5 8.5a2.12 2.12 0 1 1-3-3l8.5-8.5"/>
              <path d="M17.64 15 22 10.64"/>
              <path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 5.6a5.009 5.009 0 0 0-6.22.78l1.7 1.71"/>
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold text-[#0F172A] dark:text-white">Dispatch</span>
            <span className="mx-2 h-[15px] w-px bg-[#94A3B8] dark:bg-slate-500" />
            <span className="text-[14px] font-bold text-[#0F172A] dark:text-white">Labs</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setIsDark((prev) => !prev)}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[8px] text-[#64748B] transition-colors hover:bg-[#F1F5F9] dark:text-slate-400 dark:hover:bg-slate-700"
            aria-label={t('layout.darkModeAria')}
          >
            {isDark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          {user ? (
            <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-[#0F172A] bg-[#FF5C1B] text-[11px] font-bold text-[#1F1308]">
              {initials}
            </div>
          ) : null}
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl gap-0 pb-20 pt-0 sm:px-0">
        {user ? <Sidebar /> : null}
        <div className="flex-1 px-4 pt-6 sm:px-6 lg:px-8">{children}</div>
      </div>
      {user ? <BottomNav /> : null}
    </div>
  );
};

const ProtectedLayout = () => (
  <ProtectedRoute>
    <AppShell>
      <Outlet />
    </AppShell>
  </ProtectedRoute>
);

const PublicLayout = () => (
  <AppShell>
    <Outlet />
  </AppShell>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route
              path="/"
              element={
                <AuthRedirect>
                  <HomePage />
                </AuthRedirect>
              }
            />
            <Route path="/login" element={<SignInPage />} />
            <Route path="/register" element={<SignUpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path={routePatterns.jobApproval} element={<JobApprovalPage />} />
            <Route path={routePatterns.publicInvoice} element={<PublicInvoicePage />} />
          </Route>

          <Route element={<ProtectedLayout />}>
            <Route path="/subscribe" element={<SubscribePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/billing" element={<BillingSettingsPage />} />
            <Route path="/settings/stripe" element={<StripeConnectPage />} />
            <Route path="/jobs" element={<JobsListPage />} />
            <Route path="/jobs/new" element={<CreateJobPage />} />
            <Route path="/jobs/:id" element={<JobDetailPage />} />
            <Route path="/invoices" element={<InvoicesListPage />} />
            <Route path={routePatterns.createInvoice} element={<CreateInvoicePage />} />
            <Route path={routePatterns.invoiceDetail} element={<InvoiceDetailPage />} />
            <Route path="/invoices/:id/edit" element={<InvoiceDetailPage />} />
            <Route path="/clients" element={<ClientsListPage />} />
            <Route path="/clients/new" element={<CreateClientPage />} />
            <Route path="/clients/:id" element={<ClientDetailPage />} />
            <Route path="/clients/:id/edit" element={<ClientEditPage />} />
            <Route path="/clients/:id/properties/new" element={<CreatePropertyPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
