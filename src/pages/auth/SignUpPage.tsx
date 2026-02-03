import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { Link, useNavigate } from '../../lib/router';

const SignUpPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          business_name: businessName,
          role: 'contractor',
        },
      },
    });

    if (signUpError) {
      console.error('Sign up error:', signUpError);
      setError(t('auth.signUp.error'));
      setLoading(false);
      return;
    }

    const userId = data.user?.id ?? data.session?.user?.id;
    if (userId) {
      await supabase
        .from('profiles')
        .update({
          full_name: fullName || null,
          business_name: businessName || null,
          email,
        })
        .eq('id', userId);
    }

    navigate('/dashboard', { replace: true });
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-1 flex-col justify-center">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">{t('auth.signUp.title')}</h1>
          <p className="mt-2 text-sm text-slate-600">{t('auth.signUp.subtitle')}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-800" htmlFor="fullName">
              {t('auth.signUp.fullName')}
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              maxLength={100} // Security: Limit input length to prevent DoS
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              placeholder={t('auth.signUp.fullNamePlaceholder')}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-800" htmlFor="businessName">
              {t('auth.signUp.businessName')}
            </label>
            <input
              id="businessName"
              name="businessName"
              type="text"
              autoComplete="organization"
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              maxLength={100} // Security: Limit input length to prevent DoS
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              placeholder={t('auth.signUp.businessNamePlaceholder')}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-800" htmlFor="email">
              {t('auth.shared.email')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              maxLength={254} // Security: Limit input length to prevent DoS
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              placeholder={t('auth.signUp.emailPlaceholder')}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-800" htmlFor="password">
              {t('auth.shared.password')}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              maxLength={128} // Security: Limit input length to prevent DoS
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              placeholder={t('auth.signUp.passwordPlaceholder')}
            />
          </div>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            className="flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loading}
          >
            {loading ? t('auth.shared.loading') : t('auth.signUp.button')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-700">
          {t('auth.signUp.haveAccount')}{' '}
          <Link className="font-semibold text-slate-900 underline" to="/login">
            {t('auth.signIn.title')}
          </Link>
        </p>
      </div>
    </main>
  );
};

export default SignUpPage;
