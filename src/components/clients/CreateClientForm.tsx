import { useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import SyncBadge, { type SyncBadgeState } from '../system/SyncBadge';
import { usePersistentForm } from '../../persistence/usePersistentForm';
import { useNetworkStatus } from '../../lib/network';
import { useAuth } from '../../lib/auth';
import { ClientSchema } from '../../schemas/client';
import { useCreateClientMutation } from '../../hooks/useClientMutations';

const DRAFT_STORAGE_KEY = 'client:create:draft';

type FormValues = z.infer<typeof ClientSchema>;

const initialValues: FormValues = {
  name: '',
  email: '',
  type: 'individual',
  preferred_language: 'en',
};

const TEXT = {
  title: 'Create client',
  subtitle: 'Capture client details.',
  action: 'Save client',
  loading: 'Saving...',
  errors: {
    generic: 'Unable to save client.',
    auth: 'You must be logged in to create a client.',
  },
};

const CreateClientForm: React.FC = () => {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const draft = usePersistentForm<FormValues>({
    storageKey: DRAFT_STORAGE_KEY,
    initialValues,
  });

  const hasAppliedDraft = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(ClientSchema),
    defaultValues: draft.values,
  });

  useEffect(() => {
    if (!draft.hydrated || hasAppliedDraft.current) return;

    reset(draft.values);
    hasAppliedDraft.current = true;
  }, [draft.values, draft.hydrated, reset]);

  useEffect(() => {
    if (!draft.hydrated) return undefined;

    const subscription = watch((value) => {
      draft.setValues(value as FormValues);
    });

    return () => subscription.unsubscribe();
  }, [draft, draft.hydrated, watch]);

  const createMutation = useCreateClientMutation();

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

    const parsed = ClientSchema.safeParse({
      ...values,
      email: values.email || undefined,
    });

    if (!parsed.success) {
      setSubmitError(parsed.error.issues[0]?.message ?? TEXT.errors.generic);
      return;
    }

    try {
      await createMutation.mutateAsync(parsed.data);
      setSubmitSuccess('Client saved.');
      await draft.clearDraft();
      reset(initialValues);
    } catch (error) {
      const message = error instanceof Error ? error.message : TEXT.errors.generic;
      setSubmitError(message);
    }
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
          <span className="block text-sm font-medium text-slate-800">Client type</span>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Client type">
            {(['individual', 'business'] as const).map((option) => (
              <button
                key={option}
                type="button"
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  draft.values.type === option
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-800'
                }`}
                onClick={() => setValue('type', option)}
              >
                {option === 'business' ? 'Business' : 'Individual'}
              </button>
            ))}
          </div>
          {errors.type?.message ? <p className="text-xs text-red-600">{errors.type.message}</p> : null}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-800" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            type="text"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            {...register('name')}
          />
          {errors.name?.message ? <p className="text-xs text-red-600">{errors.name.message}</p> : null}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-800" htmlFor="email">
            Email (optional)
          </label>
          <input
            id="email"
            type="email"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            {...register('email')}
          />
          {errors.email?.message ? <p className="text-xs text-red-600">{errors.email.message}</p> : null}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-800" htmlFor="preferred_language">
            Preferred language
          </label>
          <select
            id="preferred_language"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            {...register('preferred_language')}
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
          {errors.preferred_language?.message ? (
            <p className="text-xs text-red-600">{errors.preferred_language.message}</p>
          ) : null}
        </div>

        <button
          type="submit"
          className="flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
        >
          {isSubmitting ? TEXT.loading : TEXT.action}
        </button>
      </form>
    </section>
  );
};

export default CreateClientForm;
