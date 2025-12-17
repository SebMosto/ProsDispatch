import { useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { CANADIAN_PROVINCES, ClientAndPropertySchema } from '../../schemas/client';

type FormValues = z.infer<typeof ClientAndPropertySchema>;

const TEXT = {
  title: 'Create client & property',
  subtitle: 'Capture client details and link their primary property.',
  action: 'Save client',
  success: 'Client and property saved.',
  typeLabel: 'Client type',
  type: {
    individual: 'Individual',
    business: 'Business',
  },
  nameLabel: 'Name',
  emailLabel: 'Email (optional)',
  languageLabel: 'Preferred language',
  languageOptions: {
    en: 'English',
    fr: 'Français',
  },
  addressHeading: 'Property address',
  addressLine1: 'Address line 1',
  addressLine2: 'Address line 2 (optional)',
  city: 'City',
  province: 'Province',
  postalCode: 'Postal code',
  nickname: 'Property nickname (optional)',
  loading: 'Saving...',
  errors: {
    generic: 'Unable to save client.',
    missingClient: 'Client record missing.',
  },
};

const CreateClientForm: React.FC = () => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const db = supabase as unknown as SupabaseClient;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(ClientAndPropertySchema),
    defaultValues: {
      type: 'individual',
      name: '',
      email: '',
      preferred_language: 'en',
      address_line1: '',
      address_line2: '',
      city: '',
      province: 'QC',
      postal_code: '',
      nickname: '',
    },
  });

  const selectedType = watch('type');

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const { data: clientData, error: clientError } = await db
        .from('clients')
        .insert({
          type: values.type,
          name: values.name,
          email: values.email || null,
          preferred_language: values.preferred_language,
        })
        .select('id')
        .single();

      if (clientError) {
        throw clientError;
      }

      const clientId = clientData?.id;
      if (!clientId) {
        throw new Error(TEXT.errors.missingClient);
      }

      const { error: propertyError } = await db.from('properties').insert({
        client_id: clientId,
        address_line1: values.address_line1,
        address_line2: values.address_line2 || null,
        city: values.city,
        province: values.province,
        postal_code: values.postal_code,
        nickname: values.nickname || null,
      });

      if (propertyError) {
        throw propertyError;
      }

      setSubmitSuccess(TEXT.success);
      reset();
    } catch (error) {
      const message = error instanceof Error ? error.message : TEXT.errors.generic;
      setSubmitError(message);
    }
  };

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900">{TEXT.title}</h2>
        <p className="text-sm text-slate-600">{TEXT.subtitle}</p>
      </header>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-1">
          <span className="block text-sm font-medium text-slate-800">{TEXT.typeLabel}</span>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label={TEXT.typeLabel}>
            {(['individual', 'business'] as const).map((option) => (
              <button
                key={option}
                type="button"
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  selectedType === option
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-800'
                }`}
                onClick={() => setValue('type', option)}
              >
                {TEXT.type[option]}
              </button>
            ))}
          </div>
          {errors.type?.message ? (
            <p className="text-xs text-red-600">{errors.type.message}</p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-800" htmlFor="name">
            {TEXT.nameLabel}
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
            {TEXT.emailLabel}
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
            {TEXT.languageLabel}
          </label>
          <select
            id="preferred_language"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            {...register('preferred_language')}
          >
            <option value="en">{TEXT.languageOptions.en}</option>
            <option value="fr">{TEXT.languageOptions.fr}</option>
          </select>
          {errors.preferred_language?.message ? (
            <p className="text-xs text-red-600">{errors.preferred_language.message}</p>
          ) : null}
        </div>

        <div className="space-y-1">
          <span className="block text-sm font-medium text-slate-800">{TEXT.addressHeading}</span>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700" htmlFor="address_line1">
                {TEXT.addressLine1}
              </label>
              <input
                id="address_line1"
                type="text"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                {...register('address_line1')}
              />
              {errors.address_line1?.message ? (
                <p className="text-xs text-red-600">{errors.address_line1.message}</p>
              ) : null}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700" htmlFor="address_line2">
                {TEXT.addressLine2}
              </label>
              <input
                id="address_line2"
                type="text"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                {...register('address_line2')}
              />
              {errors.address_line2?.message ? (
                <p className="text-xs text-red-600">{errors.address_line2.message}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700" htmlFor="city">
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
                <label className="block text-xs font-medium text-slate-700" htmlFor="province">
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
                {errors.province?.message ? (
                  <p className="text-xs text-red-600">{errors.province.message}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700" htmlFor="postal_code">
                {TEXT.postalCode}
              </label>
              <input
                id="postal_code"
                type="text"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                {...register('postal_code')}
              />
              {errors.postal_code?.message ? (
                <p className="text-xs text-red-600">{errors.postal_code.message}</p>
              ) : null}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700" htmlFor="nickname">
                {TEXT.nickname}
              </label>
              <input
                id="nickname"
                type="text"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                {...register('nickname')}
              />
              {errors.nickname?.message ? (
                <p className="text-xs text-red-600">{errors.nickname.message}</p>
              ) : null}
            </div>
          </div>
        </div>

        {submitError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {submitError}
          </div>
        ) : null}

        {submitSuccess ? (
          <div
            className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
            role="status"
          >
            {submitSuccess}
          </div>
        ) : null}

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
