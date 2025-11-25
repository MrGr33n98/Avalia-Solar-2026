/**
 * Dashboard Custom Hooks
 * Reusable hooks for data fetching and state management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchApi } from '@/lib/api';
import type {
  Company,
  DashboardStats,
  Notification,
  Review,
  Lead,
  Campaign,
  Product,
  Category,
  ApiResponse,
  LoadingState,
} from '../types';

// ============================================================================
// useCompany Hook
// ============================================================================

export interface UseCompanyReturn {
  company: Company | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateCompany: (data: Partial<Company>) => Promise<ApiResponse>;
}

export function useCompany(companyId: string): UseCompanyReturn {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompany = useCallback(async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/companies/${companyId}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch company data');
      }
      
      const data = await response.json();
      setCompany(data.company);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error('Error fetching company:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const updateCompany = useCallback(
    async (data: Partial<Company>): Promise<ApiResponse> => {
      try {
        const result = await fetchApi(
          '/company_dashboard/update_info',
          {
            method: 'POST',
            body: JSON.stringify({ company: data })
          }
        );

        if (result) {
          await fetchCompany();
          return { success: true, data: result };
        }

        return { success: false, error: 'Update failed' };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        return { success: false, error: message };
      }
    },
    [fetchCompany]
  );

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  return {
    company,
    loading,
    error,
    refetch: fetchCompany,
    updateCompany,
  };
}

// ============================================================================
// useDashboardStats Hook
// ============================================================================

export function useDashboardStats(companyId: string) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let hasToken = false;
      try {
        const authData = typeof window !== 'undefined' ? localStorage.getItem('auth') : null;
        if (authData) {
          const parsed = JSON.parse(authData);
          hasToken = Boolean(parsed?.token);
        }
      } catch {}
      if (!hasToken) {
        setError('Autenticação necessária');
        setLoading(false);
        return;
      }

      const data = await fetchApi(
        '/company_dashboard/stats',
        { params: { company_id: companyId } }
      );

      setStats(data?.stats || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

// ============================================================================
// useNotifications Hook
// ============================================================================

export function useNotifications(companyId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchApi(
        '/company_dashboard/notifications',
        { params: { company_id: companyId } }
      );

      setNotifications(data?.notifications || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    // TODO: Call API to mark as read
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    loading,
    error,
    unreadCount,
    refetch: fetchNotifications,
    markAsRead,
  };
}

// ============================================================================
// useDebounce Hook
// ============================================================================

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================================
// useLocalStorage Hook
// ============================================================================

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error saving ${key} to localStorage:`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

// ============================================================================
// usePagination Hook
// ============================================================================

export interface UsePaginationOptions {
  initialPage?: number;
  initialPerPage?: number;
}

export interface UsePaginationReturn {
  page: number;
  perPage: number;
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  reset: () => void;
}

export function usePagination(
  options: UsePaginationOptions = {}
): UsePaginationReturn {
  const { initialPage = 1, initialPerPage = 10 } = options;
  const [page, setPage] = useState(initialPage);
  const [perPage, setPerPage] = useState(initialPerPage);

  const nextPage = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const prevPage = useCallback(() => {
    setPage((prev) => Math.max(1, prev - 1));
  }, []);

  const reset = useCallback(() => {
    setPage(initialPage);
    setPerPage(initialPerPage);
  }, [initialPage, initialPerPage]);

  return {
    page,
    perPage,
    setPage,
    setPerPage,
    nextPage,
    prevPage,
    reset,
  };
}

// ============================================================================
// useToast Hook (simplified - use shadcn toast in production)
// ============================================================================

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    // In production, this would integrate with shadcn/ui toast
    console.log('Toast:', options);
  }, []);

  return { toast };
}

// ============================================================================
// useAsync Hook
// ============================================================================

export interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  status: LoadingState;
}

export interface UseAsyncReturn<T> extends UseAsyncState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

export function useAsync<T>(
  asyncFunction: (...args: any[]) => Promise<T>
): UseAsyncReturn<T> {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: false,
    error: null,
    status: 'idle',
  });

  const execute = useCallback(
    async (...args: any[]) => {
      setState({ data: null, loading: true, error: null, status: 'loading' });
      
      try {
        const data = await asyncFunction(...args);
        setState({ data, loading: false, error: null, status: 'success' });
        return data;
      } catch (error) {
        const err = error as Error;
        setState({ data: null, loading: false, error: err, status: 'error' });
        return null;
      }
    },
    [asyncFunction]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null, status: 'idle' });
  }, []);

  return { ...state, execute, reset };
}

// ============================================================================
// useMediaQuery Hook
// ============================================================================

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

// ============================================================================
// useOnClickOutside Hook
// ============================================================================

export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  handler: () => void
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [handler]);

  return ref;
}
