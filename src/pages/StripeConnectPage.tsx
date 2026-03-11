import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { PageLoader } from '../components/ui/PageLoader';
import { profileRepository } from '../repositories/profileRepository';

type StripeProfileFields = {
  stripe_connect_id?: string | null;
  stripe_connect_onboarded?: boolean | null;
};

const StripeConnectPage = () => {
  const { t } = useTranslation();
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [profileState, setProfileState] = useState<StripeProfileFields | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error: repoError } = await profileRepository.get(user.id as string);
      if (repoError) {
        console.error('Error loading profile for Stripe Connect', repoError);
        setError(t('settings.stripe.error'));
      } else if (data) {
        const fullProfile = data as StripeProfileFields;
        setProfileState({
          stripe_connect_id: fullProfile.stripe_connect_id ?? null,
          stripe_connect_onboarded: fullProfile.stripe_connect_onboarded ?? false,
        });
      }
      setLoading(false);
    };

    fetchProfile();
  }, [t, user]);

  const handleConnect = async () => {
    setCreating(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-connect-onboarding', {
        body: {
          returnUrl: window.location.origin + '/settings/stripe',
        },
      });

      if (fnError || !data?.url) {
        console.error('create-connect-onboarding error', fnError ?? data?.error);
        setError(t('settings.stripe.error'));
        setCreating(false);
        return;
      }

      window.location.href = data.url as string;
    } catch (err) {
      console.error('Stripe connect onboarding error', err);
      setError(t('settings.stripe.error'));
      setCreating(false);
    }
  };

  const handleRefreshStatus = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error: repoError } = await profileRepository.get(user.id as string);
    if (repoError) {
      console.error('Error refreshing Stripe profile', repoError);
      setError(t('settings.stripe.error'));
    } else if (data) {
      const fullProfile = data as StripeProfileFields;
      setProfileState({
        stripe_connect_id: fullProfile.stripe_connect_id ?? null,
        stripe_connect_onboarded: fullProfile.stripe_connect_onboarded ?? false,
      });
      await refreshProfile();
    }
    setLoading(false);
  };

  if (loading) {
    return <PageLoader />;
  }

  const isConnected = Boolean(profileState?.stripe_connect_onboarded);
  const hasAccountId = Boolean(profileState?.stripe_connect_id);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">{t('settings.stripe.title')}</h1>
        <p className="text-sm text-slate-600">{t('settings.stripe.subtitle')}</p>
      </header>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {isConnected ? (
          <div className="space-y-2">
            <p className="text-sm text-emerald-700">{t('settings.stripe.connected')}</p>
            <a
              href="https://dashboard.stripe.com/connect/accounts"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              {t('settings.stripe.managePayouts')}
            </a>
          </div>
        ) : hasAccountId ? (
          <div className="space-y-3">
            <p className="text-sm text-amber-700">{t('settings.stripe.incomplete')}</p>
            <button
              type="button"
              onClick={handleConnect}
              disabled={creating}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? t('common.processing') : t('settings.stripe.retry')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">{t('settings.stripe.cta')}</p>
            <button
              type="button"
              onClick={handleConnect}
              disabled={creating}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? t('common.processing') : t('settings.stripe.connect')}
            </button>
          </div>
        )}

        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleRefreshStatus}
          className="text-xs font-medium text-slate-600 underline underline-offset-2"
        >
          {t('settings.stripe.refresh')}
        </button>
      </section>
    </main>
  );
};

export default StripeConnectPage;

