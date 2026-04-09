import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type Resolver } from 'react-hook-form';
import type { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Link } from '../../lib/router';
import { useAuth } from '../../lib/auth';
import { useNetworkStatus } from '../../lib/network';
import SyncBadge, { type SyncBadgeState } from '../../components/system/SyncBadge';
import { usePersistentForm } from '../../persistence/usePersistentForm';
import { getClientSchema, ClientSchema as StaticClientSchema } from '../../schemas/client';
import { useUpdateClientMutation } from '../../hooks/useClientMutations';
import { useClientDetail } from '../../hooks/useClientDetail';

type FormValues = z.infer<typeof StaticClientSchema>;

const ClientEditPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data, loading, error } = useClientDetail(id ?? undefined);
  const client = data?.client;

  const storageKey = useMemo(
    () => `draft:client:edit:${user?.id ?? 'anon'}:${id ?? ''}`,
    [user?.id, id],
  );

  const initialValues = useMemo<FormValues>(
    () => ({
      name: client?.name ?? '',
      email: client?.email ?? '',
      type: client?.type ?? 'individual',
      preferred_language: client?.preferred_language ?? 'en',
    }),
    [client?.name, client?.email, client?.type, client?.preferred_language],
  );

  const draft = usePersistentForm<FormValues>({
    storageKey,
    initialValues,
    enabled: Boolean(id),
  });

  const ClientSchema = useMemo(() => getClientSchema(t), [t]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(ClientSchema) as Resolver<FormValues>,
    defaultValues: draft.values,
  });

  const hasAppliedDraft = useRef(false);

  useEffect(() => {
    if (!client || !draft.hydrated || hasAppliedDraft.current) return;
    const valuesToApply = draft.draftStatus === 'saved_locally' ? draft.values : initialValues;
    reset(valuesToApply);
    hasAppliedDraft.current = true;
  }, [client, draft.hydrated, draft.draftStatus, draft.values, initialValues, reset]);

  useEffect(() => {
    if (!draft.hydrated) return undefined;
    // eslint-disable-next-line react-hooks/incompatible-library
    const subscription = watch((value) => {
      draft.setValues(value as FormValues);
    });
    return () => subscription.unsubscribe();
  }, [draft, draft.hydrated, watch]);

  const updateMutation = useUpdateClientMutation(id ?? '');

  const syncState: SyncBadgeState = useMemo(() => {
    if (!draft.hydrated) return 'ONLINE_SYNCING';
    if (!isOnline) return 'OFFLINE_DRAFT';
    if (draft.draftStatus === 'saved_locally') return 'ONLINE_DRAFT_PENDING';
    return 'ONLINE_SYNCED';
  }, [draft.draftStatus, draft.hydrated, isOnline]);

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    if (!id) return;

    const parsed = ClientSchema.safeParse({
      ...values,
      email: values.email || undefined,
    });

    if (!parsed.success) {
      setSubmitError(parsed.error.issues[0]?.message ?? t('clients.create.errors.generic'));
      return;
    }

    try {
      await updateMutation.mutateAsync(parsed.data);
      await draft.clearDraft();
      await queryClient.invalidateQueries({ queryKey: ['clientDetail', id] });
      navigate(`/clients/${id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('clients.create.errors.generic');
      setSubmitError(message);
    }
  };

  if (!id) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-red-700">{t('clients.detail.noSelection')}</p>
        <Link to="/clients" className="text-sm font-semibold text-slate-800 underline hover:no-underline">
          {t('clients.detail.backToClients')}
        </Link>
      </main>
    );
  }

  if (loading && !client) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-10 w-48 animate-pulse rounded bg-slate-200" />
        <div className="h-64 animate-pulse rounded bg-slate-100" />
      </main>
    );
  }

  if (error || !client) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-red-700">{t('clients.detail.error')}</p>
        <Link to="/clients" className="text-sm font-semibold text-slate-800 underline hover:no-underline">
          {t('clients.detail.backToClients')}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
        <Link to="/clients" className="hover:underline">
          {t('clients.list.pageTitle')}
        </Link>
        <span className="mx-2" aria-hidden>›</span>
        <Link to={`/clients/${id}`} className="hover:underline">
          {client.name}
        </Link>
        <span className="mx-2" aria-hidden>›</span>
        <span className="font-medium text-slate-900">{t('clients.detail.editClient')}</span>
      </nav>

      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <header className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{t('clients.detail.editClient')}</h1>
            <p className="text-sm text-slate-600">{client.name}</p>
          </div>
          <SyncBadge state={syncState} />
        </header>

        {submitError ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {submitError}
          </p>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-1">
            <span className="block text-sm font-medium text-slate-800">{t('clients.create.labels.type')}</span>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label={t('clients.create.labels.type')}>
              {(['individual', 'business'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`min-h-[44px] rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    draft.values.type === option
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-800'
                  }`}
                  onClick={() => setValue('type', option)}
                >
                  {t(`clients.create.labels.types.${option}`)}
                </button>
              ))}
            </div>
            {errors.type?.message ? <p className="text-xs text-red-600">{errors.type.message}</p> : null}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-800" htmlFor="edit-name">
              {t('clients.create.labels.name')}
            </label>
            <input
              id="edit-name"
              type="text"
              className="min-h-[44px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              {...register('name')}
            />
            {errors.name?.message ? <p className="text-xs text-red-600">{errors.name.message}</p> : null}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-800" htmlFor="edit-email">
              {t('clients.create.labels.email')}
            </label>
            <input
              id="edit-email"
              type="email"
              className="min-h-[44px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              {...register('email')}
            />
            {errors.email?.message ? <p className="text-xs text-red-600">{errors.email.message}</p> : null}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-800" htmlFor="edit-preferred_language">
              {t('clients.create.labels.preferredLanguage')}
            </label>
            <select
              id="edit-preferred_language"
              className="min-h-[44px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              {...register('preferred_language')}
            >
              <option value="en">{t('clients.create.labels.languages.en')}</option>
              <option value="fr">{t('clients.create.labels.languages.fr')}</option>
            </select>
            {errors.preferred_language?.message ? (
              <p className="text-xs text-red-600">{errors.preferred_language.message}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="min-h-[44px] flex-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-70"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('clients.create.actions.submitting') : t('clients.create.actions.submit')}
            </button>
            <Link
              to={`/clients/${id}`}
              className="min-h-[44px] inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
            >
              {t('jobs.invoices.markPaidModal.cancel')}
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
};

export default ClientEditPage;
