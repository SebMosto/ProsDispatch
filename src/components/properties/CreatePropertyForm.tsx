import { useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import type { z } from 'zod';
import SyncBadge, { type SyncBadgeState } from '../system/SyncBadge';
import AddressAutocomplete, { type AddressSelection } from '../ui/AddressAutocomplete';
import { usePersistentForm } from '../../persistence/usePersistentForm';
import { useNetworkStatus } from '../../lib/network';
import { useAuth } from '../../lib/auth';
import { CANADIAN_PROVINCES, PropertySchema } from '../../schemas/property';
import { propertyRepository } from '../../repositories/propertyRepository';

const DRAFT_STORAGE_KEY = 'property:create:draft';

type FormValues = z.infer<typeof PropertySchema>;

const initialValues: FormValues = {
  client_id: '',
  address_line1: '',
  address_line2: '',
  city: '',
  province: 'QC',
  postal_code: '',
  country: 'CA',
  nickname: '',
};

const TEXT = {
  title: 'Create property',
  subtitle: 'Add a property for an existing client.',
  action: 'Save property',
  loading: 'Saving...',
  errors: {
    generic: 'Unable to save property.',
    auth: 'You must be logged in to create a property.',
  },
  addressLine1: 'Address line 1',
  addressLine2: 'Address line 2 (optional)',
  city: 'City',
  province: 'Province',
  postalCode: 'Postal code',
  nickname: 'Property nickname (optional)',
  clientId: 'Client ID',
};

const CreatePropertyForm = () => {
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
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(PropertySchema),
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

  const syncState: SyncBadgeState = useMemo(() => {
    if (!draft.hydrated) return 'ONLINE_SYNCING';
    if (!isOnline) return 'OFFLINE_DRAFT';
    if (draft.draftStatus === 'saved_locally') return 'ONLINE_DRAFT_PENDING';
    return 'ONLINE_SYNCED';
  }, [draft.draftStatus, draft.hydrated, isOnline]);

  const applyAddressSelection = (selection: AddressSelection) => {
    setValue('address_line1', selection.address_line1);
    if (selection.city !== undefined) setValue('city', selection.city);
    if (selection.province !== undefined) setValue('province', selection.province as FormValues['province']);
    if (selection.postal_code !== undefined) setValue('postal_code', selection.postal_code);
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!user) {
      setSubmitError(TEXT.errors.auth);
      return;
    }

    const parsed = PropertySchema.safeParse({
      ...values,
      address_line2: values.address_line2 || undefined,
      nickname: values.nickname || undefined,
    });

    if (!parsed.success) {
      setSubmitError(parsed.error.issues[0]?.message ?? TEXT.errors.generic);
      return;
    }

    try {
      const result = await propertyRepository.create(parsed.data);
      if (result.error) {
        throw result.error;
      }
      setSubmitSuccess('Property saved.');
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
          <label className="block text-sm font-medium text-slate-800" htmlFor="client_id">
            {TEXT.clientId}
          </label>
          <input
            id="client_id"
            type="text"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            {...register('client_id')}
          />
          {errors.client_id?.message ? <p className="text-xs text-red-600">{errors.client_id.message}</p> : null}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-800" htmlFor="address_line1">
            {TEXT.addressLine1}
          </label>
          <Controller
            control={control}
            name="address_line1"
            render={({ field }) => (
              <AddressAutocomplete
                id="address_line1"
                value={field.value}
                onChange={field.onChange}
                onSelect={applyAddressSelection}
                placeholder="123 Main St"
              />
            )}
          />
          {errors.address_line1?.message ? <p className="text-xs text-red-600">{errors.address_line1.message}</p> : null}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-800" htmlFor="address_line2">
            {TEXT.addressLine2}
          </label>
          <input
            id="address_line2"
            type="text"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            {...register('address_line2')}
          />
          {errors.address_line2?.message ? <p className="text-xs text-red-600">{errors.address_line2.message}</p> : null}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-800" htmlFor="city">
              {TEXT.city}
            </label>
            <input
              id="city"
              type="text"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              {...register('city')}
            />
            {errors.city?.message ? <p className="text-xs text-red-600">{errors.city.message}</p> : null}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-800" htmlFor="province">
              {TEXT.province}
            </label>
            <select
              id="province"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              {...register('province')}
            >
              {CANADIAN_PROVINCES.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
            {errors.province?.message ? <p className="text-xs text-red-600">{errors.province.message}</p> : null}
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-800" htmlFor="postal_code">
            {TEXT.postalCode}
          </label>
          <input
            id="postal_code"
            type="text"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            {...register('postal_code')}
          />
          {errors.postal_code?.message ? <p className="text-xs text-red-600">{errors.postal_code.message}</p> : null}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-800" htmlFor="nickname">
            {TEXT.nickname}
          </label>
          <input
            id="nickname"
            type="text"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            {...register('nickname')}
          />
          {errors.nickname?.message ? <p className="text-xs text-red-600">{errors.nickname.message}</p> : null}
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

export default CreatePropertyForm;
