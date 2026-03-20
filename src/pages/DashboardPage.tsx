import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';
import { useLocation, useNavigate } from '../lib/router';
import { Link } from '../lib/router';
import { useJobs } from '../hooks/useJobs';
import { useClients } from '../hooks/useClients';
import { useInvoicesByContractor } from '../hooks/useInvoices';
import { propertyRepository } from '../repositories/propertyRepository';
import { jobRepository } from '../repositories/jobRepository';
import { canTransition, type JobStatus } from '../lib/stateMachines';
import { formatDate } from '../lib/date';
import { formatCurrency } from '../lib/currency';
import type { JobRecord } from '../repositories/jobRepository';
import type { RepositoryError } from '../repositories/base';
import JobStatusBadge from '../components/jobs/JobStatusBadge';

const TOAST_DURATION_MS = 2500;
const RECENT_JOBS_LIMIT = 5;
const UPCOMING_LIMIT = 5;

const statusOrder: JobStatus[] = [
  'draft',
  'sent',
  'approved',
  'in_progress',
  'completed',
  'invoiced',
  'paid',
  'archived',
];

function getNextStatus(current: JobStatus): JobStatus | null {
  const idx = statusOrder.indexOf(current);
  if (idx === -1 || idx >= statusOrder.length - 1) return null;
  const next = statusOrder[idx + 1];
  return canTransition(current, next) ? next : null;
}

function isCurrentMonth(isoDate: string | null): boolean {
  if (!isoDate) return false;
  const d = new Date(isoDate);
  const n = new Date();
  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

function todayYMD(): string {
  return new Date().toISOString().slice(0, 10);
}

const DashboardPage = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith('fr') ? 'fr-CA' : 'en-CA';
  const { profile, subscriptionStatus, trialDaysRemaining } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSubscribedToast, setShowSubscribedToast] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { jobs, loading: jobsLoading, error: jobsError, refetch: refetchJobs } = useJobs();
  const { clients, loading: clientsLoading } = useClients();
  const { invoices, loading: invoicesLoading } = useInvoicesByContractor();

  const clientIdsFromJobs = useMemo(
    () => [...new Set((jobs ?? []).map((j) => j.client_id))],
    [jobs],
  );

  const { data: properties = [] } = useQuery({
    queryKey: ['properties', 'dashboard', clientIdsFromJobs.join(',')],
    queryFn: async () => {
      const res = await propertyRepository.list({
        clientIds: clientIdsFromJobs.length ? clientIdsFromJobs : undefined,
      });
      if (res.error) throw res.error;
      return res.data ?? [];
    },
    enabled: clientIdsFromJobs.length > 0,
  });

  const updateJobStatusMutation = useMutation<
    JobRecord,
    RepositoryError,
    { jobId: string; status: JobStatus }
  >({
    mutationFn: async ({ jobId, status }) => {
      const result = await jobRepository.update(jobId, { status });
      if (result.error || !result.data) throw result.error ?? { message: 'Unknown error', reason: 'unknown' };
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] }).catch(() => {});
      setToast(t('dashboard.toast.statusUpdated'));
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('subscribed') === 'true') {
      setTimeout(() => setShowSubscribedToast(true), 0);
      params.delete('subscribed');
      navigate(
        { pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : '' },
        { replace: true },
      );
    }
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => clearTimeout(id);
  }, [toast]);

  const showTrialBanner = useMemo(() => {
    if (subscriptionStatus !== 'trialing') return false;
    if (trialDaysRemaining <= 0) return false;
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('pd_trial_banner_dismissed') === '1')
      return false;
    return true;
  }, [subscriptionStatus, trialDaysRemaining]);

  const dismissTrialBanner = useCallback(() => {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('pd_trial_banner_dismissed', '1');
  }, []);

  const firstName = useMemo(() => profile?.full_name?.split(' ')[0] ?? null, [profile?.full_name]);

  const clientMap = useMemo(() => {
    const m = new Map<string, string>();
    (clients ?? []).forEach((c) => m.set(c.id, c.name ?? ''));
    return m;
  }, [clients]);

  const propertyMap = useMemo(() => {
    const m = new Map<
      string,
      { address_line1: string; city: string }
    >();
    (properties ?? []).forEach((p) =>
      m.set(p.id, { address_line1: p.address_line1, city: p.city }),
    );
    return m;
  }, [properties]);

  const needAttentionCount = useMemo(
    () => (jobs ?? []).filter((j) => ['draft', 'sent', 'approved', 'in_progress'].includes(j.status)).length,
    [jobs],
  );
  const overdueInvoices = useMemo(
    () => (invoices ?? []).filter((i) => i.status === 'overdue'),
    [invoices],
  );
  const overdueCount = overdueInvoices.length;
  const overdueTotalCents = useMemo(
    () => overdueInvoices.reduce((s, i) => s + (i.total_amount ?? 0), 0),
    [overdueInvoices],
  );
  const overdueAmountFormatted = formatCurrency(overdueTotalCents / 100, 'CAD', locale);
  const revenueThisMonthCents = useMemo(
    () =>
      (invoices ?? [])
        .filter((i) => i.status === 'paid' && isCurrentMonth(i.paid_at))
        .reduce((s, i) => s + (i.total_amount ?? 0), 0),
    [invoices],
  );
  const revenueFormatted = formatCurrency(revenueThisMonthCents / 100, 'CAD', locale);
  const totalClients = (clients ?? []).length;

  const recentJobs = useMemo(() => (jobs ?? []).slice(0, RECENT_JOBS_LIMIT), [jobs]);
  const upcomingJobs = useMemo(() => {
    const today = todayYMD();
    return (jobs ?? [])
      .filter((j) => j.service_date && j.service_date >= today)
      .sort((a, b) => (a.service_date ?? '').localeCompare(b.service_date ?? ''))
      .slice(0, UPCOMING_LIMIT);
  }, [jobs]);

  const handleStatusChipClick = useCallback(
    (job: JobRecord) => {
      const next = getNextStatus(job.status as JobStatus);
      if (!next) return;
      updateJobStatusMutation.mutate({ jobId: job.id, status: next });
    },
    [updateJobStatusMutation],
  );

  const handleResend = useCallback(() => {
    setToast(t('dashboard.toast.resendSent'));
  }, [t]);

  const loading = jobsLoading || clientsLoading || invoicesLoading;
  const error = jobsError;
  const errorText = error?.reason === 'network' ? t('errors.timeout') : t('errors.unexpected');

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
      {/* Page header */}
      <header className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[19px] font-bold text-slate-900">
            {firstName ? t('dashboard.greeting', { name: firstName }) : t('dashboard.greetingFallback')}
          </h1>
          <p className="text-xs text-slate-500">{formatDate(new Date())}</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 sm:mt-0">
          <Link
            to="/clients/new"
            className="inline-flex h-9 min-h-[36px] items-center justify-center rounded-[7px] border-2 border-slate-900 bg-white px-3 font-bold text-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,0.9)] transition hover:shadow-[4px_4px_0_0_rgba(15,23,42,0.9)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[1px_1px_0_0_rgba(15,23,42,0.9)] active:translate-x-px active:translate-y-px"
          >
            {t('dashboard.newClient')}
          </Link>
          <Link
            to="/jobs/new"
            className="inline-flex h-9 min-h-[36px] items-center justify-center rounded-[7px] border-2 border-slate-900 bg-[#FF5C1B] px-3 font-bold text-[#1F1308] shadow-[2px_2px_0_0_rgba(15,23,42,0.9)] transition hover:shadow-[4px_4px_0_0_rgba(15,23,42,0.9)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[1px_1px_0_0_rgba(15,23,42,0.9)] active:translate-x-px active:translate-y-px"
          >
            {t('dashboard.newJob')}
          </Link>
        </div>
      </header>

      {/* Subscribed toast */}
      {showSubscribedToast && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          {t('dashboard.subscribed.toast')}
        </div>
      )}

      {/* Trial banner */}
      {showTrialBanner && (
        <section className="flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <div>
            <p>
              {trialDaysRemaining === 1
                ? t('dashboard.trial.urgent')
                : t('dashboard.trial.banner', { days: trialDaysRemaining })}
            </p>
            <button
              type="button"
              onClick={() => navigate('/subscribe')}
              className="mt-2 inline-flex rounded-md border-2 border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-[2px_2px_0_0_rgba(15,23,42,0.9)] hover:bg-slate-800"
            >
              {t('dashboard.trial.cta')}
            </button>
          </div>
          <button
            type="button"
            onClick={dismissTrialBanner}
            aria-label={t('common.notAvailable')}
            className="text-amber-700 hover:text-amber-900"
          >
            ×
          </button>
        </section>
      )}

      {/* Calm alert — overdue invoices */}
      {overdueCount > 0 && (
        <section
          className="rounded-[10px] border-2 border-[#FF5C1B] bg-white p-4 shadow-[2px_2px_0_0_rgba(255,92,27,0.35)]"
          role="alert"
        >
          <p className="text-sm text-slate-900">
            {t('dashboard.alert.overdue', { count: overdueCount, amount: overdueAmountFormatted })}
          </p>
          <Link
            to="/invoices"
            className="mt-2 inline-block text-sm font-bold text-[#FF5C1B] hover:underline"
          >
            {t('dashboard.alert.viewInvoices')}
          </Link>
        </section>
      )}

      {error && (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">{t('jobs.list.error')}</p>
          <p>{errorText}</p>
          <button
            type="button"
            onClick={() => refetchJobs()}
            className="mt-2 inline-flex h-[36px] items-center justify-center rounded-[7px] border-2 border-[#0F172A] bg-[#FF5C1B] px-[13px] text-xs font-bold text-[#1F1308] shadow-brutal transition hover:translate-x-[-1px] hover:translate-y-[-1px]"
          >
            {t('jobs.list.retry')}
          </button>
        </section>
      )}

      {!error && (
        <>
          {/* KPI stat cards — 4-column grid */}
          <section className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[10px] border-2 border-[#FF5C1B] bg-white p-4 shadow-[2px_2px_0_0_rgba(255,92,27,0.35)]">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {t('dashboard.stats.needAttention')}
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {loading ? '—' : needAttentionCount}
              </p>
            </div>
            <div className="rounded-[10px] border-2 border-[#FF5C1B] bg-white p-4 shadow-[2px_2px_0_0_rgba(255,92,27,0.35)]">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {t('dashboard.stats.overdueInvoices')}
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {loading ? '—' : t('dashboard.stats.countAndAmount', { count: overdueCount, amount: overdueAmountFormatted })}
              </p>
            </div>
            <div className="rounded-[10px] border-2 border-[#16A34A] bg-white p-4 shadow-[2px_2px_0_0_rgba(22,101,52,0.9)]">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {t('dashboard.stats.revenueMonth')}
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900">{loading ? '—' : revenueFormatted}</p>
            </div>
            <div className="rounded-[10px] border-2 border-slate-900 bg-white p-4 shadow-[2px_2px_0_0_rgba(15,23,42,0.9)]">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {t('dashboard.stats.totalClients')}
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900">{loading ? '—' : totalClients}</p>
            </div>
          </section>

          {/* Two-column: Recent Jobs | Overdue + Upcoming */}
          <div className="flex flex-col gap-4 lg:flex-row">
            {/* Left: Recent Jobs */}
            <section className="min-w-0 flex-1 rounded-[10px] border-2 border-slate-900 bg-white shadow-[2px_2px_0_0_rgba(15,23,42,0.9)]">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-xs font-bold text-slate-900">
                <span>{t('dashboard.recentJobs')}</span>
                <Link to="/jobs" className="font-bold text-[#FF5C1B] hover:underline">
                  {t('dashboard.viewAll')}
                </Link>
              </div>
              <div className="divide-y divide-slate-100 p-4">
                {loading ? (
                  <p className="text-sm text-slate-500">{t('common.processing')}</p>
                ) : recentJobs.length === 0 ? (
                  <p className="text-sm text-slate-500">{t('dashboard.emptyJobs')}</p>
                ) : (
                  recentJobs.map((job) => {
                    const address =
                      propertyMap.get(job.property_id)?.address_line1 ||
                      propertyMap.get(job.property_id)?.city ||
                      '—';
                    const clientName = clientMap.get(job.client_id) || '—';
                    const nextStatus = getNextStatus(job.status as JobStatus);
                    const tappable = Boolean(nextStatus);
                    return (
                      <div key={job.id} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[13px] font-bold text-slate-900">{address}</p>
                          <button
                            type="button"
                            onClick={() => tappable && handleStatusChipClick(job)}
                            disabled={!tappable}
                            className="shrink-0"
                            aria-label={t('dashboard.toast.statusUpdated')}
                          >
                            <JobStatusBadge status={job.status} className="text-[9px]" />
                          </button>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {(job.description ?? '').trim() || job.title}
                          {clientName !== '—' ? ` · ${clientName}` : ''}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          {job.service_date ? formatDate(job.service_date) : '—'}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Right: Overdue + Upcoming */}
            <aside className="flex w-full flex-col gap-3.5 lg:w-[280px] lg:shrink-0">
              {/* Overdue Invoices card */}
              <section className="rounded-[10px] border-2 border-slate-900 bg-white shadow-[2px_2px_0_0_rgba(15,23,42,0.9)]">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-xs font-bold text-slate-900">
                  <span>{t('dashboard.overdueCard.title')}</span>
                  <Link to="/invoices" className="font-bold text-[#FF5C1B] hover:underline">
                    {t('dashboard.viewAll')}
                  </Link>
                </div>
                <div className="divide-y divide-slate-100 p-4">
                  {loading ? (
                    <p className="text-sm text-slate-500">{t('common.processing')}</p>
                  ) : overdueInvoices.length === 0 ? (
                    <p className="text-sm text-slate-500">{t('dashboard.overdueCard.empty')}</p>
                  ) : (
                    overdueInvoices.slice(0, 5).map((inv) => {
                      const job = (jobs ?? []).find((j) => j.id === inv.job_id);
                      const clientName = job ? clientMap.get(job.client_id) ?? '—' : '—';
                      const amountFormatted = formatCurrency((inv.total_amount ?? 0) / 100, 'CAD', locale);
                      return (
                        <div key={inv.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-slate-900">{clientName}</p>
                            <p className="text-[11px] text-slate-500">
                              {amountFormatted} · INV-{inv.invoice_number}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {t('dashboard.overdueCard.overdue')}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleResend}
                            className="rounded-md border-2 border-[#FF5C1B] bg-transparent px-2.5 py-1.5 text-[11px] font-bold text-[#FF5C1B] hover:bg-[#FFF1EC]"
                          >
                            {t('dashboard.overdueCard.resend')}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              {/* Upcoming card */}
              <section className="rounded-[10px] border-2 border-slate-900 bg-white shadow-[2px_2px_0_0_rgba(15,23,42,0.9)]">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-xs font-bold text-slate-900">
                  <span>{t('dashboard.upcoming.title')}</span>
                  <Link to="/jobs" className="font-bold text-[#FF5C1B] hover:underline">
                    {t('dashboard.upcoming.calendar')}
                  </Link>
                </div>
                <div className="divide-y divide-slate-100 p-4">
                  {loading ? (
                    <p className="text-sm text-slate-500">{t('common.processing')}</p>
                  ) : upcomingJobs.length === 0 ? (
                    <p className="text-sm text-slate-500">{t('dashboard.upcoming.empty')}</p>
                  ) : (
                    upcomingJobs.map((job) => {
                      const clientName = clientMap.get(job.client_id) ?? '—';
                      const sd = job.service_date;
                      const month = sd
                        ? new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(sd))
                        : '—';
                      const day = sd
                        ? new Intl.DateTimeFormat(locale, { day: 'numeric' }).format(new Date(sd))
                        : '—';
                      return (
                        <div key={job.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                          <div className="flex shrink-0 flex-col rounded-md border-2 border-slate-900 p-1.5 text-center">
                            <span className="text-[10px] font-bold uppercase text-[#FF5C1B]">{month}</span>
                            <span className="text-sm font-bold text-slate-900">{day}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-slate-900">{job.title}</p>
                            <p className="text-[11px] text-slate-500">
                              {clientName}
                              {sd ? ` · ${formatDate(sd)}` : ''}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </aside>
          </div>
        </>
      )}

      {/* Toast — fixed bottom */}
      {toast && (
        <div
          className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-lg border-2 border-slate-900 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,0.9)]"
          role="status"
          aria-live="polite"
        >
          {toast}
        </div>
      )}
    </main>
  );
};

export default DashboardPage;
