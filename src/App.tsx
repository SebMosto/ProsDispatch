import type { ReactNode } from 'react';
import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import LanguageSwitcher from './components/LanguageSwitcher';
import { AuthProvider, ProtectedRoute } from './lib/auth';
import { useTranslation } from 'react-i18next';
import { routePatterns } from './lib/router';
import { useAuth } from './lib/auth';
import Sidebar, { BottomNav } from './components/Layout/Sidebar';
import { PageLoader } from './components/ui/PageLoader';
import { JobInvitePage } from './pages/JobInvitePage';

// Lazy loaded pages
const HomePage = lazy(() => import('./pages/HomePage'));
const SignUpPage = lazy(() => import('./pages/auth/SignUpPage'));
const SignInPage = lazy(() => import('./pages/auth/SignInPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CreateJobPage = lazy(() => import('./pages/jobs/CreateJobPage'));
const JobDetailPage = lazy(() => import('./pages/jobs/JobDetailPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const CreateInvoicePage = lazy(() => import('./pages/invoices/CreateInvoicePage'));
const InvoiceDetailPage = lazy(() => import('./pages/invoices/InvoiceDetailPage'));
const PublicInvoicePage = lazy(() => import('./pages/public/PublicInvoicePage'));
const JobsListPage = lazy(() => import('./pages/jobs/JobsListPage'));
const ClientsListPage = lazy(() => import('./pages/clients/ClientsListPage'));
const CreateClientPage = lazy(() => import('./pages/clients/CreateClientPage'));
const CreatePropertyPage = lazy(() => import('./pages/clients/CreatePropertyPage'));
const ClientDetailPage = lazy(() => import('./pages/clients/ClientDetailPage'));

const AppShell = ({ children }: { children: ReactNode }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { pathname } = useLocation();

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);
  const isPublicPage = pathname.startsWith('/pay/') || pathname.startsWith('/job-invite/');

  if (isPublicPage) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex w-full max-w-4xl items-center px-4 py-4 sm:px-6 lg:px-8">
            <div className="text-lg font-semibold text-slate-900" aria-label={t('layout.brand')}>
              {t('layout.brand')}
            </div>
          </div>
        </header>
        <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand" aria-label={t('layout.brand')}>
          {t('layout.brand')}
        </div>
        <nav aria-label="Main navigation" className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 md:hidden">
              <Link className="text-sm font-medium text-slate-800 hover:underline" to="/dashboard">
                {t('layout.nav.dashboard')}
              </Link>
              <Link className="text-sm font-medium text-slate-800 hover:underline" to="/jobs">
                {t('layout.nav.jobs')}
              </Link>
              <Link className="text-sm font-medium text-slate-800 hover:underline" to="/jobs/new">
                {t('layout.nav.newJob')}
              </Link>
              <Link className="text-sm font-medium text-slate-800 hover:underline" to="/clients">
                {t('layout.nav.clients')}
              </Link>
            </div>
          ) : null}
          <LanguageSwitcher />
        </nav>
      </header>
      <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        {user ? <Sidebar /> : null}
        <div className="flex-1">{children}</div>
      </div>
      {user ? <BottomNav /> : null}
    </div>
  );
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppShell>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<SignInPage />} />
            <Route path="/register" element={<SignUpPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs"
              element={
                <ProtectedRoute>
                  <JobsListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs/new"
              element={
                <ProtectedRoute>
                  <CreateJobPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs/:id"
              element={
                <ProtectedRoute>
                  <JobDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path={routePatterns.createInvoice}
              element={
                <ProtectedRoute>
                  <CreateInvoicePage />
                </ProtectedRoute>
              }
            />
            <Route
              path={routePatterns.invoiceDetail}
              element={
                <ProtectedRoute>
                  <InvoiceDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices/:id/edit"
              element={
                <ProtectedRoute>
                  <InvoiceDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients"
              element={
                <ProtectedRoute>
                  <ClientsListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients/new"
              element={
                <ProtectedRoute>
                  <CreateClientPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients/:id"
              element={
                <ProtectedRoute>
                  <ClientDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients/:id/properties/new"
              element={
                <ProtectedRoute>
                  <CreatePropertyPage />
                </ProtectedRoute>
              }
            />
            <Route path="/job-invite/:token" element={<JobInvitePage />} />
            <Route path={routePatterns.publicInvoice} element={<PublicInvoicePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppShell>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
