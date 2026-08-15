'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as Sentry from '@sentry/nextjs';

import {
  User,
  authApi,
  clearAuthSessionHint,
  companyAccessApi,
  hasPossibleAuthSession,
  setAuthSessionHint,
  reviewerProfileApi,
} from '@/lib/api';
import { getApiOrigin } from '@/lib/api-config';
import { identify, track, reset } from '@/lib/analytics/lazy';
import { handleUserIdentified } from '@/lib/analytics/identity-stitch';
import { getSessionId } from '@/lib/analytics/session';
import { getApiErrorMessage } from '@/lib/api-error';
import { logError } from '@/lib/error-handler';
import { resolvePostAuthDestination } from '@/lib/auth/post-auth-destination';
import { clearRealtimeAuthToken, setRealtimeAuthToken } from '@/lib/realtime-auth';
import { invalidateAnalyticsAvailability } from '@/lib/api-analytics';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  getPostLoginDestination: (user: User, returnTo?: string | null) => Promise<string>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signInWithLinkedIn: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string, passwordConfirmation?: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  refreshAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isAuthenticated = !!user;
  const authRequestId = useRef(0);
  const stitchedIdentitySignature = useRef<string | null>(null);

  const nextAuthRequest = () => {
    authRequestId.current += 1;
    return authRequestId.current;
  };

  useEffect(() => {
    if (user?.id) {
      const sessionId = getSessionId();
      const companyId = user.company_id ? String(user.company_id) : undefined;
      const trackedAt = new Date().toISOString();
      const stitchSignature = [String(user.id), companyId ?? '', sessionId].join(':');

      if (typeof window !== 'undefined') {
        const isAdmin = user.role === 'admin';
        const isEmployee = user.email?.endsWith('@avaliasolar.com.br');
        if (isAdmin) localStorage.setItem('is_admin_user', 'true');
        if (isEmployee) localStorage.setItem('is_employee_user', 'true');
        if (isAdmin || isEmployee) localStorage.setItem('is_internal_team', 'true');
      }

      if (stitchedIdentitySignature.current !== stitchSignature) {
        stitchedIdentitySignature.current = stitchSignature;
        void handleUserIdentified({
          id: String(user.id),
          role: user.role,
          company_id: companyId,
          session_id: sessionId,
          tracked_at: trackedAt,
        }).catch((stitchError) => {
          logError(stitchError instanceof Error ? stitchError : new Error(String(stitchError)), {
            action: 'identity_stitch_failed',
            metadata: { user_id: user.id, company_id: companyId, session_id: sessionId },
          });
        });
      }

      identify(String(user.id), {
        role: user.role,
        company_id: companyId,
      });

      Sentry.setUser({
        id: String(user.id),
        role: user.role,
      });
    } else {
      stitchedIdentitySignature.current = null;
      Sentry.setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('is_admin_user');
        localStorage.removeItem('is_employee_user');
        localStorage.removeItem('is_internal_team');
      }
    }
  }, [user]);

  const checkAuth = useCallback(async (): Promise<User | null> => {
    const requestId = nextAuthRequest();
    setLoading(true);
    setError(null);

    try {
      const userData = await authApi.me();
      if (requestId === authRequestId.current) {
        setUser(userData || null);
        if (userData) {
          setAuthSessionHint();
        } else {
          clearAuthSessionHint();
        }
      }
      return userData || null;
    } catch (authError) {
      if (requestId === authRequestId.current) {
        invalidateAnalyticsAvailability();
        setUser(null);
        setError(getApiErrorMessage(authError, 'Falha ao validar sessao.'));
        clearAuthSessionHint();
        clearRealtimeAuthToken();
      }
      return null;
    } finally {
      if (requestId === authRequestId.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  const getPostLoginDestination = async (nextUser: User, returnTo?: string | null) => {
    if (nextUser.role === 'company') {
      try {
        const context = await companyAccessApi.context(undefined, {
          retries: 5,
          timeout: 25000,
          useClientCache: true,
        });
        const active = context?.active_memberships || [];
        if (active.length > 0) {
          const companyId = active[0].company_id;
          try {
            await companyAccessApi.selectActiveCompany(companyId);
          } catch {
            // noop
          }
          setUser((prev) => (prev ? { ...prev, company_id: companyId } : prev));
          return resolvePostAuthDestination({
            user: nextUser,
            returnTo,
            activeCompanyId: companyId,
          });
        }
      } catch (routeError) {
        logError(routeError instanceof Error ? routeError : new Error(String(routeError)), {
          action: 'company_context_route_after_login_failed',
          metadata: { user_id: nextUser.id },
        });
      }
    }
    if (nextUser.role === 'review') {
      try {
        const profileResponse = await reviewerProfileApi.get();
        const profile = profileResponse?.profile;
        return resolvePostAuthDestination({
          user: nextUser,
          returnTo,
          creatorEnabled: profile?.creator_enabled,
          creatorSlug: profile?.public_slug,
        });
      } catch (profileError) {
        logError(profileError instanceof Error ? profileError : new Error(String(profileError)), {
          action: 'creator_profile_route_after_login_failed',
          metadata: { user_id: nextUser.id },
        });
      }
    }
    return resolvePostAuthDestination({
      user: nextUser,
      returnTo,
    });
  };

  const login = async (email: string, password: string) => {
    try {
      nextAuthRequest();
      setError(null);
      const response = await authApi.login(email, password);
      setRealtimeAuthToken(response?.token);
      const nextUser: User | null = response.user || (await checkAuth());

      if (!nextUser) {
        throw new Error('Falha ao obter dados do usuario apos login.');
      }

      setUser(nextUser);
      setAuthSessionHint();
      track('login_completed', { method: 'email' });
      return nextUser;
    } catch (loginError) {
      logError(loginError instanceof Error ? loginError : new Error(String(loginError)), {
        action: 'login_failed',
        metadata: { method: 'email' },
      });
      setError(getApiErrorMessage(loginError, 'Falha ao entrar. Verifique suas credenciais.'));
      throw loginError;
    }
  };

  const signInWithGoogle = async () => {
    const railsOrigin = getApiOrigin();
    window.location.href = `${railsOrigin}/users/auth/google_oauth2`;
  };

  const signInWithFacebook = async () => {
    const railsOrigin = getApiOrigin();
    window.location.href = `${railsOrigin}/users/auth/facebook`;
  };

  const signInWithLinkedIn = async () => {
    const railsOrigin = getApiOrigin();
    window.location.href = `${railsOrigin}/users/auth/linkedin`;
  };

  const logout = async () => {
    nextAuthRequest();
    invalidateAnalyticsAvailability();
    track('Logout Performed');
    reset();
    await authApi.logout();
    clearAuthSessionHint();
    clearRealtimeAuthToken();
    setUser(null);
    setError(null);
    setLoading(false);
  };

  const refreshAuth = async (): Promise<boolean> => {
    const nextUser = await checkAuth();
    return !!nextUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated,
        login,
        getPostLoginDestination,
        logout,
        signInWithGoogle,
        signInWithFacebook,
        signInWithLinkedIn,
        forgotPassword: (email: string) => authApi.forgotPassword(email),
        resetPassword: (token: string, password: string, passwordConfirmation?: string) =>
          authApi.resetPassword(token, password, passwordConfirmation),
        resendConfirmation: (email: string) => authApi.resendConfirmation(email),
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
