import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | string | null;

const SubscribePage = () => {
  const { t } = useTranslation();
  const { subscriptionStatus, trialDaysRemaining } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const state: 'none' | 'past_due' | 'trialing' = useMemo(() => {
    if (subscriptionStatus === 'past_due') return 'past_due';
    if (subscriptionStatus === 'trialing') return 'trialing';
    return 'none';
  }, [subscriptionStatus]);

  const startOrActivateSubscription = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          returnUrl: window.location.origin + '/dashboard',
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        window.location.href = data.url as string;
      } else {
        setError(t('errors.checkoutNoUrl'));
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t('errors.unexpected'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const openBillingPortal = useCallback(async () => {
    setPortalLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('create-billing-portal-session', {
        body: {
          returnUrl: window.location.origin + '/settings/billing',
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        window.location.href = data.url as string;
      } else {
        setError(t('errors.checkoutNoUrl'));
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t('errors.unexpected'));
      }
    } finally {
      setPortalLoading(false);
    }
  }, [t]);

  const renderContent = () => {
    if (state === 'past_due') {
      return (
        <>
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {t('subscribe.pastDue.message')}
          </div>
          <button
            type="button"
            onClick={openBillingPortal}
            disabled={portalLoading}
            className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {t('subscribe.pastDue.cta')}
          </button>
        </>
      );
    }

    if (state === 'trialing') {
      return (
        <>
          <p className="mb-2 text-sm text-slate-700">
            {t('subscribe.trialing.message', { days: trialDaysRemaining })}
          </p>
          <button
            type="button"
            onClick={startOrActivateSubscription}
            disabled={isLoading}
            className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {t('subscribe.trialing.cta')}
          </button>
          <p className="mt-3 text-xs text-slate-500">
            {t('subscribe.trialing.support')}
          </p>
        </>
      );
    }

    return (
      <>
        <ul className="mb-4 space-y-2 text-sm text-slate-700">
          <li>• {t('subscribe.feature1')}</li>
          <li>• {t('subscribe.feature2')}</li>
          <li>• {t('subscribe.feature3')}</li>
        </ul>
        <button
          type="button"
          onClick={startOrActivateSubscription}
          disabled={isLoading}
          className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {t('subscribe.cta')}
        </button>
      </>
    );
  };

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
      <header className="text-center">
        <h1 className="text-2xl font-semibold text-slate-900">{t('subscribe.title')}</h1>
        <p className="mt-2 text-sm text-slate-600">{t('subscribe.subtitle')}</p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        {error && (
          <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {renderContent()}
      </section>
    </main>
  );
};

export default SubscribePage;

