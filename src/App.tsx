import type { ReactNode } from 'react';
import LanguageSwitcher from './components/LanguageSwitcher';
import HomePage from './pages/HomePage';
import SignUpPage from './pages/auth/SignUpPage';
import SignInPage from './pages/auth/SignInPage';
import DashboardPage from './pages/DashboardPage';
import CreateJobPage from './pages/jobs/CreateJobPage';
import JobDetailPage from './pages/jobs/JobDetailPage';
import { AuthProvider, ProtectedRoute } from './lib/auth';
import { useTranslation } from 'react-i18next';
import { Navigate, Route, RouterProvider, Routes, Link } from './lib/router';
import { useAuth } from './lib/auth';
import JobsListPage from './pages/jobs/JobsListPage';

const AppShell = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand" aria-label={t('layout.brand')}>
          {t('layout.brand')}
        </div>
        <nav aria-label="Main navigation" className="flex items-center gap-3">
          {user ? (
            <>
              <Link className="text-sm font-medium text-slate-800 hover:underline" to="/dashboard">
                Dashboard
              </Link>
              <Link className="text-sm font-medium text-slate-800 hover:underline" to="/jobs">
                Jobs
              </Link>
              <Link className="text-sm font-medium text-slate-800 hover:underline" to="/jobs/new">
                New Job
              </Link>
            </>
          ) : null}
          <LanguageSwitcher />
        </nav>
      </header>
      {children}
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </AuthProvider>
  </RouterProvider>
);

export default App;
