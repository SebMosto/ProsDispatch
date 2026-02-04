import { useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { usePersistentForm } from '../../persistence/usePersistentForm';
import { useNetworkStatus } from '../../lib/network';
import { useAuth } from '../../lib/auth';
import { PropertySchema } from '../../schemas/mvp1/property';
import { propertyRepository } from '../../repositories/propertyRepository';
import { type AddressSelection } from '../ui/AddressAutocomplete';
import { type SyncBadgeState } from '../system/SyncBadge';

const DRAFT_STORAGE_KEY = 'property:create:draft';

export type FormValues = z.infer<typeof PropertySchema>;

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

export const TEXT = {
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

interface UseCreatePropertyFormProps {
  clientId?: string;
}

export const useCreatePropertyForm = ({ clientId }: UseCreatePropertyFormProps) => {
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

  const formMethods = useForm<FormValues>({
    resolver: zodResolver(PropertySchema),
    defaultValues: draft.values,
  });

  const {
    reset,
    watch,
    setValue,
  } = formMethods;

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
      reset(baseValues);
    } catch (error) {
      const message = error instanceof Error ? error.message : TEXT.errors.generic;
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
