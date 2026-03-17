import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { Link, useLocation, useNavigate } from '../../lib/router';
import LanguageSwitcher from '../../components/LanguageSwitcher';

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
      setError(t('login.error'));
      setLoading(false);
      return;
    }

    const redirectPath = (location.state as { from?: { pathname: string } } | undefined)?.from?.pathname;
    navigate(redirectPath || '/dashboard', { replace: true });
  };

  return (
    <div
      className="fixed inset-0 z-10 flex min-h-screen flex-col bg-[hsl(220,20%,97%)]"
      role="main"
      aria-label={t('login.title')}
    >
      {/* Public topbar — DESIGN_SYSTEM §3.8 public variant */}
      <header
        className="flex h-[52px] items-center justify-between border-b border-[#CBD5E1] px-5 md:px-5"
        style={{ background: 'hsl(220 20% 97%)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] bg-[#0F172A]"
            aria-hidden
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
          <span className="h-[15px] w-px shrink-0 bg-[#94A3B8]" aria-hidden />
          <span className="font-bold text-[14px] leading-none text-[#0F172A]">
            Dispatch <span className="text-[#94A3B8]">|</span> Labs
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-[#E2E8F0] py-1.5 pl-2.5 pr-3.5 text-[13px] font-medium hover:bg-[#CBD5E1]">
            <LanguageSwitcher />
          </div>
          <button
            type="button"
            className="flex h-[34px] w-[34px] items-center justify-center rounded-lg text-[#64748B] hover:bg-[#E2E8F0]"
            aria-label={t('login.darkMode')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </button>
          <span className="h-4 w-px shrink-0 bg-[#CBD5E1]" aria-hidden />
          <Link
            to="/"
            className="text-[13px] text-[#64748B] hover:text-[#FF5C1B]"
          >
            {t('login.pilot')}
          </Link>
          <Link to="/login" className="font-bold text-[13px] text-[#0F172A] hover:text-[#FF5C1B]">
            {t('login.navLink')}
          </Link>
        </div>
      </header>

      {/* Centered card — SCREEN_SPECS §1 Login */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px] overflow-hidden rounded-[14px] border-2 border-[#0F172A] bg-white p-10 shadow-brutal">
          <p
            className="text-[11px] font-bold uppercase tracking-[1.2px] text-[#FF5C1B]"
            aria-hidden
          >
            {t('login.label')}
          </p>
          <h1 className="mt-2 text-[24px] font-bold leading-tight text-[#0F172A]">
            {t('login.title')}
          </h1>
          <p className="mt-1 text-[14px] text-[#64748B]">
            {t('login.subtitle')}
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="login-email" className="block text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">
                {t('login.email')}
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={254}
                className="mt-1 h-11 w-full rounded-[7px] border-2 border-[#0F172A] bg-[hsl(220,20%,97%)] px-3.5 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#FF5C1B] focus:outline-none focus:ring-[3px] focus:ring-[rgba(255,92,27,0.15)]"
                placeholder={t('login.email')}
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">
                {t('login.password')}
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={128}
                className="mt-1 h-11 w-full rounded-[7px] border-2 border-[#0F172A] bg-[hsl(220,20%,97%)] px-3.5 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#FF5C1B] focus:outline-none focus:ring-[3px] focus:ring-[rgba(255,92,27,0.15)]"
                placeholder={t('login.password')}
              />
            </div>
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-[12px] text-[#64748B] hover:text-[#FF5C1B]"
              >
                {t('login.forgot')}
              </Link>
            </div>
            {error ? (
              <div
                className="rounded-lg border-2 border-[#EF4444] bg-[#FEF2F2] px-3 py-2 text-[13px] font-medium text-[#EF4444]"
                role="alert"
              >
                {error}
              </div>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-[7px] border-2 border-[#0F172A] bg-[#FF5C1B] px-4 text-[13px] font-bold text-[#1F1308] shadow-[2px_2px_0_0_rgba(15,23,42,0.9)] transition-[box-shadow,transform] hover:shadow-[4px_4px_0_0_rgba(15,23,42,0.9)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[1px_1px_0_0_rgba(15,23,42,0.9)] active:translate-x-px active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? t('auth.shared.loading') : t('login.cta')}
            </button>
          </form>

          <p className="mt-6 text-center text-[12px] text-[#64748B]">
            {t('login.divider')}
          </p>
          <p className="mt-2 text-center">
            <Link
              to="/register"
              className="font-bold text-[#FF5C1B] hover:underline"
            >
              {t('login.register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
