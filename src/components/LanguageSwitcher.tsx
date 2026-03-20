import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const isFrench = i18n.language.startsWith('fr');
  const activeLanguage = isFrench ? 'FR' : 'EN';

  const handleToggle = () => {
    const nextLanguage = isFrench ? 'en' : 'fr';
    i18n.changeLanguage(nextLanguage).then(() => {
      localStorage.setItem('i18nextLng', nextLanguage);
    }).catch(() => {
      // noop
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="flex items-center gap-[6px] rounded-full bg-[#E2E8F0] px-[10px] py-[5px] pr-[14px] text-[13px] font-medium text-[#0F172A] transition-colors hover:bg-[#CBD5E1]"
      aria-label={t('layout.languageLabel')}
    >
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M2 4h8M6 2v2M3 4c0 3 2 5 4 6M7 4c-.5 2-2 4-4 5.5" />
        <path d="M9 9l2-5 2 5M9.7 7.5h2.6" />
      </svg>
      {activeLanguage}
    </button>
  );
};

export default LanguageSwitcher;
