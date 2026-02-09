import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Briefcase, LogOut, Globe, CreditCard, Save, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getProfileSchema, ProfileSchema } from '@/schemas/mvp1/profile';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { PageLoader } from '@/components/ui/PageLoader';

const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const { user, profile, signOut, refreshProfile, loading: authLoading } = useAuth();
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false);

  const form = useForm<ProfileSchema>({
    resolver: zodResolver(getProfileSchema(t)),
    defaultValues: {
      full_name: '',
      business_name: '',
    },
  });

  const { formState: { errors }, clearErrors, trigger } = form;

  // Re-validate when language changes to update error messages
  useEffect(() => {
    const hasErrors = Object.keys(errors).length > 0;
    if (hasErrors) {
      clearErrors();
      trigger().catch(() => {
        // Validation errors are expected and will be shown in the UI
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- errors is intentionally omitted to prevent re-validation loops
  }, [i18n.language, clearErrors, trigger]);

  // Reset form when profile loads
  useEffect(() => {
    if (profile) {
      form.reset({
        full_name: profile.full_name || '',
        business_name: profile.business_name || '',
      });
    }
  }, [profile, form]);

  const onSubmit = async (data: ProfileSchema) => {
    if (!user) return;
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          business_name: data.business_name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      
      // Refresh the profile in the auth context
      await refreshProfile();
      setUpdateSuccess(true);
    } catch (error) {
      console.error('Error updating profile:', error);
      setUpdateError(t('common.error.generic'));
    }
  };

  if (authLoading) {
    return <PageLoader />;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('settings.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('settings.subtitle')}</p>
        </div>

        {/* Profile Section */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center text-lg font-medium text-gray-900">
            <User className="mr-2 h-5 w-5 text-gray-400" />
            {t('settings.profile.title')}
          </h2>

          <form className="mt-6 space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium leading-6 text-gray-900">
                {t('profile.field.full_name')}
              </label>
              <div className="relative mt-2 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  {...form.register('full_name')}
                  type="text"
                  id="full_name"
                  className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
              {form.formState.errors.full_name && (
                <p className="mt-2 text-sm text-red-600">{form.formState.errors.full_name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="business_name" className="block text-sm font-medium leading-6 text-gray-900">
                {t('profile.field.business_name')}
              </label>
              <div className="relative mt-2 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Briefcase className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  {...form.register('business_name')}
                  type="text"
                  id="business_name"
                  className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
              {form.formState.errors.business_name && (
                <p className="mt-2 text-sm text-red-600">{form.formState.errors.business_name.message}</p>
              )}
            </div>

            {updateError && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{updateError}</h3>
                  </div>
                </div>
              </div>
            )}

            {updateSuccess && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">{t('common.success')}</h3>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
              >
                {form.formState.isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {t('common.save')}
              </button>
            </div>
          </form>
        </div>

        {/* Language Section */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center text-lg font-medium text-gray-900 mb-4">
            <Globe className="mr-2 h-5 w-5 text-gray-400" />
            {t('settings.language.title')}
          </h2>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{t('settings.language.description')}</span>
            <LanguageSwitcher />
          </div>
        </div>

        {/* Stripe Section (Read-only) */}
        {profile?.stripe_account_id && (
           <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
             <h2 className="flex items-center text-lg font-medium text-gray-900 mb-4">
               <CreditCard className="mr-2 h-5 w-5 text-gray-400" />
               {t('settings.stripe.title')}
             </h2>
             <div className="text-sm text-gray-500">
               <p>{t('settings.stripe.accountId')} <span className="font-mono">{profile.stripe_account_id}</span></p>
               {profile.stripe_customer_id && <p>{t('settings.stripe.customerId')} <span className="font-mono">{profile.stripe_customer_id}</span></p>}
             </div>
           </div>
        )}

        {/* Sign Out Section */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center text-lg font-medium text-gray-900 mb-4">
            <LogOut className="mr-2 h-5 w-5 text-gray-400" />
            {t('settings.session.title')}
          </h2>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{t('settings.session.description')}</span>
            <button
              onClick={() => signOut()}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50"
            >
              {t('auth.dashboard.signOut')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
