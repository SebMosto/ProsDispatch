import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

const statusClasses: Record<string, string> = {
  trialing: 'bg-amber-50 text-amber-800 ring-amber-200',
  active: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  past_due: 'bg-red-50 text-red-800 ring-red-200',
  canceled: 'bg-slate-50 text-slate-700 ring-slate-200',
};

const BillingSettingsPage = () => {
  const { t } = useTranslation();
  const { subscriptionStatus, trialDaysRemaining, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openBillingPortal = useCallback(async () => {
    setLoading(true);
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
      setLoading(false);
    }
  }, [t]);

  const statusKey = (subscriptionStatus ?? 'canceled') as 'trialing' | 'active' | 'past_due' | 'canceled';
  const badgeClass =
    statusClasses[statusKey] ?? 'bg-slate-50 text-slate-700 ring-slate-200';

  const endDate = profile?.subscription_end_date
    ? new Date(profile.subscription_end_date)
    : null;

  const formattedDate =
    endDate && !Number.isNaN(endDate.getTime())
      ? endDate.toLocaleDateString()
      : null;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">{t('billing.title')}</h1>
      </div>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-800">
              {t(`billing.status.${statusKey}`)}
            </p>
            {formattedDate && (
              <p className="mt-1 text-xs text-slate-600">
                {statusKey === 'trialing'
                  ? t('billing.trialEnds', { date: formattedDate })
                  : t('billing.nextBilling', { date: formattedDate })}
              </p>
            )}
          </div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ${badgeClass}`}
          >
            {t(`billing.status.${statusKey}`)}
          </span>
        </div>

        {statusKey === 'past_due' && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {t('subscribe.pastDue.message')}
          </div>
        )}

        {statusKey === 'trialing' && trialDaysRemaining > 0 && (
          <p className="text-xs text-slate-600">
            {t('subscribe.trialing.message', { days: trialDaysRemaining })}
          </p>
        )}

        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={openBillingPortal}
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          >
            {statusKey === 'past_due'
              ? t('billing.updatePayment')
              : t('billing.manage')}
          </button>
        </div>

        {error && (
          <div className="mt-2 rounded-md bg-red-50 p-2 text-sm text-red-700">
            {error}
          </div>
        )}
      </section>
    </main>
  );
};

export default BillingSettingsPage;

