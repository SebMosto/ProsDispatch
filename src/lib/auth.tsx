import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from './router';
import { useTranslation } from 'react-i18next';
import type { Session, User } from '@supabase/supabase-js';
import type { Database, Tables } from '../types/database.types';
import { supabase } from './supabase';

interface AuthContextValue {
  user: User | null;
  profile: Tables<'profiles'> | null;
  loading: boolean;
  signOut: () => Promise<void>;
  session: Session | null;
  refreshProfile: () => Promise<void>;
  subscriptionStatus: string | null;
  isSubscribed: boolean;
  trialDaysRemaining: number;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const calculateTrialDaysRemaining = (endDate: string | null): number => {
  if (!endDate) {
    return 0;
  }

  const end = new Date(endDate).getTime();
  if (Number.isNaN(end)) {
    return 0;
  }

  const diff = end - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Tables<'profiles'> | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (currentUser: User) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    if (!error && data) {
      setProfile(data as Tables<'profiles'>);
    } else {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      const currentSession = data.session;
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser);
      }
      setLoading(false);
    };

    initializeAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);
      if (nextUser) {
        await fetchProfile(nextUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      signOut: async () => {
        await supabase.auth.signOut();
      },
      session,
      refreshProfile: async () => {
        if (user) {
          await fetchProfile(user);
        }
      },
      subscriptionStatus: profile?.subscription_status ?? null,
      isSubscribed: ['active', 'trialing'].includes(profile?.subscription_status ?? ''),
      trialDaysRemaining: calculateTrialDaysRemaining(profile?.subscription_end_date ?? null),
    }),
    [loading, profile, session, user, fetchProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading, isSubscribed } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  const ALLOWED_WITHOUT_SUBSCRIPTION = ['/subscribe', '/settings/billing', '/settings/stripe'];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
        <span className="text-sm text-slate-600">{t('auth.shared.loading')}</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isOnAllowedRoute = ALLOWED_WITHOUT_SUBSCRIPTION.some((route) =>
    location.pathname.startsWith(route),
  );

  // Pilot: set VITE_SUBSCRIPTION_GATE_ENABLED=true in Vercel env vars to re-enable post-pilot
  const subscriptionGateEnabled = import.meta.env.VITE_SUBSCRIPTION_GATE_ENABLED === 'true';
  if (subscriptionGateEnabled && !isSubscribed && !isOnAllowedRoute) {
    // Gate access to subscription-only areas of the contractor app
    return <Navigate to="/subscribe" replace />;
  }

  return <>{children}</>;
};

export type Profile = Database['public']['Tables']['profiles']['Row'];
