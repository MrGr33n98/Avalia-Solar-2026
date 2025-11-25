'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { User, authApi } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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
      // Check if we have auth data before making the API call
      const hasAuthData = typeof window !== 'undefined' && localStorage.getItem('auth');
      const hasToken = typeof window !== 'undefined' && localStorage.getItem('auth_token');
      
      // Only try to fetch user data if we have authentication data
      if (hasAuthData || hasToken) {
        const userData = await authApi.me();
        setUser(userData);
      } else {
        console.log('[Auth] No authentication data found, skipping user fetch');
        setUser(null);
      }
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

      // Persist auth data (token + user)
      if (typeof window !== 'undefined' && response?.token) {
        // Save complete auth object
        localStorage.setItem('auth', JSON.stringify({
          token: response.token,
          user: response.user
        }));
        console.log('[Auth] Saved auth data to localStorage');
      }

      // Normal case: API returns user
      if (response?.user) {
        setUser(response.user);
        return;
      }

      // Try to fetch current user after login (if login endpoint sets session cookie)
      try {
        const me = await authApi.me();
        setUser(me);
        return;
      } catch (e) {
        throw e;
      }
    } catch (error) {
      console.error('[Auth] Login failed', error);
      throw error;
    }
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth');
      console.log('[Auth] Cleared auth data from localStorage');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, isAuthenticated, login, logout }}>
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