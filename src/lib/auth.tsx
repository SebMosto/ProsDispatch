import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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

const KNOWN_STATUSES_SET = new Set(['active', 'trialing', 'canceled', 'past_due', 'unpaid', 'paused']);

// Pilot: unknown/incomplete Stripe statuses default to trialing
// eslint-disable-next-line react-refresh/only-export-components
export const normalizeSubscriptionStatus = (status: string | null | undefined): string | null => {
  if (!status) return null;
  if (status === 'incomplete' || status === 'incomplete_expired') return null;
  if (!KNOWN_STATUSES_SET.has(status)) return 'trialing';
  return status;
};

// eslint-disable-next-line react-refresh/only-export-components
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
  const profileRequestIdRef = useRef(0);

  const fetchProfile = useCallback(async (currentUser: User) => {
    const requestId = ++profileRequestIdRef.current;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      if (!error && data) {
        if (requestId === profileRequestIdRef.current) {
          setProfile(data as Tables<'profiles'>);
        }
      } else {
        if (requestId === profileRequestIdRef.current) {
          setProfile(null);
        }
      }
    } catch {
      if (requestId === profileRequestIdRef.current) {
        setProfile(null);
      }
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        const currentSession = data.session;
        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          void fetchProfile(currentUser);
        } else {
          profileRequestIdRef.current += 1;
          setProfile(null);
        }
      } catch {
        setUser(null);
        setSession(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // onAuthStateChange handles silent background session updates only.
    // Loading state is managed exclusively by initializeAuth above.
    // Removing setLoading from this listener prevents:
    //   1. UI hang after mutations (re-triggering loading on every SIGNED_IN event)
    //   2. Race condition where finally fires before initializeAuth completes
    // Per Gemini + Codex review, 2026-03-23.
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      // INITIAL_SESSION is handled by initializeAuth above.
      // Processing it here risks firing after loading=false (with a null session during
      // token refresh), which sets user=null and triggers a /login redirect.
      if (event === 'INITIAL_SESSION') return;

      if ((event as string) === 'TOKEN_REFRESH_FAILED') {
        // GoTrue fires this with null session even when the access token is still valid.
        // Do not null the user — silently re-check the actual session state instead.
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          // Access token is still valid — keep user state, do nothing.
          return;
        }
        // Session is genuinely gone — fall through to setUser(null) below.
      }

      try {
        setSession(nextSession);
        const nextUser = nextSession?.user ?? null;
        setUser(nextUser);
        if (nextUser) {
          void fetchProfile(nextUser);
        } else {
          profileRequestIdRef.current += 1;
          setProfile(null);
        }
      } catch {
        setProfile(null);
      }
    });

    const loadingSafetyTimeout = window.setTimeout(() => {
      setLoading((currentLoading) => (currentLoading ? false : currentLoading));
    }, 5000);

    return () => {
      listener?.subscription.unsubscribe();
      window.clearTimeout(loadingSafetyTimeout);
    };
  }, [fetchProfile]);

  const value = useMemo(() => {
    const normalizedStatus = normalizeSubscriptionStatus(profile?.subscription_status);
    return {
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
      subscriptionStatus: normalizedStatus,
      isSubscribed: ['active', 'trialing'].includes(normalizedStatus ?? ''),
      trialDaysRemaining: calculateTrialDaysRemaining(profile?.subscription_end_date ?? null),
    };
  }, [loading, profile, session, user, fetchProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
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
