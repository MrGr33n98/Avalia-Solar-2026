'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, authApi, companyAccessApi } from '@/lib/api';
import { authClient } from '@/lib/authClient';
import { identify, track } from '@/lib/analytics';

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
        company_id: user.company_id
      });
    }
  }, [user]);

  async function checkAuth(): Promise<User | null> {
    try {
      // Try to fetch user data without checking localStorage
      const userData = await authApi.me();
      setUser(userData || null);
      return userData || null;
    } catch (error) {
      console.error('[Auth] Failed to fetch user data:', error);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }

  const routeAfterLogin = async (nextUser: User) => {
    if (!nextUser) return;

    if (nextUser.role === 'review') {
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
      const response: any = await authApi.login(email, password);

      const nextUser: User | null = response?.user || (await checkAuth());
      if (nextUser) {
        setUser(nextUser);
        track('Login Completed', { method: 'email' });
        await routeAfterLogin(nextUser);
      }
    } catch (error) {
      console.error('[Auth] Login failed', error);
      throw error;
    }
  };

  const signInWithLinkedIn = async () => {
    try {
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
    track('Logout Performed');
    await authApi.logout();
    setUser(null);
    // No need to clear localStorage anymore
  };

  const refreshAuth = async (): Promise<boolean> => {
    setLoading(true);
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
