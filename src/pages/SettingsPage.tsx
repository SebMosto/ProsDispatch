import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { getProfileSchema, ProfileFormValues } from '../schemas/profile';
import { PageLoader } from '../components/ui/PageLoader';

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
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(getProfileSchema(t)),
    defaultValues: {
      full_name: '',
      business_name: '',
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, business_name')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          reset({
            full_name: data.full_name || '',
            business_name: data.business_name || '',
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setMessage({ type: 'error', text: t('settings.profile.error') });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, reset, t]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name || null,
          business_name: data.business_name || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Refresh the profile in AuthContext so other pages see the updated data
      await refreshProfile();

      setMessage({ type: 'success', text: t('settings.profile.success') });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: t('settings.profile.error') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('settings.title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('settings.subtitle')}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
          <h2 className="text-base font-semibold leading-6 text-slate-900">
            {t('settings.profile.title')}
          </h2>
        </div>

        <div className="px-4 py-6 sm:px-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {message && (
              <div
                className={`rounded-md p-4 ${
                  message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium leading-6 text-slate-900"
                >
                  {t('settings.profile.email')}
                </label>
                <div className="mt-2">
                  <input
                    type="email"
                    id="email"
                    disabled
                    value={user?.email || ''}
                    className="block w-full rounded-md border-0 bg-slate-50 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div className="sm:col-span-4">
                <label
                  htmlFor="full_name"
                  className="block text-sm font-medium leading-6 text-slate-900"
                >
                  {t('settings.profile.fullName')}
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    id="full_name"
                    {...register('full_name')}
                    className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-slate-600 sm:text-sm sm:leading-6"
                  />
                  {errors.full_name && (
                    <p className="mt-2 text-sm text-red-600">{errors.full_name.message}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-4">
                <label
                  htmlFor="business_name"
                  className="block text-sm font-medium leading-6 text-slate-900"
                >
                  {t('settings.profile.businessName')}
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    id="business_name"
                    {...register('business_name')}
                    className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-slate-600 sm:text-sm sm:leading-6"
                  />
                  {errors.business_name && (
                    <p className="mt-2 text-sm text-red-600">{errors.business_name.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-x-6 border-t border-slate-900/10 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? t('settings.profile.saving') : t('settings.profile.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
