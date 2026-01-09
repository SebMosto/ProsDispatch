import { useTranslation } from 'react-i18next';
import InvoiceForm from '../../components/invoices/InvoiceForm';
import { useLocation, useNavigate } from '../../lib/router';

const CreateInvoicePage = () => {
  const { t } = useTranslation();
  const { pathname, state } = useLocation();
  const navigate = useNavigate();
  const jobIdFromState = (state as { jobId?: string } | null)?.jobId;
  const segments = pathname.split('/').filter(Boolean);
  const jobIdFromPath = segments.length >= 2 ? segments[1] : undefined;
  const jobId = jobIdFromState ?? jobIdFromPath;

  if (!jobId) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-red-700">{t('jobs.invoices.createPage.errorNoJob')}</p>
        <button
          type="button"
          onClick={() => navigate('/jobs')}
          className="inline-flex w-fit items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          {t('jobs.invoices.createPage.backToJobs')}
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-1">
        <p className="text-sm font-medium text-slate-600">{t('jobs.invoices.createPage.header')}</p>
        <h1 className="text-2xl font-semibold text-slate-900">{t('jobs.invoices.createPage.title')}</h1>
        <p className="text-sm text-slate-600">{t('jobs.invoices.createPage.subtitle')}</p>
      </header>
      <InvoiceForm jobId={jobId} />
    </main>
  );
};

export default CreateInvoicePage;
