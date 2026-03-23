import { useTranslation } from 'react-i18next';
import JobList from '../../components/jobs/JobList';
import { Link } from '../../lib/router';

const JobsListPage = () => {
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{t('jobs.list.pageTitle')}</h1>
        </div>
        <div className="mt-2 sm:mt-0">
          <Link
            to="/jobs/new"
            className="inline-flex h-9 min-h-[36px] items-center justify-center rounded-[7px] border-2 border-slate-900 bg-[#FF5C1B] px-3 font-bold text-[#1F1308] shadow-[2px_2px_0_0_rgba(15,23,42,0.9)] transition hover:shadow-[4px_4px_0_0_rgba(15,23,42,0.9)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[1px_1px_0_0_rgba(15,23,42,0.9)] active:translate-x-px active:translate-y-px"
          >
            {t('dashboard.newJob')}
          </Link>
        </div>
      </header>

      <JobList />

      <Link
        to="/jobs/new"
        className="fixed bottom-20 right-4 z-20 inline-flex h-11 min-h-[44px] items-center justify-center rounded-[7px] border-2 border-[#0F172A] bg-[#FF5C1B] px-4 font-bold text-white shadow-brutal transition hover:translate-x-[-1px] hover:translate-y-[-1px]"
      >
        {t('jobs.new')}
      </Link>
    </main>
  );
};

export default JobsListPage;
