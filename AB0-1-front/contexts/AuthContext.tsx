'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Sentry from '@sentry/nextjs';

import {
  User,
  authApi,
  clearAuthSessionHint,
  companyAccessApi,
  hasPossibleAuthSession,
  setAuthSessionHint,
} from '@/lib/api';
import { getApiOrigin } from '@/lib/api-config';
import { identify, track, reset } from '@/lib/analytics/lazy';
import { handleUserIdentified } from '@/lib/analytics/identity-stitch';
import { getSessionId } from '@/lib/analytics/session';
import { getApiErrorMessage } from '@/lib/api-error';
import { logError } from '@/lib/error-handler';
import { clearRealtimeAuthToken, setRealtimeAuthToken } from '@/lib/realtime-auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
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
  const router = useRouter();
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
    }
  }, [user]);

  const checkAuth = useCallback(async (): Promise<User | null> => {
    if (typeof window !== 'undefined' && !hasPossibleAuthSession()) {
      setUser(null);
      clearRealtimeAuthToken();
      setLoading(false);
      return null;
    }

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

  const routeAfterLogin = async (nextUser: User) => {
    if (!nextUser) return;

    if (nextUser.role === 'review') {
      router.push('/review-dashboard');
      return;
    }

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
          router.push(`/dashboard?company_id=${companyId}`);
        } else {
          router.push('/select-company');
        }
        return;
      } catch (routeError) {
        logError(routeError instanceof Error ? routeError : new Error(String(routeError)), {
          action: 'company_context_route_after_login_failed',
          metadata: { user_id: nextUser.id },
        });
        router.push('/select-company');
        return;
      }
    }

    router.push('/');
  };

  const login = async (email: string, password: string) => {
    try {
      nextAuthRequest();
      setError(null);
      const response: any = await authApi.login(email, password);
      setRealtimeAuthToken(response?.token);
      const nextUser: User | null = response?.user || (await checkAuth());

      if (!nextUser) {
        throw new Error('Falha ao obter dados do usuario apos login.');
      }

      setUser(nextUser);
      setAuthSessionHint();
      track('Login Completed', { method: 'email' });
      await new Promise((resolve) => setTimeout(resolve, 100));
      await routeAfterLogin(nextUser);
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
