import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ApolloProvider } from '@apollo/client/react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { useAuthStore } from '@/store/auth';
import { apolloClient } from '@/lib/apolloClient';

import { PostHogProvider } from 'posthog-react-native';

// Inicializa o cliente do React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const initializeAuth = useAuthStore((state) => state.initialize);

  // Inicializa a sessão ao abrir o app
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <PostHogProvider 
      apiKey={process.env.EXPO_PUBLIC_POSTHOG_KEY} 
      options={{
        host: process.env.EXPO_PUBLIC_POSTHOG_HOST,
      }}
    >
      <ApolloProvider client={apolloClient}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <AnimatedSplashOverlay />
            <AppTabs />
          </ThemeProvider>
        </QueryClientProvider>
      </ApolloProvider>
    </PostHogProvider>
  );
}
