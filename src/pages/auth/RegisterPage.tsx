import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, User, Briefcase, Loader2, AlertCircle } from 'lucide-react';
import { getRegisterSchema, RegisterSchema } from '@/schemas/auth';
import { useAuthActions } from '@/hooks/useAuth';

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signUp } = useAuthActions();
  const [authError, setAuthError] = useState<string | null>(null);

  const form = useForm<RegisterSchema>({
    resolver: zodResolver(getRegisterSchema(t)),
    defaultValues: {
      email: '',
      password: '',
      full_name: '',
      business_name: '',
    },
  });

  const onSubmit = async (data: RegisterSchema) => {
    setAuthError(null);
    try {
      await signUp(data);
      navigate('/'); // Or to a "Check your email" page
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setAuthError(message || t('auth.error.generic'));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            {t('auth.register.title')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('auth.register.subtitle')}{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              {t('auth.login.link')}
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="full_name" className="sr-only">
                {t('auth.field.full_name')}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  {...form.register('full_name')}
                  id="full_name"
                  type="text"
                  autoComplete="name"
                  className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder={t('auth.field.full_name')}
                />
              </div>
              {form.formState.errors.full_name && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.full_name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="business_name" className="sr-only">
                {t('auth.field.business_name')}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Briefcase className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  {...form.register('business_name')}
                  id="business_name"
                  type="text"
                  autoComplete="organization"
                  className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder={t('auth.field.business_name')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="sr-only">
                {t('auth.field.email')}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  {...form.register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder={t('auth.field.email')}
                />
              </div>
              {form.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                {t('auth.field.password')}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  {...form.register('password')}
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder={t('auth.field.password')}
                />
              </div>
              {form.formState.errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
          </div>

          {authError && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{authError}</h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70"
            >
              {form.formState.isSubmitting ? (
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </span>
              ) : (
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <User
                    className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400"
                    aria-hidden="true"
                  />
                </span>
              )}
              {form.formState.isSubmitting ? t('common.loading') : t('auth.register.button')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
