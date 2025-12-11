import type { ReactNode } from 'react';
import LanguageSwitcher from './components/LanguageSwitcher';
import HomePage from './pages/HomePage';
import SignUpPage from './pages/auth/SignUpPage';
import SignInPage from './pages/auth/SignInPage';
import DashboardPage from './pages/DashboardPage';
import { AuthProvider, ProtectedRoute } from './lib/auth';
import { useTranslation } from 'react-i18next';
import { Navigate, Route, RouterProvider, Routes } from './lib/router';

const AppShell = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand" aria-label={t('layout.brand')}>
          {t('layout.brand')}
        </div>
        <LanguageSwitcher />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </AuthProvider>
  </RouterProvider>
);

export default App;
