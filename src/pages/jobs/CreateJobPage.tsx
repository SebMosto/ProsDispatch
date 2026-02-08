import { useTranslation } from 'react-i18next';
import CreateJobForm from '../../components/jobs/CreateJobForm';
import JobList from '../../components/jobs/JobList';

const CreateJobPage = () => {
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-1">
        <p className="text-sm font-medium text-slate-600">{t('jobs.create.page.section')}</p>
        <h1 className="text-2xl font-semibold text-slate-900">{t('jobs.create.page.title')}</h1>
        <p className="text-sm text-slate-600">{t('jobs.create.page.subtitle')}</p>
      </header>

      <CreateJobForm />
      <JobList />
    </main>
  );
};

export default CreateJobPage;
