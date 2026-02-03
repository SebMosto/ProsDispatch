import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { Link, useLocation, useNavigate } from '../../lib/router';

const SignInPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const redirectPath = (location.state as { from?: { pathname: string } } | undefined)?.from?.pathname;
    navigate(redirectPath || '/dashboard', { replace: true });
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-1 flex-col justify-center">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">{t('auth.signIn.title')}</h1>
          <p className="mt-2 text-sm text-slate-600">{t('auth.signIn.subtitle')}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
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
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              placeholder={t('auth.signIn.emailPlaceholder')}
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              placeholder={t('auth.signIn.passwordPlaceholder')}
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
            {loading ? t('auth.shared.loading') : t('auth.signIn.button')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-700">
          {t('auth.signIn.noAccount')}{' '}
          <Link className="font-semibold text-slate-900 underline" to="/register">
            {t('auth.signUp.title')}
          </Link>
        </p>
      </div>
    </main>
  );
};

export default SignInPage;
