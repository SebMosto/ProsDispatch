import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../lib/auth';
import { getProfileUpdateSchema, ProfileUpdateInput } from '../schemas/profile';
import { PageLoader } from '../components/ui/PageLoader';
import { profileRepository } from '../repositories/profileRepository';

const SettingsPage = () => {
  const { t } = useTranslation();
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(getProfileUpdateSchema(t)),
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await profileRepository.get(user.id);

      if (error) {
        console.error('Error fetching profile:', error);
        setMessage({ type: 'error', text: t('settings.error') });
      } else if (data) {
        reset({
          full_name: data.full_name,
          business_name: data.business_name,
        });
      }

      setLoading(false);
    };

    fetchProfile();
  }, [user, reset, t]);

  const onSubmit = async (data: ProfileUpdateInput) => {
    if (!user) return;
    setSaving(true);
    setMessage(null);

    const { error } = await profileRepository.update(user.id, data);

    if (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: t('settings.error') });
    } else {
      // Refresh the profile in AuthContext so other pages get updated data
      await refreshProfile();
      setMessage({ type: 'success', text: t('settings.success') });
    }

    setSaving(false);
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">{t('settings.title')}</h1>
        <p className="mt-2 text-sm text-slate-600">{t('settings.subtitle')}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-slate-900">{t('settings.profile.title')}</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 px-4 py-4 sm:px-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium text-slate-800">
                {t('settings.profile.email')}
              </label>
              <input
                id="email"
                type="email"
                readOnly
                disabled
                value={user?.email || ''}
                className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 shadow-sm focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="full_name" className="block text-sm font-medium text-slate-800">
                {t('settings.profile.fullName')}
              </label>
              <input
                id="full_name"
                type="text"
                {...register('full_name')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
              {errors.full_name && (
                <p className="text-sm text-red-600">{errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="business_name" className="block text-sm font-medium text-slate-800">
                {t('settings.profile.businessName')}
              </label>
              <input
                id="business_name"
                type="text"
                {...register('business_name')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
              {errors.business_name && (
                <p className="text-sm text-red-600">{errors.business_name.message}</p>
              )}
            </div>
          </div>

          {message && (
            <div
              className={`rounded-md p-3 text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? t('settings.profile.saving') : t('settings.profile.save')}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default SettingsPage;
