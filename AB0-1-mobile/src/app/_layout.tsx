import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ApolloProvider } from '@apollo/client/react';
import NetInfo from '@react-native-community/netinfo';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useAuthStore } from '@/store/auth';
import { apolloClient } from '@/lib/apolloClient';

import { PostHogProvider } from 'posthog-react-native';
import { OfflineBanner } from '@/components/ui/OfflineBanner';

// Configure onlineManager to use NetInfo
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

// Inicializa o cliente do React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      staleTime: 1000 * 60 * 5, // 5 minutos
    },
  },
});

let LazyAppTabs: any = null;

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const initializeAuth = useAuthStore((state) => state.initialize);

  // Inicializa a sessão ao abrir o app
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (!LazyAppTabs) {
    LazyAppTabs = require('@/components/app-tabs').default;
  }

  return (
    <PostHogProvider 
      apiKey={process.env.EXPO_PUBLIC_POSTHOG_KEY} 
      options={{
        host: process.env.EXPO_PUBLIC_POSTHOG_HOST,
      }}
    >
      <ApolloProvider client={apolloClient}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={DefaultTheme}>
            <OfflineBanner />
            <AnimatedSplashOverlay />
            <LazyAppTabs />
          </ThemeProvider>
        </QueryClientProvider>
      </ApolloProvider>
    </PostHogProvider>
  );
}
