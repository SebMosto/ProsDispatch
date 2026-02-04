import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LoginSchema, RegisterSchema } from '@/schemas/auth';

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) {
    return err.message;
  }
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    return err.message;
  }
  return 'Unknown error';
};

export function useAuthActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (data: LoginSchema) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (data: RegisterSchema) => {
    setLoading(true);
    setError(null);
    try {
      const { error, data: authData } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            business_name: data.business_name,
          },
        },
      });
      if (error) throw error;

      // Profile creation is handled by Supabase Trigger (usually)
      // But if we need manual creation, we'd do it here.
      // For now, assuming trigger or subsequent profile completion step.
      return authData;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { signIn, signUp, loading, error };
}
