import { useTranslation } from 'react-i18next';

type Language = 'en' | 'fr';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const activeLanguage = i18n.language.startsWith('fr') ? 'fr' : 'en';

  const handleChange = (language: Language) => {
    // Explicitly save preference before reload to prevent race conditions with i18next listener
    try {
      localStorage.setItem('i18nextLng', language);
    } catch (error) {
      console.warn('Unable to save language preference', error);
    }

    i18n.changeLanguage(language).then(() => {
      // Force reload to ensure external dependencies (e.g. Google Maps) re-initialize with correct locale
      window.location.reload();
    }).catch((error) => {
      console.error('Language change failed', error);
    });
  };

  return (
    <div className="language-switcher" role="group" aria-label={t('layout.languageLabel')}>
      {(['en', 'fr'] as Language[]).map((language) => (
        <button
          key={language}
          type="button"
          className={`language-button${activeLanguage === language ? ' is-active' : ''}`}
          onClick={() => handleChange(language)}
        >
          {language === 'en' ? t('layout.languageEnglish') : t('layout.languageFrench')}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
