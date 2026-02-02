import { useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';
import SyncBadge, { type SyncBadgeState } from '../system/SyncBadge';
import { usePersistentForm } from '../../persistence/usePersistentForm';
import { useNetworkStatus } from '../../lib/network';
import { useAuth } from '../../lib/auth';
import { getJobCreateSchema, JobCreateSchema as StaticJobCreateSchema } from '../../schemas/job';
import { useCreateJob } from '../../hooks/useCreateJob';

const DRAFT_STORAGE_KEY = 'job:create:draft';

type FormValues = z.infer<typeof StaticJobCreateSchema>;

const initialValues: FormValues = {
  client_id: '',
  property_id: '',
  title: '',
  description: undefined,
  service_date: undefined,
  status: 'draft',
};

const CreateJobForm = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const draft = usePersistentForm<FormValues>({
    storageKey: DRAFT_STORAGE_KEY,
    initialValues,
  });

  const hasAppliedDraft = useRef(false);

  // Memoize the schema to react to language changes
  const JobCreateSchema = useMemo(() => getJobCreateSchema(t), [t]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(JobCreateSchema),
    defaultValues: draft.values,
  });

  useEffect(() => {
    if (!draft.hydrated || hasAppliedDraft.current) return;

    reset(draft.values);
    hasAppliedDraft.current = true;
  }, [draft.values, draft.hydrated, reset]);

  const debounceRef = useRef<number | null>(null);
  const { setValues, hydrated } = draft;

  useEffect(() => {
    if (!hydrated) return undefined;

    const subscription = watch((value) => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
      debounceRef.current = window.setTimeout(() => {
        setValues(value as FormValues);
      }, 300);
    });

    return () => {
      subscription.unsubscribe();
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [hydrated, setValues, watch]);

  const { createJob, isLoading } = useCreateJob({
    onSuccess: () => {
      setSubmitSuccess(t('jobs.create.statuses.success'));
      void draft.clearDraft();
      reset(initialValues);
    },
  });

  const syncState: SyncBadgeState = useMemo(() => {
    if (!draft.hydrated) return 'ONLINE_SYNCING';
    if (!isOnline) return 'OFFLINE_DRAFT';
    if (draft.draftStatus === 'saved_locally') return 'ONLINE_DRAFT_PENDING';
    return 'ONLINE_SYNCED';
  }, [draft.draftStatus, draft.hydrated, isOnline]);

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!user) {
      setSubmitError(t('jobs.create.errors.auth'));
      return;
    }

    const parsed = JobCreateSchema.safeParse({
      ...values,
      description: values.description || undefined,
      service_date: values.service_date || undefined,
    });
    if (!parsed.success) {
      setSubmitError(parsed.error.issues[0]?.message ?? t('jobs.create.errors.generic'));
      return;
    }

    try {
      await createJob(parsed.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('jobs.create.errors.generic');
      setSubmitError(message);
    }
  };

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t('jobs.create.title')}</h2>
          <p className="text-sm text-slate-600">{t('jobs.create.subtitle')}</p>
        </div>
        <SyncBadge state={syncState} />
      </header>

      {submitSuccess ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">
          {submitSuccess}
        </p>
      ) : null}
      {submitError ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {submitError}
        </p>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-800" htmlFor="title">
            {t('jobs.create.labels.title')}
          </label>
          <input
            id="title"
            type="text"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            {...register('title')}
          />
          {errors.title?.message ? <p className="text-xs text-red-600">{errors.title.message}</p> : null}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-800" htmlFor="client_id">
              {t('jobs.create.labels.clientId')}
            </label>
            <input
              id="client_id"
              type="text"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              {...register('client_id')}
            />
            {errors.client_id?.message ? (
              <p className="text-xs text-red-600">{errors.client_id.message}</p>
            ) : null}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-800" htmlFor="property_id">
              {t('jobs.create.labels.propertyId')}
            </label>
            <input
              id="property_id"
              type="text"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              {...register('property_id')}
            />
            {errors.property_id?.message ? (
              <p className="text-xs text-red-600">{errors.property_id.message}</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-800" htmlFor="description">
              {t('jobs.create.labels.description')}
            </label>
            <span className="text-xs text-amber-700">{t('jobs.create.descriptionWarning')}</span>
          </div>
          <textarea
            id="description"
            rows={4}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            {...register('description')}
          />
          {errors.description?.message ? (
            <p className="text-xs text-red-600">{errors.description.message}</p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-800" htmlFor="service_date">
            {t('jobs.create.labels.serviceDate')}
          </label>
          <input
            id="service_date"
            type="date"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            {...register('service_date')}
          />
          {errors.service_date?.message ? (
            <p className="text-xs text-red-600">{errors.service_date.message}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting || isLoading ? t('jobs.create.actions.submitting') : t('jobs.create.actions.submit')}
          </button>

          <button
            type="button"
            className="text-sm font-medium text-slate-700 underline-offset-2 hover:underline"
            onClick={() => {
              void draft.clearDraft();
              reset(initialValues);
            }}
            disabled={draft.draftStatus === 'idle' && !draft.isDirty}
          >
            {t('jobs.create.actions.clearDraft')}
          </button>
        </div>
      </form>
    </section>
  );
};

export default CreateJobForm;
