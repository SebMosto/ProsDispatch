import { useTranslation } from 'react-i18next';
import { useAuth } from '../lib/auth';
import { useSubscription } from '../hooks/useSubscription'; // <--- IMPORT THIS

const DashboardPage = () => {
  const { t } = useTranslation();
  const { user, profile, signOut } = useAuth();
  const { checkout, isLoading, error } = useSubscription(); // <--- USE HOOK
  const TEST_PRICE_ID = "price_1Sq0myL7ioFFaVuvoWjd7pgP";

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-1">
        <p className="text-sm font-medium text-slate-600">{t('auth.dashboard.greeting')}</p>
        <h1 className="text-2xl font-semibold text-slate-900">{t('auth.dashboard.title')}</h1>
        <p className="text-sm text-slate-600">{t('auth.dashboard.subtitle')}</p>
      </header>

      {/* --- TEMPORARY SUBSCRIPTION TEST SECTION --- */}
      <section className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
        <h2 className="font-semibold text-blue-900">{t('auth.dashboard.subscriptionTest')}</h2>
        <p className="mb-3 text-sm text-blue-700">{t('auth.dashboard.testConnection')}</p>

        {error && (
          <div className="mb-3 rounded bg-red-100 p-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={() => checkout(TEST_PRICE_ID)}
          disabled={isLoading}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? t('auth.dashboard.processing') : t('auth.dashboard.testUpgrade')}
        </button>
      </section>
      {/* ------------------------------------------- */}

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-slate-800">{t('auth.shared.email')}</dt>
            <dd className="text-slate-700">{profile?.email || user?.email}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-800">{t('auth.signUp.fullName')}</dt>
            <dd className="text-slate-700">{profile?.full_name || t('auth.dashboard.notProvided')}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-800">{t('auth.signUp.businessName')}</dt>
            <dd className="text-slate-700">{profile?.business_name || t('auth.dashboard.notProvided')}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-800">{t('auth.dashboard.role')}</dt>
            <dd className="text-slate-700">{profile?.role}</dd>
          </div>
        </dl>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">{t('auth.dashboard.sessionNote')}</p>
        <button
          type="button"
          onClick={signOut}
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
        >
          {t('auth.dashboard.signOut')}
        </button>
      </div>
    </main>
  );
};

export default DashboardPage;
