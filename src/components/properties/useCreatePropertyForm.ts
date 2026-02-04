import { useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';
import { usePersistentForm } from '../../persistence/usePersistentForm';
import { useNetworkStatus } from '../../lib/network';
import { useAuth } from '../../lib/auth';
import { getPropertySchema } from '../../schemas/property';
import { propertyRepository } from '../../repositories/propertyRepository';
import { type AddressSelection } from '../ui/AddressAutocomplete';
import { type SyncBadgeState } from '../system/SyncBadge';

const DRAFT_STORAGE_KEY = 'property:create:draft';

// We need a way to get the type without the function call.
// Since we don't have a static schema that matches the localized one exactly in terms of message keys but does in structure:
// We can use ReturnType of the function.
// But z.infer expects a ZodSchema instance.
// So we use a dummy t function to get the type or use the static fallback schema for type inference if it matches structure.
// Let's use the static fallback for type inference as it is safer and cleaner for now, assuming structure is identical.
import { PropertySchema as StaticPropertySchema } from '../../schemas/property';

export type FormValues = z.infer<typeof StaticPropertySchema>;

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

interface UseCreatePropertyFormProps {
  clientId?: string;
}

export const useCreatePropertyForm = ({ clientId }: UseCreatePropertyFormProps) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const baseValues = useMemo<FormValues>(() => ({
    ...initialValues,
    client_id: clientId ?? initialValues.client_id,
  }), [clientId]);

  const draft = usePersistentForm<FormValues>({
    storageKey: DRAFT_STORAGE_KEY,
    initialValues: baseValues,
  });

  const hasAppliedDraft = useRef(false);

  const PropertySchema = useMemo(() => getPropertySchema(t), [t]);

  const formMethods = useForm<FormValues>({
    resolver: zodResolver(PropertySchema),
    defaultValues: draft.values,
  });

  const {
    reset,
    watch,
    setValue,
    clearErrors,
    trigger,
    formState: { errors },
  } = formMethods;

  // Re-validate when language changes to update error messages
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps -- errors is intentionally omitted to prevent re-validation loops
    const hasErrors = Object.keys(errors).length > 0;
    if (hasErrors) {
      clearErrors();
      trigger().catch(() => {
        // Validation errors are expected and will be shown in the UI
      });
    }
  }, [i18n.language, clearErrors, trigger]);

  useEffect(() => {
    if (!draft.hydrated || hasAppliedDraft.current) return;
    reset(draft.values);
    hasAppliedDraft.current = true;
  }, [draft.values, draft.hydrated, reset]);

  useEffect(() => {
    if (!clientId || !draft.hydrated) return;
    setValue('client_id', clientId);
  }, [clientId, draft.hydrated, setValue]);

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
      setSubmitError(t('properties.create.errors.auth'));
      return;
    }

    const parsed = PropertySchema.safeParse({
      ...values,
      address_line2: values.address_line2 || undefined,
      nickname: values.nickname || undefined,
    });

    if (!parsed.success) {
      setSubmitError(parsed.error.issues[0]?.message ?? t('properties.create.errors.generic'));
      return;
    }

    try {
      const result = await propertyRepository.create(parsed.data);
      if (result.error) {
        throw result.error;
      }
      setSubmitSuccess(t('properties.create.statuses.success'));
      await draft.clearDraft();
      reset(baseValues);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('properties.create.errors.generic');
      setSubmitError(message);
    }
  };

  return {
    formMethods,
    syncState,
    submitError,
    submitSuccess,
    applyAddressSelection,
    onSubmit,
  };
};
