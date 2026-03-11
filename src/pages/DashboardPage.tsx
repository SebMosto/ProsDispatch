import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../lib/auth';
import { useLocation, useNavigate } from '../lib/router';

const DashboardPage = () => {
  const { t } = useTranslation();
  const { user, profile, signOut, subscriptionStatus, trialDaysRemaining } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showSubscribedToast, setShowSubscribedToast] = useState(false);

  const showTrialBanner = useMemo(() => {
    if (subscriptionStatus !== 'trialing') return false;
    if (trialDaysRemaining <= 0) return false;
    if (sessionStorage.getItem('pd_trial_banner_dismissed') === '1') return false;
    return true;
  }, [subscriptionStatus, trialDaysRemaining]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('subscribed') === 'true') {
      // Defer state update to avoid synchronous setState warning
      setTimeout(() => {
        setShowSubscribedToast(true);
      }, 0);
      params.delete('subscribed');
      navigate({ pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : '' }, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  const dismissTrialBanner = () => {
    sessionStorage.setItem('pd_trial_banner_dismissed', '1');
  };

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-1">
        <p className="text-sm font-medium text-slate-600">{t('auth.dashboard.greeting')}</p>
        <h1 className="text-2xl font-semibold text-slate-900">{t('auth.dashboard.title')}</h1>
        <p className="text-sm text-slate-600">{t('auth.dashboard.subtitle')}</p>
      </header>

      {showSubscribedToast && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          {t('dashboard.subscribed.toast')}
        </div>
      )}

      {showTrialBanner && (
        <section className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p>
                {trialDaysRemaining === 1
                  ? t('dashboard.trial.urgent')
                  : t('dashboard.trial.banner', { days: trialDaysRemaining })}
              </p>
              <button
                type="button"
                onClick={() => navigate('/subscribe')}
                className="mt-2 inline-flex items-center rounded-md bg-slate-900 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                {t('dashboard.trial.cta')}
              </button>
            </div>
            <button
              type="button"
              onClick={dismissTrialBanner}
              aria-label="Dismiss"
              className="text-xs text-amber-700 hover:text-amber-900"
            >
              ×
            </button>
          </div>
        </section>
      )}

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
