'use client';

// P1 PERF FIX: ApolloProvider movido do global Providers.tsx para este wrapper route-específico.
// Montar apenas em /dashboard, /compare, /review-dashboard.
// Rotas públicas (/categories, /companies, /blog, /) não carregam @apollo/client (~80KB gzip).
import { ApolloProvider } from '@apollo/client/react';
import { getApolloClient } from '@/lib/apollo-client';

export function ApolloProviderWrapper({ children }: { children: React.ReactNode }) {
  const apolloClient = getApolloClient();
  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
}
