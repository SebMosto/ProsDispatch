import type { z } from 'zod';
import type { Resolver } from './react-hook-form';

type ResolverError = {
  type: string;
  message?: string;
};

export const zodResolver =
  <TSchema extends z.ZodTypeAny>(schema: TSchema): Resolver<z.infer<TSchema>> =>
  async (values) => {
    const parsed = schema.safeParse(values);

    if (parsed.success) {
      return { values: parsed.data, errors: {} };
    }

    const fieldErrors = parsed.error.issues.reduce<Record<string, ResolverError>>((acc, issue) => {
      const key = issue.path.join('.');
      if (!key) return acc;

      acc[key] = {
        type: issue.code,
        message: issue.message,
      };

      return acc;
    }, {});

    return {
      values: {} as z.infer<TSchema>,
      errors: fieldErrors,
    };
  };
