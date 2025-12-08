import LanguageSwitcher from './components/LanguageSwitcher';
import HomePage from './pages/HomePage';
import { useTranslation } from 'react-i18next';

const App = () => {
  const { t } = useTranslation();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand" aria-label={t('layout.brand')}>
          {t('layout.brand')}
        </div>
        <LanguageSwitcher />
      </header>
      <HomePage />
    </div>
  );
};

export default App;
