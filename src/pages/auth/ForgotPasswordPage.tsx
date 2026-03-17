import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { Link } from '../../lib/router';
import LanguageSwitcher from '../../components/LanguageSwitcher';

const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/settings`,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSuccess(true);
  };

  const inputClass =
    'mt-1 h-11 w-full rounded-[10px] border-2 border-[#0F172A] bg-[hsl(220,20%,97%)] px-3.5 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#FF5C1B] focus:outline-none focus:ring-[3px] focus:ring-[rgba(255,92,27,0.15)]';

  return (
    <div
      className="fixed inset-0 z-10 flex min-h-screen flex-col bg-[hsl(220,20%,97%)]"
      role="main"
      aria-label={t('forgot.title')}
    >
      {/* Public topbar — same as Login */}
      <header
        className="flex h-[52px] items-center justify-between border-b border-[#CBD5E1] px-5"
        style={{ background: 'hsl(220 20% 97%)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] bg-[#0F172A]"
            aria-hidden
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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
          <div className="flex items-center gap-1.5 rounded-full bg-[#E2E8F0] py-1.5 pl-2.5 pr-3.5 text-[13px] font-medium">
            <LanguageSwitcher />
          </div>
          <Link to="/" className="text-[13px] text-[#64748B] hover:text-[#FF5C1B]">
            {t('login.pilot')}
          </Link>
          <Link to="/login" className="font-bold text-[13px] text-[#0F172A] hover:text-[#FF5C1B]">
            {t('login.navLink')}
          </Link>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px] overflow-hidden rounded-[14px] border-2 border-[#0F172A] bg-white p-10 shadow-brutal">
          {!success ? (
            <>
              <Link
                to="/login"
                className="mb-6 flex items-center gap-1.5 text-[12px] font-semibold text-[#64748B] hover:text-[#0F172A]"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11L5 7l4-4" />
                </svg>
                {t('forgot.back')}
              </Link>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[10px] border-2 border-[#0F172A] bg-[hsl(220,20%,97%)]">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="16" height="9" rx="2" />
                  <path d="M7 11V7a4 4 0 0 1 8 0v4" />
                </svg>
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-[#FF5C1B]">
                {t('forgot.label')}
              </p>
              <h1 className="mt-2 text-[24px] font-bold leading-tight text-[#0F172A]">
                {t('forgot.title')}
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-[#64748B]">
                {t('forgot.subtitle')}
              </p>
              <form className="mt-6" onSubmit={handleSubmit} noValidate>
                <label htmlFor="forgot-email" className="block text-[11px] font-bold uppercase tracking-wide text-[#0F172A]">
                  {t('forgot.email')}
                </label>
                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={254}
                  className={inputClass}
                  placeholder="you@example.com"
                />
                {error ? (
                  <p className="mt-2 text-[13px] font-medium text-[#EF4444]" role="alert">
                    {error}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 flex h-12 w-full items-center justify-center rounded-[10px] border-2 border-[#0F172A] bg-[#FF5C1B] px-4 text-[15px] font-bold text-[#1F1308] shadow-[3px_3px_0_0_rgba(15,23,42,0.9)] hover:shadow-[5px_5px_0_0_rgba(15,23,42,0.9)] hover:translate-x-[-1px] hover:translate-y-[-1px] disabled:opacity-70"
                >
                  {loading ? t('auth.shared.loading') : t('forgot.cta')}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-[#16A34A] bg-[#F0FDF4] shadow-[3px_3px_0_0_rgba(22,101,52,0.9)]">
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 13l7 7L23 6" />
                </svg>
              </div>
              <h2 className="text-[22px] font-bold text-[#0F172A]">
                {t('forgot.success_title')}
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[#64748B]">
                {t('forgot.success_body', { email: email || 'you@example.com' })}
              </p>
              <Link
                to="/login"
                className="mt-6 flex h-12 w-full items-center justify-center rounded-[10px] border-2 border-[#0F172A] bg-transparent text-[15px] font-bold text-[#0F172A] shadow-[3px_3px_0_0_rgba(15,23,42,0.9)] hover:bg-[#F1F5F9]"
              >
                {t('forgot.back_cta')}
              </Link>
              <p className="mt-4 text-center text-[12px] text-[#94A3B8]">
                {t('forgot.resend_pre')}
                <button
                  type="button"
                  className="font-semibold text-[#FF5C1B] hover:underline"
                  onClick={() => setSuccess(false)}
                >
                  {t('forgot.resend')}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
