import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const featureKeys = ['billing', 'payments', 'compliance'] as const;

const HomePage = () => {
  const { t } = useTranslation();

  return (
    <main className="page">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__badge">{t('layout.brand')}</div>
        <h1 id="hero-title" className="hero__title">
          {t('hero.title')}
        </h1>
        <p className="hero__subtitle">{t('hero.subtitle')}</p>
        <div className="hero__actions">
          <Link to="/register" className="primary-button">
            {t('hero.primaryCta')}
          </Link>
          <Link to="/login" className="secondary-button">
            {t('hero.secondaryCta')}
          </Link>
        </div>
      </section>

      <section className="feature-section" aria-labelledby="feature-title">
        <div className="section-header">
          <h2 id="feature-title" className="section-title">
            {t('features.title')}
          </h2>
        </div>
        <div className="feature-grid">
          {featureKeys.map((featureKey) => (
            <article key={featureKey} className="feature-card">
              <h3 className="feature-card__title">{t(`features.list.${featureKey}.title`)}</h3>
              <p className="feature-card__description">{t(`features.list.${featureKey}.description`)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="footer-note" aria-label={t('footer.note')}>
        <p>{t('footer.note')}</p>
      </section>
    </main>
  );
};

export default HomePage;
