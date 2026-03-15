'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useMemo, useState, ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Provider do React Query para toda a aplicação
 * 
 * Configurações otimizadas:
 * - Cache de 10 minutos por padrão
 * - Retry automático em falhas
 * - Deduplicação de requests
 * - Refetch em background
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const [Devtools, setDevtools] = useState<null | React.ComponentType<{ initialIsOpen?: boolean }>>(null);

  const devtoolsEnabled = useMemo(() => {
    if (process.env.NODE_ENV !== 'development') return false;
    const flag = process.env.NEXT_PUBLIC_REACT_QUERY_DEVTOOLS;
    return flag === '1' || flag?.toLowerCase() === 'true';
  }, []);

  useEffect(() => {
    if (!devtoolsEnabled) return;

    let alive = true;
    
    // Only load devtools in development
    if (process.env.NODE_ENV === 'development') {
      import('@tanstack/react-query-devtools')
        .then((mod) => {
          if (!alive) return;
          setDevtools(() => mod.ReactQueryDevtools);
        })
        .catch((err) => {
          console.warn('[QueryProvider] Failed to load React Query Devtools (disabled):', err);
        });
    }

    return () => {
      alive = false;
    };
  }, [devtoolsEnabled]);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Configurações padrão para todas as queries
            staleTime: 5 * 60 * 1000, // 5 minutos
            gcTime: 10 * 60 * 1000, // 10 minutos (anteriormente cacheTime)
            retry: (failureCount, error: any) => {
              const status = error?.status ?? error?.context?.status;
              if (status === 429) return false;
              return failureCount < 2;
            },
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            // Network mode: online | always | offlineFirst
            networkMode: 'offlineFirst',
          },
          mutations: {
            // Configurações padrão para mutations
            retry: 1,
            networkMode: 'online',
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {Devtools ? <Devtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}
