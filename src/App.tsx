import type { ReactNode } from 'react';
import { lazy, Suspense, useEffect, useMemo } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
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
const AdminPortalPage = lazy(() => import('./pages/admin/AdminPortalPage'));
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
  const initials = useMemo(() => {
    const fullName = profile?.full_name?.trim() ?? '';
    if (!fullName) return t('layout.initials');
    const parts = fullName.split(/\s+/).filter(Boolean);
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase() || t('layout.initials');
  }, [profile?.full_name, t]);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);
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
    <div className="min-h-screen bg-[hsl(220_20%_97%)] text-[13px]">
      <header className="flex h-[52px] items-center justify-between border-b-[1.5px] border-[#0F172A] bg-white px-5">
        <div className="flex items-center gap-[9px]">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] bg-[#0F172A]">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden>
              <rect x="9" y="1" width="7" height="4.5" rx="1" transform="rotate(45 9 1)" fill="white" />
              <rect x="2" y="8" width="2" height="8" rx="1" transform="rotate(-45 2 8)" fill="white" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold text-[#0F172A]">Dispatch</span>
            <span className="mx-2 h-[15px] w-px bg-[#94A3B8]" />
            <span className="text-[14px] font-bold text-[#0F172A]">Labs</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {user ? (
            <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-[#0F172A] bg-[#FF5C1B] text-[11px] font-bold text-[#1F1308]">
              {initials}
            </div>
          ) : (
            <LanguageSwitcher />
          )}
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
            <Route path={routePatterns.adminPortal} element={<AdminPortalPage />} />
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
