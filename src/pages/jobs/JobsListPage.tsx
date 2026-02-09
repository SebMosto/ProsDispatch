import { useTranslation } from 'react-i18next';
import JobList from '../../components/jobs/JobList';

const JobsListPage = () => {
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-1">
        <p className="text-sm font-medium text-slate-600">{t('jobs.list.pageTitle')}</p>
        <h1 className="text-2xl font-semibold text-slate-900">{t('jobs.list.header')}</h1>
        <p className="text-sm text-slate-600">{t('jobs.list.subHeader')}</p>
      </header>

      <JobList />
    </main>
  );
};

export default JobsListPage;
