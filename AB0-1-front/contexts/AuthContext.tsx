'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User, authApi, companyAccessApi } from '@/lib/api';
import { authClient } from '@/lib/authClient';
import { identify, track } from '@/lib/analytics';
import { getApiErrorMessage } from '@/lib/api-error';

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
    checkAuth();
  }, []);

  // Track identity when user changes
  useEffect(() => {
    if (user?.id) {
      identify(String(user.id), {
        email: user.email,
        name: user.name,
        role: user.role,
        company_id: user.company_id ? String(user.company_id) : undefined
      });
    }
  }, [user]);

  async function checkAuth(): Promise<User | null> {
    const requestId = nextAuthRequest();
    setLoading(true);
    setError(null);
    console.log('[AuthContext] Checking authentication...');
    try {
      // Try to fetch user data
      const userData = await authApi.me();
      console.log('[AuthContext] Auth check result:', userData ? `User found (ID: ${userData.id}, Role: ${userData.role})` : 'No user found');
      if (requestId === authRequestId.current) {
        setUser(userData || null);
      }
      return userData || null;
    } catch (error) {
      console.error('[AuthContext] Error checking auth:', error);
      if (requestId === authRequestId.current) {
        setUser(null);
        setError(getApiErrorMessage(error, 'Falha ao validar sessão.'));
      }
      return null;
    } finally {
      if (requestId === authRequestId.current) {
        setLoading(false);
      }
    }
  }

  const routeAfterLogin = async (nextUser: User) => {
    console.log('[AuthContext] Routing user after login:', { id: nextUser.id, role: nextUser.role });
    if (!nextUser) {
      console.error('[AuthContext] routeAfterLogin called with null user');
      return;
    }

    if (nextUser.role === 'review') {
      console.log('[AuthContext] Review user detected, redirecting to /review-dashboard');
      router.push('/review-dashboard');
      return;
    }

    if (nextUser.role === 'company') {
      try {
        const context = await companyAccessApi.context();
        const active = context?.active_memberships || [];
        if (active.length > 0) {
          const companyId = active[0].company_id;
          try {
            await companyAccessApi.selectActiveCompany(companyId);
          } catch (error) {
            console.warn('[Auth] Failed to persist active company selection', error);
          }
          setUser((prev) => (prev ? { ...prev, company_id: companyId } : prev));
          router.push(`/company-dashboard?company_id=${companyId}`);
        } else {
          router.push('/select-company');
        }
        return;
      } catch (error) {
        console.error('[Auth] Failed to load company access context:', error);
        router.push('/select-company');
        return;
      }
    }

    router.push('/');
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Attempting login for:', email);
      nextAuthRequest();
      setError(null);
      const response: any = await authApi.login(email, password);

      // Explicitly check for user in response or fetch it
      const nextUser: User | null = response?.user || (await checkAuth());
      
      if (nextUser) {
        console.log('[AuthContext] Login successful, user:', { id: nextUser.id, role: nextUser.role });
        setUser(nextUser);
        track('Login Completed', { method: 'email' });
        
        // Wait for state update and cookies to settle
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await routeAfterLogin(nextUser);
      } else {
        console.error('[AuthContext] Login succeeded but no user data found');
        throw new Error('Falha ao obter dados do usuário após login.');
      }
    } catch (error) {
      console.error('[AuthContext] Login failed:', error);
      setError(getApiErrorMessage(error, 'Falha ao entrar. Verifique suas credenciais.'));
      throw error;
    }
  };

  const signInWithLinkedIn = async () => {
    try {
      nextAuthRequest();
      await authClient.signIn.social({ provider: 'linkedin' });
      // After successful social login, the user is redirected back.
      // The checkAuth function will be triggered on page load to fetch user data.
      const nextUser = await checkAuth();
      if (nextUser) {
        await routeAfterLogin(nextUser);
      }
    } catch (error) {
      console.error('[Auth] LinkedIn sign-in failed', error);
      setError('LinkedIn sign-in failed');
      throw error;
    }
  };

  const logout = async () => {
    nextAuthRequest();
    track('Logout Performed');
    await authApi.logout();
    setUser(null);
    setError(null);
    setLoading(false);
    // No need to clear localStorage anymore
  };

  const refreshAuth = async (): Promise<boolean> => {
    const nextUser = await checkAuth();
    return !!nextUser;
  };

  return (
    <AuthContext.Provider value={{
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
    }}>
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
