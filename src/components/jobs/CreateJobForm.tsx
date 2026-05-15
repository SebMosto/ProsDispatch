import { useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';
import { useAuth } from '../../lib/auth';
import { useNavigate } from '../../lib/router';
import { getJobCreateSchema, JobCreateSchema as StaticJobCreateSchema } from '../../schemas/job';
import { useCreateJobMutation } from '../../hooks/useJobMutations';
import { useClients } from '../../hooks/useClients';
import { useProperties } from '../../hooks/useProperties';

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
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [clientOpen, setClientOpen] = useState(false);
  const clientComboboxRef = useRef<HTMLDivElement>(null);

  // Memoize the schema to react to language changes
  const JobCreateSchema = useMemo(() => getJobCreateSchema(t), [t]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(JobCreateSchema) as Resolver<FormValues>,
    defaultValues: initialValues,
  });
  const createMutation = useCreateJobMutation();
  const selectedClientId = watch('client_id');
  const { clients, loading: clientsLoading } = useClients();
  const { properties, loading: propertiesLoading } = useProperties(selectedClientId || undefined);

  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients;
    const lower = clientSearch.toLowerCase();
    return clients.filter((c) => c.name.toLowerCase().includes(lower));
  }, [clients, clientSearch]);

  useEffect(() => {
    setValue('property_id', '');
  }, [selectedClientId, setValue]);

  useEffect(() => {
    const handleOutsideMouseDown = (e: MouseEvent) => {
      if (clientComboboxRef.current && !clientComboboxRef.current.contains(e.target as Node)) {
        setClientOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideMouseDown);
    return () => document.removeEventListener('mousedown', handleOutsideMouseDown);
  }, []);

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);

    if (!user?.id) {
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
      await createMutation.mutateAsync(parsed.data);
      reset(initialValues);
      navigate('/jobs');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('jobs.create.errors.generic');
      setSubmitError(message);
    }
  };

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <header>
        <h2 className="text-lg font-semibold text-slate-900">{t('jobs.create.title')}</h2>
      </header>

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
            <Controller
              control={control}
              name="client_id"
              render={({ field }) => {
                const selectedClient = clients.find((c) => c.id === field.value);
                return (
                  <div ref={clientComboboxRef} className="relative">
                    <input
                      id="client_id"
                      type="text"
                      autoComplete="off"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      placeholder={clientsLoading ? t('common.processing') : t('clients.list.search')}
                      value={clientOpen ? clientSearch : (selectedClient?.name ?? '')}
                      onChange={(e) => {
                        setClientSearch(e.target.value);
                        if (field.value) field.onChange('');
                        setClientOpen(true);
                      }}
                      onFocus={() => {
                        setClientSearch('');
                        setClientOpen(true);
                      }}
                    />
                    {clientOpen && (
                      <ul
                        role="listbox"
                        className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                      >
                        {filteredClients.map((client) => (
                          <li key={client.id} role="option" aria-selected={client.id === field.value}>
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50"
                              onClick={() => {
                                field.onChange(client.id);
                                setClientSearch('');
                                setClientOpen(false);
                              }}
                            >
                              {client.name}
                            </button>
                          </li>
                        ))}
                        {filteredClients.length === 0 && (
                          <li role="option" aria-selected={false}>
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50"
                              onClick={() => navigate('/clients/new')}
                            >
                              {t('clients.list.newClient')}
                            </button>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                );
              }}
            />
            {errors.client_id?.message ? (
              <p className="text-xs text-red-600">{errors.client_id.message}</p>
            ) : null}
          </div>

          {selectedClientId ? (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-800" htmlFor="property_id">
                {t('jobs.create.labels.propertyId')}
              </label>
              <Controller
                control={control}
                name="property_id"
                render={({ field }) => (
                  <select
                    id="property_id"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    {...field}
                  >
                    <option value="">
                      {propertiesLoading ? t('common.processing') : t('jobs.create.labels.propertyId')}
                    </option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.address_line1}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.property_id?.message ? (
                <p className="text-xs text-red-600">{errors.property_id.message}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-800" htmlFor="description">
              {t('jobs.create.labels.description')}
            </label>
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
            disabled={isSubmitting || createMutation.isPending}
          >
            {isSubmitting || createMutation.isPending
              ? t('jobs.create.actions.submitting')
              : t('jobs.create.actions.submit')}
          </button>
        </div>
      </form>
    </section>
  );
};

export default CreateJobForm;
