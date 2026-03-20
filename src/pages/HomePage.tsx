import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const HomePage = () => {
  const { t, i18n } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const pilotSectionRef = useRef<HTMLElement | null>(null);

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  const featureKeys = ['jobs', 'clients', 'billing', 'stripe'] as const;
  const pricingFeatureKeys = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'] as const;
  const pilotBulletKeys = ['b1', 'b2', 'b3'] as const;

  const toggleLanguage = async () => {
    const next = i18n.language.startsWith('fr') ? 'en' : 'fr';
    await i18n.changeLanguage(next);
  };

  const goToPilot = () => {
    pilotSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cardClass = isDarkMode
    ? 'rounded-[10px] border-2 border-slate-700 bg-slate-900 text-slate-100 shadow-[3px_3px_0_0_rgba(51,65,85,0.8)]'
    : 'rounded-[10px] border-2 border-[#0F172A] bg-white text-[#0F172A] shadow-[3px_3px_0_0_rgba(15,23,42,0.9)]';

  const pageClass = isDarkMode ? 'bg-[#0B1120] text-slate-100' : 'bg-[hsl(220_20%_97%)] text-[#0F172A]';
  const subtleTextClass = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const headingClass = isDarkMode ? 'text-slate-100' : 'text-[#0F172A]';

  return (
    <main className={`min-h-screen font-sans transition-colors duration-200 ${pageClass}`}>
      <nav
        className={`flex h-14 items-center justify-between border-b px-4 md:px-8 ${isDarkMode ? 'border-slate-800' : 'border-slate-300'}`}
      >
        <div className="flex items-center gap-[9px]">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-[8px] ${isDarkMode ? 'bg-slate-100' : 'bg-[#0F172A]'}`}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <rect
                x="9"
                y="1"
                width="7"
                height="4.5"
                rx="1"
                transform="rotate(45 9 1)"
                fill={isDarkMode ? '#0F172A' : 'white'}
              />
              <rect
                x="2"
                y="8"
                width="2"
                height="8"
                rx="1"
                transform="rotate(-45 2 8)"
                fill={isDarkMode ? '#0F172A' : 'white'}
              />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[15px] font-bold ${headingClass}`}>{t('home.topbar.logoMain')}</span>
            <span className="h-4 w-px bg-slate-400" />
            <span className={`text-[15px] font-bold ${headingClass}`}>{t('home.topbar.logoSub')}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <button
            type="button"
            onClick={toggleLanguage}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-medium ${isDarkMode ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-slate-200 text-[#0F172A] hover:bg-slate-300'}`}
            aria-label={t('home.topbar.languageAria')}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M2 4h8M6 2v2M3 4c0 3 2 5 4 6M7 4c-.5 2-2 4-4 5.5" />
              <path d="M9 9l2-5 2 5M9.7 7.5h2.6" />
            </svg>
            <span>{t('home.topbar.languageToggle')}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsDarkMode((prev) => !prev)}
            className={`flex h-[34px] w-[34px] items-center justify-center rounded-[8px] ${isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-200'}`}
            aria-label={t('home.topbar.darkModeAria')}
          >
            {isDarkMode ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                <circle cx="8" cy="8" r="3" />
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M3.2 12.8l1.4-1.4M11.4 4.6l1.4-1.4" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                <path d="M14 10.5A6.5 6.5 0 0 1 5.5 2a6.5 6.5 0 1 0 8.5 8.5z" />
              </svg>
            )}
          </button>
          <div className={`mx-1 h-[18px] w-px ${isDarkMode ? 'bg-slate-800' : 'bg-slate-300'}`} />
          <button type="button" onClick={goToPilot} className={`rounded-md px-2 py-1 text-[13px] font-medium ${subtleTextClass}`}>
            {t('home.topbar.pilot')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="rounded-[7px] border-2 border-[#0F172A] bg-[#FF5C1B] px-3 py-1.5 text-[13px] font-bold text-[#1F1308] shadow-[2px_2px_0_0_rgba(15,23,42,0.9)] transition hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_0_rgba(15,23,42,0.9)]"
          >
            {t('home.topbar.login')}
          </button>
        </div>
      </nav>

      <section className="mx-auto grid w-full max-w-[960px] grid-cols-1 gap-10 px-4 pb-12 pt-14 md:grid-cols-2 md:px-8">
        <div className="flex flex-col gap-5">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#FF5C1B] bg-[#FFF1EC] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.4px] text-[#FF5C1B]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF5C1B]" />
            {t('home.hero.badge')}
          </div>
          <h1 className={`text-[36px] font-bold leading-[1.15] tracking-[-0.8px] md:text-[40px] ${headingClass}`}>
            {t('home.hero.titleLine1')}
            <br />
            <span className="text-[#FF5C1B]">{t('home.hero.titleLine2')}</span>
          </h1>
          <p className={`max-w-[440px] text-[16px] leading-[1.65] ${subtleTextClass}`}>{t('home.hero.subtitle')}</p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="h-12 whitespace-nowrap rounded-[10px] border-2 border-[#0F172A] bg-[#FF5C1B] px-5 text-[14px] font-bold text-[#1F1308] shadow-[3px_3px_0_0_rgba(15,23,42,0.9)] transition hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[5px_5px_0_0_rgba(15,23,42,0.9)]"
            >
              {t('home.hero.primaryCta')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className={`h-12 whitespace-nowrap rounded-[10px] border-2 px-5 text-[14px] font-bold shadow-[2px_2px_0_0_rgba(15,23,42,0.9)] transition hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_0_rgba(15,23,42,0.9)] ${isDarkMode ? 'border-slate-100 text-slate-100' : 'border-[#0F172A] text-[#0F172A]'}`}
            >
              {t('home.hero.demoCta')}
            </button>
          </div>
          <p className={`text-[11px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{t('home.hero.trialNote')}</p>
        </div>

        <div className="flex flex-col gap-3">
          <article className={`${cardClass} p-4`}>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.8px] text-slate-400">{t('home.hero.cards.jobsLabel')}</p>
            {(['r1', 'r2', 'r3'] as const).map((rowKey, index) => (
              <div
                key={rowKey}
                className={`flex items-center justify-between py-2 ${index < 2 ? (isDarkMode ? 'border-b border-slate-800' : 'border-b border-slate-100') : ''}`}
              >
                <div>
                  <p className={`text-[12px] font-bold ${headingClass}`}>{t(`home.hero.cards.${rowKey}.address`)}</p>
                  <p className="text-[10px] text-slate-400">{t(`home.hero.cards.${rowKey}.description`)}</p>
                </div>
                <span className={`rounded-[4px] border px-[7px] py-[3px] text-[9px] font-bold uppercase tracking-[0.4px] ${rowKey === 'r1' ? 'border-violet-600 bg-violet-100 text-violet-700' : rowKey === 'r2' ? 'border-blue-600 bg-blue-100 text-blue-700' : 'border-green-600 bg-green-100 text-green-700'}`}>
                  {t(`home.hero.cards.${rowKey}.status`)}
                </span>
              </div>
            ))}
          </article>
          <article className={`${cardClass} grid grid-cols-2 p-4`}>
            <div className={`pr-4 ${isDarkMode ? 'border-r border-slate-800' : 'border-r border-slate-100'}`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.8px] text-slate-400">{t('home.hero.cards.revenueLabel')}</p>
              <p className="text-[22px] font-bold text-green-600">{t('home.hero.cards.revenueValue')}</p>
              <p className="text-[10px] font-semibold text-green-600">{t('home.hero.cards.revenueSub')}</p>
            </div>
            <div className="pl-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.8px] text-slate-400">{t('home.hero.cards.pendingLabel')}</p>
              <p className="text-[22px] font-bold text-[#FF5C1B]">{t('home.hero.cards.pendingValue')}</p>
              <p className="text-[10px] font-semibold text-[#FF5C1B]">{t('home.hero.cards.pendingSub')}</p>
            </div>
          </article>
        </div>
      </section>

      <div className={`mx-auto h-px w-full max-w-[960px] ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />

      <section className="mx-auto w-full max-w-[960px] px-4 py-14 md:px-8">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[1.2px] text-[#FF5C1B]">{t('home.features.eyebrow')}</p>
        <h2 className={`mb-2 text-[26px] font-bold tracking-[-0.4px] ${headingClass}`}>{t('home.features.title')}</h2>
        <p className={`mb-8 text-[14px] leading-[1.6] ${subtleTextClass}`}>{t('home.features.subtitle')}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {featureKeys.map((featureKey) => (
            <article key={featureKey} className={`${cardClass} p-5`}>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#FF5C1B] bg-[#FFF1EC] text-[#FF5C1B]">
                <span className="text-sm font-bold">+</span>
              </div>
              <h3 className={`mb-1 text-[13px] font-bold ${headingClass}`}>{t(`home.features.items.${featureKey}.title`)}</h3>
              <p className={`text-[12px] leading-[1.6] ${subtleTextClass}`}>{t(`home.features.items.${featureKey}.description`)}</p>
            </article>
          ))}
        </div>
      </section>

      <div className={`mx-auto h-px w-full max-w-[960px] ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />

      <section ref={pilotSectionRef} className="mx-auto w-full max-w-[960px] px-4 py-12 md:px-8">
        <div className="grid grid-cols-1 items-center gap-8 rounded-[14px] border-2 border-[#0F172A] bg-[#0F172A] p-8 shadow-[4px_4px_0_0_rgba(255,92,27,0.4)] md:grid-cols-[1fr_auto] md:px-11">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[1px] text-[#FF5C1B]">{t('home.pilot.eyebrow')}</p>
            <h2 className="mb-2 text-[22px] font-bold text-white">{t('home.pilot.title')}</h2>
            <p className="max-w-[500px] text-[13px] leading-[1.7] text-slate-400">{t('home.pilot.body')}</p>
            <div className="mt-4 flex flex-col gap-2">
              {pilotBulletKeys.map((bulletKey) => (
                <div key={bulletKey} className="flex items-center gap-2 text-[12px] text-slate-300">
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#FF5C1B] text-[10px] text-white">✓</span>
                  <span>{t(`home.pilot.${bulletKey}`)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button
              style={{ background: '#FF5C1B', color: '#ffffff', border: 'none', borderRadius: '10px', height: '48px', padding: '0 28px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#e0521a')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#FF5C1B')}
            >
              {t('home.pilot.cta')}
            </button>
            <p className="text-[11px] text-slate-500">{t('home.pilot.spots')}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[960px] px-4 py-14 md:px-8">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[1.2px] text-[#FF5C1B]">{t('home.pricing.eyebrow')}</p>
        <h2 className={`mb-2 text-[26px] font-bold tracking-[-0.4px] ${headingClass}`}>{t('home.pricing.title')}</h2>
        <p className={`text-[14px] leading-[1.6] ${subtleTextClass}`}>{t('home.pricing.subtitle')}</p>
        <article
          className={`mx-auto mt-8 max-w-[460px] rounded-[12px] border-2 border-[#FF5C1B] p-8 shadow-[3px_3px_0_0_rgba(255,92,27,0.5)] ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}
        >
          <span className="mb-3 inline-flex rounded-[4px] border border-[#FF5C1B] bg-[#FFF1EC] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.5px] text-[#FF5C1B]">
            {t('home.pricing.badge')}
          </span>
          <p className={`text-[15px] font-bold ${headingClass}`}>{t('home.pricing.plan')}</p>
          <p className={`mb-1 text-[36px] font-bold leading-none tracking-[-0.8px] ${headingClass}`}>
            {t('home.pricing.price')}
            <span className={`ml-1 text-[15px] font-medium ${subtleTextClass}`}>{t('home.pricing.period')}</span>
          </p>
          <p className="mb-5 text-[12px] text-slate-400">{t('home.pricing.trial')}</p>
          <div className={`mb-4 h-px ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
          {pricingFeatureKeys.map((key) => (
            <div key={key} className="mb-2 flex items-start gap-2 text-[12px] leading-[1.5] text-slate-500">
              <span className="mt-[1px] inline-flex h-[15px] w-[15px] items-center justify-center rounded-full bg-[#FF5C1B] text-[9px] text-white">✓</span>
              <span>{t(`home.pricing.features.${key}`)}</span>
            </div>
          ))}
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="mt-4 h-11 w-full rounded-[9px] border-2 border-[#0F172A] bg-[#FF5C1B] text-[14px] font-bold text-[#1F1308] shadow-[3px_3px_0_0_rgba(15,23,42,0.9)] transition hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[5px_5px_0_0_rgba(15,23,42,0.9)]"
          >
            {t('home.pricing.cta')}
          </button>
        </article>
      </section>

      <div className={`w-full border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
        <footer className="mx-auto flex w-full max-w-[960px] flex-col items-start justify-between gap-4 px-4 py-6 md:flex-row md:items-center md:px-8">
          <p className={`text-[13px] font-bold ${headingClass}`}>{t('home.footer.logo')}</p>
          <div className="flex items-center gap-5">
            {(['terms', 'privacy', 'contact'] as const).map((linkKey) => (
              <button key={linkKey} type="button" className="text-[12px] text-slate-400">
                {t(`home.footer.links.${linkKey}`)}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400">{t('home.footer.compliance')}</p>
        </footer>
      </div>
    </main>
  );
};

export default HomePage;
