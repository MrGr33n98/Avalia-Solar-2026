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
import { authClient } from '@/lib/authClient';
import { identify, track } from '@/lib/analytics/lazy';
import { getApiErrorMessage } from '@/lib/api-error';
import { logError } from '@/lib/error-handler';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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

  const nextAuthRequest = () => {
    authRequestId.current += 1;
    return authRequestId.current;
  };

  useEffect(() => {
    if (user?.id) {
      identify(String(user.id), {
        email: user.email,
        name: user.name,
        role: user.role,
        company_id: user.company_id ? String(user.company_id) : undefined,
      });

      Sentry.setUser({
        id: String(user.id),
        email: user.email,
        username: user.name,
        role: user.role,
      });
    } else {
      Sentry.setUser(null);
    }
  }, [user]);

  const checkAuth = useCallback(async (): Promise<User | null> => {
    if (typeof window !== 'undefined' && !hasPossibleAuthSession()) {
      setUser(null);
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
          router.push(`/company-dashboard?company_id=${companyId}`);
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
        metadata: { email },
      });
      setError(getApiErrorMessage(loginError, 'Falha ao entrar. Verifique suas credenciais.'));
      throw loginError;
    }
  };

  const signInWithLinkedIn = async () => {
    try {
      nextAuthRequest();
      await authClient.signIn.social({ provider: 'linkedin' });
      const nextUser = await checkAuth();
      if (nextUser) {
        setAuthSessionHint();
        await routeAfterLogin(nextUser);
      }
    } catch (socialError) {
      setError('LinkedIn sign-in failed');
      throw socialError;
    }
  };

  const logout = async () => {
    nextAuthRequest();
    track('Logout Performed');
    await authApi.logout();
    clearAuthSessionHint();
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
