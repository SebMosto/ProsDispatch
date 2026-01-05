import type React from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';

type FieldValue = string | number | boolean | Date | undefined | null;

export type FieldError = { message?: string };
export type FieldErrors = Record<string, FieldError>;

export type Resolver<TFieldValues> = (
  values: TFieldValues
) =>
  | Promise<{ values?: TFieldValues; errors?: FieldErrors }>
  | { values?: TFieldValues; errors?: FieldErrors };

export type SubmitHandler<TFieldValues extends Record<string, FieldValue>> = (
  values: TFieldValues,
  event?: unknown
) => void | Promise<void>;

type UseFormProps<TFieldValues extends Record<string, FieldValue>> = {
  defaultValues?: Partial<TFieldValues>;
  resolver?: Resolver<TFieldValues>;
};

type ChangeEvent =
  | React.ChangeEvent<HTMLInputElement>
  | React.ChangeEvent<HTMLSelectElement>
  | React.ChangeEvent<HTMLTextAreaElement>;

export const useForm = <TFieldValues extends Record<string, FieldValue>>(
  props: UseFormProps<TFieldValues> = {}
) => {
  const resolverRef = useRef(props.resolver);
  const initialValues = useMemo(
    () => ({ ...((props.defaultValues ?? {}) as TFieldValues) }),
    [props.defaultValues]
  );
  const [values, setValues] = useState<TFieldValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback(
    (name: keyof TFieldValues, value: FieldValue) => {
      setValues((previous) => ({
        ...previous,
        [name]: value,
      }));
    },
    []
  );

  const register = useCallback(
    (name: keyof TFieldValues) => {
      const fieldName = name as string;
      return {
        name: fieldName,
        value: (values[fieldName] ?? '') as string | number | readonly string[],
        onChange: (event: ChangeEvent) => setValue(fieldName as keyof TFieldValues, event.target.value),
      };
    },
    [setValue, values]
  );

  const reset = useCallback(
    (nextValues?: Partial<TFieldValues>) => {
      setValues({
        ...initialValues,
        ...(nextValues as TFieldValues),
      });
      setErrors({});
    },
    [initialValues]
  );

  const handleSubmit = useCallback(
    (onValid: SubmitHandler<TFieldValues>) =>
      async (event?: React.FormEvent<HTMLFormElement>) => {
        event?.preventDefault?.();
        setIsSubmitting(true);

        const resolver = resolverRef.current;
        if (resolver) {
          const result = await resolver(values);
          setErrors(result.errors ?? {});

          const hasErrors = result.errors && Object.keys(result.errors).length > 0;
          if (hasErrors) {
            setIsSubmitting(false);
            return;
          }

          await onValid((result.values as TFieldValues) ?? values, event);
          setIsSubmitting(false);
          return;
        }

        await onValid(values, event);
        setIsSubmitting(false);
      },
    [values]
  );

  const watch = useCallback(
    (name?: keyof TFieldValues) => {
      if (name) {
        return values[name as string];
      }
      return values;
    },
    [values]
  );

  return useMemo(
    () => ({
      register,
      handleSubmit,
      reset,
      setValue,
      watch,
      formState: {
        errors,
        isSubmitting,
      },
    }),
    [errors, handleSubmit, isSubmitting, register, reset, setValue, watch]
  );
};

export type UseFormReturn<TFieldValues extends Record<string, FieldValue>> = ReturnType<typeof useForm<TFieldValues>>;
