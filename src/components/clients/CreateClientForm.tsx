import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type Resolver } from 'react-hook-form';
import type { z } from 'zod';
import SyncBadge from '../system/SyncBadge';
import { useAuth } from '../../lib/auth';
import { useNavigate } from '../../lib/router';
import { getClientSchema, ClientSchema as StaticClientSchema } from '../../schemas/client';
import { useCreateClientMutation } from '../../hooks/useClientMutations';
import { useTranslation } from 'react-i18next';

type FormValues = z.infer<typeof StaticClientSchema>;

const initialValues: FormValues = {
  name: '',
  email: '',
  type: 'individual',
  preferred_language: 'en',
};

const CreateClientForm: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Use useMemo to recreate the schema when the language changes
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
    defaultValues: initialValues,
  });

  const createMutation = useCreateClientMutation();

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    if (!user?.id) {
      setSubmitError(t('clients.create.errors.auth'));
      return;
    }

    const parsed = ClientSchema.safeParse({
      ...values,
      email: values.email || undefined,
    });

    if (!parsed.success) {
      setSubmitError(parsed.error.issues[0]?.message ?? t('clients.create.errors.generic'));
      return;
    }

    try {
      await createMutation.mutateAsync(parsed.data);
      reset(initialValues);
      navigate('/clients');
    } catch (error) {
      const message =
        (error as { message?: string })?.message ?? t('clients.create.errors.generic');
      setSubmitError(message);
    }
  };

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t('clients.create.title')}</h2>
          <p className="text-sm text-slate-600">{t('clients.create.subtitle')}</p>
        </div>
        <SyncBadge state="ONLINE_SYNCED" />
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
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  watch('type') === option
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
          <label className="block text-sm font-medium text-slate-800" htmlFor="name">
            {t('clients.create.labels.name')}
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
            {t('clients.create.labels.email')}
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
            {t('clients.create.labels.preferredLanguage')}
          </label>
          <select
            id="preferred_language"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            {...register('preferred_language')}
          >
            <option value="en">{t('clients.create.labels.languages.en')}</option>
            <option value="fr">{t('clients.create.labels.languages.fr')}</option>
          </select>
          {errors.preferred_language?.message ? (
            <p className="text-xs text-red-600">{errors.preferred_language.message}</p>
          ) : null}
        </div>

        <button
          type="submit"
          className="flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting || createMutation.isPending}
        >
          {isSubmitting || createMutation.isPending
            ? t('clients.create.actions.submitting')
            : t('clients.create.actions.submit')}
        </button>
      </form>
    </section>
  );
};

export default CreateClientForm;
