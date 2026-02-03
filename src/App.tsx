import type { ReactNode } from 'react';
import LanguageSwitcher from './components/LanguageSwitcher';
import HomePage from './pages/HomePage';
import SignUpPage from './pages/auth/SignUpPage';
import SignInPage from './pages/auth/SignInPage';
import DashboardPage from './pages/DashboardPage';
import CreateJobPage from './pages/jobs/CreateJobPage';
import JobDetailPage from './pages/jobs/JobDetailPage';
import CreateInvoicePage from './pages/invoices/CreateInvoicePage';
import InvoiceDetailPage from './pages/invoices/InvoiceDetailPage';
import PublicInvoicePage from './pages/public/PublicInvoicePage';
import { AuthProvider, ProtectedRoute } from './lib/auth';
import { useTranslation } from 'react-i18next';
import { Navigate, Route, RouterProvider, Routes, Link, useLocation, routePatterns } from './lib/router';
import { useAuth } from './lib/auth';
import JobsListPage from './pages/jobs/JobsListPage';
import ClientsListPage from './pages/clients/ClientsListPage';
import CreateClientPage from './pages/clients/CreateClientPage';
import CreatePropertyPage from './pages/clients/CreatePropertyPage';
import ClientDetailPage from './pages/clients/ClientDetailPage';
import Sidebar, { BottomNav } from './components/Layout/Sidebar';

const AppShell = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const isPublicInvoice = pathname.startsWith('/pay/');

  if (isPublicInvoice) {
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
        <nav aria-label={t('layout.nav.mainNavigation')} className="flex items-center gap-3">
          {user ? (
            <>
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
            </>
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
  <RouterProvider>
    <AuthProvider>
      <AppShell>
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
          <Route path={routePatterns.publicInvoice} element={<PublicInvoicePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </AuthProvider>
  </RouterProvider>
);

export default App;
