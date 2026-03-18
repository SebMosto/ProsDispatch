import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { Link, useNavigate } from '../../lib/router';
import LanguageSwitcher from '../../components/LanguageSwitcher';

const SignUpPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [trade, setTrade] = useState<string>('');
  const [tradeOther, setTradeOther] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const otherInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, user]);

  useEffect(() => {
    if (trade === 'other' && otherInputRef.current) {
      otherInputRef.current.focus();
    }
  }, [trade]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const showOtherInput = trade === 'other';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError(t('register.password_mismatch'));
      return;
    }
    setLoading(true);
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ') || undefined;
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          business_name: businessName || undefined,
          trade: trade || undefined,
          trade_other: trade === 'other' ? tradeOther : undefined,
          role: 'contractor',
        },
      },
    });

    if (signUpError) {
      setError(t('register.error'));
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

  const inputBase =
    'h-11 w-full rounded-[10px] border-2 border-[#0F172A] bg-[hsl(220,20%,97%)] px-3.5 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#FF5C1B] focus:outline-none focus:ring-[3px] focus:ring-[rgba(255,92,27,0.15)]';

  return (
    <div
      className="fixed inset-0 z-10 flex min-h-screen flex-col bg-[hsl(220,20%,97%)]"
      role="main"
      aria-label={t('register.title')}
    >
      {/* Public topbar — same as Login */}
      <header
        className="flex h-[52px] items-center justify-between border-b border-[#CBD5E1] px-5"
        style={{ background: 'hsl(220 20% 97%)' }}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] bg-[#0F172A]" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <rect x="9" y="1" width="7" height="4.5" rx="1" transform="rotate(45 9 1)" fill="white" />
              <rect x="2" y="8" width="2" height="8" rx="1" transform="rotate(-45 2 8)" fill="white" />
            </svg>
          </div>
          <span className="h-[17px] w-px shrink-0 bg-[#94A3B8]" aria-hidden />
          <span className="font-bold text-[15px] leading-none tracking-tight text-[#0F172A]">
            Dispatch <span className="text-[#94A3B8]">|</span> Labs
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-[#E2E8F0] py-1.5 pl-2.5 pr-3.5 text-[13px] font-medium hover:bg-[#CBD5E1]">
            <LanguageSwitcher />
          </div>
          <span className="h-[18px] w-px bg-[#CBD5E1]" aria-hidden />
          <Link to="/" className="text-[13px] font-medium text-[#64748B] hover:text-[#0F172A]">
            {t('login.pilot')}
          </Link>
          <Link to="/login" className="text-[13px] font-bold text-[#0F172A] hover:bg-[#E2E8F0] hover:rounded-md px-2 py-1">
            {t('login.navLink')}
          </Link>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-[460px] max-h-[90vh] overflow-y-auto rounded-[14px] border-2 border-[#0F172A] bg-white px-10 pt-10 pb-9 shadow-brutal">
          <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-[#FF5C1B]">
            {t('register.label')}
          </p>
          <h1 className="mt-2 text-[24px] font-bold leading-tight text-[#0F172A]">
            {t('register.title')}
          </h1>
          <p className="mt-1.5 text-[14px] leading-relaxed text-[#64748B]">
            {t('register.subtitle')}
          </p>

          <form className="mt-7" onSubmit={handleSubmit} noValidate>
            <p className="mb-4 text-[11px] text-[#64748B]">
              {t('register.required_note')}
            </p>
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="reg-first" className="block text-[11px] font-bold uppercase tracking-wide text-[#0F172A]">
                  {t('register.first')} <span className="text-[#FF5C1B]">*</span>
                </label>
                <input
                  id="reg-first"
                  type="text"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  maxLength={50}
                  className={`mt-1.5 ${inputBase}`}
                  placeholder="Jean"
                />
              </div>
              <div>
                <label htmlFor="reg-last" className="block text-[11px] font-bold uppercase tracking-wide text-[#0F172A]">
                  {t('register.last')} <span className="text-[#FF5C1B]">*</span>
                </label>
                <input
                  id="reg-last"
                  type="text"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  maxLength={50}
                  className={`mt-1.5 ${inputBase}`}
                  placeholder="Tremblay"
                />
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor="reg-biz" className="block text-[11px] font-bold uppercase tracking-wide text-[#0F172A]">
                {t('register.biz')}
              </label>
              <input
                id="reg-biz"
                type="text"
                autoComplete="organization"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                maxLength={100}
                className={`mt-1.5 ${inputBase}`}
                placeholder="Tremblay Plomberie Inc."
              />
            </div>
            <div className="mt-4">
              <label htmlFor="reg-trade" className="block text-[11px] font-bold uppercase tracking-wide text-[#0F172A]">
                {t('register.trade')} <span className="text-[#FF5C1B]">*</span>
              </label>
              <div className="relative mt-1.5">
                <select
                  id="reg-trade"
                  required
                  value={trade}
                  onChange={(e) => setTrade(e.target.value)}
                  className={`${inputBase} appearance-none pr-10 cursor-pointer`}
                >
                  <option value="">{t('register.trade_placeholder')}</option>
                  <option value="plumbing">{t('register.trade_plumbing')}</option>
                  <option value="hvac">{t('register.trade_hvac')}</option>
                  <option value="electrical">{t('register.trade_electrical')}</option>
                  <option value="general">{t('register.trade_general')}</option>
                  <option value="roofing">{t('register.trade_roofing')}</option>
                  <option value="other">{t('register.trade_other')}</option>
                </select>
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-[#0F172A]" aria-hidden />
              </div>
              <div
                className={`overflow-hidden transition-all duration-200 ease-out ${
                  showOtherInput ? 'mt-2.5 max-h-[60px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <input
                  ref={otherInputRef}
                  type="text"
                  value={tradeOther}
                  onChange={(e) => setTradeOther(e.target.value)}
                  maxLength={80}
                  className={`${inputBase} border-[#FF5C1B] focus:ring-[rgba(255,92,27,0.25)]`}
                  placeholder={t('register.ph_other')}
                />
              </div>
            </div>
            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-[#E2E8F0]" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                {t('register.div_account')}
              </span>
              <span className="h-px flex-1 bg-[#E2E8F0]" aria-hidden />
            </div>
            <div>
              <label htmlFor="reg-email" className="block text-[11px] font-bold uppercase tracking-wide text-[#0F172A]">
                {t('register.email')} <span className="text-[#FF5C1B]">*</span>
              </label>
              <input
                id="reg-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={254}
                className={`mt-1.5 ${inputBase}`}
                placeholder="you@example.com"
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="reg-password" className="block text-[11px] font-bold uppercase tracking-wide text-[#0F172A]">
                  {t('register.password')} <span className="text-[#FF5C1B]">*</span>
                </label>
                <input
                  id="reg-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={128}
                  className={`mt-1.5 ${inputBase}`}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label htmlFor="reg-confirm" className="block text-[11px] font-bold uppercase tracking-wide text-[#0F172A]">
                  {t('register.confirm')} <span className="text-[#FF5C1B]">*</span>
                </label>
                <input
                  id="reg-confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  maxLength={128}
                  className={`mt-1.5 ${inputBase}`}
                  placeholder="••••••••"
                />
              </div>
            </div>
            {error ? (
              <p className="mt-3 text-[13px] font-medium text-[#EF4444]" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-[10px] border-2 border-[#0F172A] bg-[#FF5C1B] text-[15px] font-bold text-[#1F1308] shadow-[3px_3px_0_0_rgba(15,23,42,0.9)] hover:shadow-[5px_5px_0_0_rgba(15,23,42,0.9)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[1px_1px_0_0_rgba(15,23,42,0.9)] active:translate-x-px active:translate-y-px disabled:opacity-70"
            >
              {loading ? t('auth.shared.loading') : t('register.cta')}
            </button>
          </form>
          <p className="mt-4 text-center text-[11px] leading-relaxed text-[#94A3B8]">
            {t('register.terms')}
            <a href="/terms" className="text-[#64748B] underline hover:text-[#0F172A]">{t('register.terms_tos')}</a>
            {t('register.terms_and')}
            <a href="/privacy" className="text-[#64748B] underline hover:text-[#0F172A]">{t('register.terms_pp')}</a>.
          </p>
          <p className="mt-4 text-center text-[13px] text-[#64748B]">
            {t('register.signin_pre')}
            <Link to="/login" className="font-bold text-[#FF5C1B] hover:underline">
              {t('register.signin')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
