import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import SyncBadge, { type SyncBadgeState } from '../system/SyncBadge';
import { usePersistentForm } from '../../persistence/usePersistentForm';
import { useNetworkStatus } from '../../lib/network';
import { useAuth } from '../../lib/auth';
import { JobCreateSchema } from '../../schemas/job';
import { useCreateJob } from '../../hooks/useCreateJob';

const DRAFT_STORAGE_KEY = 'job:create:draft';

const TEXT = {
  title: 'Create job',
  subtitle: 'Track work for a client and property.',
  descriptionWarning: 'Do not include access codes or personal information.',
  labels: {
    title: 'Job title',
    clientId: 'Client ID',
    propertyId: 'Property ID',
    description: 'Description (optional)',
    serviceDate: 'Service date (optional)',
  },
  actions: {
    submit: 'Create job',
    submitting: 'Saving...',
    clearDraft: 'Clear draft',
  },
  statuses: {
    success: 'Job saved successfully.',
    draftRestored: 'Draft restored from offline storage.',
  },
  errors: {
    generic: 'Unable to create job.',
    auth: 'You must be signed in to create a job.',
  },
};

type FormValues = z.infer<typeof JobCreateSchema>;

const initialValues: FormValues = {
  contractor_id: '',
  client_id: '',
  property_id: '',
  title: '',
  description: undefined,
  service_date: undefined,
  status: 'draft',
};

const CreateJobForm = () => {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const draft = usePersistentForm<FormValues>({
    storageKey: DRAFT_STORAGE_KEY,
    initialValues,
  });

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
    if (draft.hydrated) {
      draft.setValues(watch() as FormValues);
    }
  }, [watch, draft.hydrated, draft]);

  const { createJob, isLoading } = useCreateJob({
    onSuccess: () => {
      setSubmitSuccess(TEXT.statuses.success);
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
      setSubmitError(TEXT.errors.auth);
      return;
    }

    const payload = {
      ...values,
      contractor_id: user.id,
      description: values.description || undefined,
      service_date: values.service_date || undefined,
    } as FormValues;

    const parsed = JobCreateSchema.safeParse(payload);
    if (!parsed.success) {
      setSubmitError(parsed.error.issues[0]?.message ?? TEXT.errors.generic);
      return;
    }

    await createJob(parsed.data);
  };

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{TEXT.title}</h2>
          <p className="text-sm text-slate-600">{TEXT.subtitle}</p>
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
            {TEXT.labels.title}
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
              {TEXT.labels.clientId}
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
              {TEXT.labels.propertyId}
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
              {TEXT.labels.description}
            </label>
            <span className="text-xs text-amber-700">{TEXT.descriptionWarning}</span>
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
            {TEXT.labels.serviceDate}
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
            {isSubmitting || isLoading ? TEXT.actions.submitting : TEXT.actions.submit}
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
            {TEXT.actions.clearDraft}
          </button>
        </div>
      </form>
    </section>
  );
};

export default CreateJobForm;
