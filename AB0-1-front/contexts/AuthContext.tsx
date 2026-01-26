'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { User, authApi } from '@/lib/api';
import { authClient } from '@/lib/authClient';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isAuthenticated = !!user;

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      // Try to fetch user data without checking localStorage
      const userData = await authApi.me();
      setUser(userData || null);
    } catch (error) {
      console.error('[Auth] Failed to fetch user data:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response: any = await authApi.login(email, password);

      // Normal case: API returns user
      if (response?.user) {
        setUser(response.user);
        return;
      }

      // Try to fetch current user after login (if login endpoint sets session cookie)
      try {
        const me = await authApi.me();
        setUser(me || null);
        return;
      } catch (e) {
        throw e;
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
      await checkAuth();
    } catch (error) {
      console.error('[Auth] LinkedIn sign-in failed', error);
      setError('LinkedIn sign-in failed');
      throw error;
    }
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    // No need to clear localStorage anymore
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
