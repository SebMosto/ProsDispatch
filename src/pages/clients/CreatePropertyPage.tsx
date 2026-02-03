import { useTranslation } from 'react-i18next';
import CreatePropertyForm from '../../components/properties/CreatePropertyForm';
import { Link, useLocation } from '../../lib/router';

const CreatePropertyPage = () => {
  const { t } = useTranslation();
  const { pathname, state } = useLocation();
  const clientIdFromState = (state as { clientId?: string } | null)?.clientId;
  const segments = pathname.split('/').filter(Boolean);
  const clientIdFromPath = segments.length >= 2 ? segments[1] : undefined;
  const clientId = clientIdFromState ?? clientIdFromPath;

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-600">{t('properties.createPage.breadCrumb')}</p>
          <h1 className="text-2xl font-semibold text-slate-900">{t('properties.createPage.header')}</h1>
          <p className="text-sm text-slate-600">{t('properties.createPage.subHeader')}</p>
        </div>
        <Link className="text-sm font-semibold text-slate-800 underline-offset-2 hover:underline" to={clientId ? `/clients/${clientId}` : '/clients'}>
          {t('properties.createPage.backToClient')}
        </Link>
      </header>

      <CreatePropertyForm clientId={clientId} />
    </main>
  );
};

export default CreatePropertyPage;
