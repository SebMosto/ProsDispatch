import type { ReactNode } from 'react';
import { Suspense, useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { Link } from './lib/router';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './components/LanguageSwitcher';
import Sidebar, { BottomNav } from './components/Layout/Sidebar';
import { PageLoader } from './components/ui/PageLoader';
import { AppRouter } from './routes/AppRouter';

const AppShell = ({ children }: { children: ReactNode }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { pathname } = useLocation();

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

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
        <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
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
        <div className="flex-1">
          {children}
        </div>
      </div>
      {user ? <BottomNav /> : null}
    </div>
  );
};

const App = () => {
  const { i18n } = useTranslation();

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell key={i18n.language}>
          <Suspense fallback={<PageLoader />}>
            <AppRouter />
          </Suspense>
        </AppShell>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
