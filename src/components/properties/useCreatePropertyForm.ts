import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type Resolver } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';
import { useAuth } from '../../lib/auth';
import { useNavigate } from '../../lib/router';
import { getPropertySchema } from '../../schemas/property';
import { propertyRepository } from '../../repositories/propertyRepository';
import { type AddressSelection } from '../ui/AddressAutocomplete';

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
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const baseValues = useMemo<FormValues>(() => ({
    ...initialValues,
    client_id: clientId ?? initialValues.client_id,
  }), [clientId]);

  const PropertySchema = useMemo(() => getPropertySchema(t), [t]);

  const formMethods = useForm<FormValues>({
    resolver: zodResolver(PropertySchema) as Resolver<FormValues>,
    defaultValues: baseValues,
  });

  const {
    reset,
    setValue,
  } = formMethods;

  useEffect(() => {
    if (!clientId) return;
    setValue('client_id', clientId);
  }, [clientId, setValue]);

  const applyAddressSelection = (selection: AddressSelection) => {
    setValue('address_line1', selection.address_line1);
    if (selection.city !== undefined) setValue('city', selection.city);
    if (selection.province !== undefined) setValue('province', selection.province as FormValues['province']);
    if (selection.postal_code !== undefined) setValue('postal_code', selection.postal_code);
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);

    if (!user?.id) {
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
      const result = await propertyRepository.create(parsed.data, user.id).catch((error: unknown) => {
        console.error('useCreatePropertyForm: propertyRepository.create failed', error);
        throw error;
      });
      if (result.error) {
        throw result.error;
      }
      reset(baseValues);
      navigate(`/clients/${parsed.data.client_id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('properties.create.errors.generic');
      setSubmitError(message);
    }
  };

  return {
    formMethods,
    submitError,
    applyAddressSelection,
    onSubmit,
  };
};
