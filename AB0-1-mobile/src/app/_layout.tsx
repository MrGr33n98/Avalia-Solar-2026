import { DefaultTheme, ThemeProvider, useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ApolloProvider } from '@apollo/client/react';
import NetInfo from '@react-native-community/netinfo';
import { ErrorBoundary } from 'react-error-boundary';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { GlobalErrorFallback } from '@/components/GlobalErrorFallback';
import { useAuthStore } from '@/store/auth';
import { apolloClient } from '@/lib/apolloClient';
import {
  addP2PNotificationResponseListener,
  registerForPushNotificationsAsync,
} from '@/lib/pushNotifications';

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
  const router = useRouter();
  const initializeAuth = useAuthStore((state) => state.initialize);
  const user = useAuthStore((state) => state.user);

  // Inicializa a sessão ao abrir o app
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!user) return;

    registerForPushNotificationsAsync().catch((error) => {
      console.warn('[Push] Não foi possível registrar token:', error);
    });

    const subscription = addP2PNotificationResponseListener((conversationId) => {
      if (conversationId) {
        router.push({
          pathname: '/p2p_chat',
          params: { conversation_id: String(conversationId) },
        });
      } else {
        router.push('/p2p_chat');
      }
    });

    return () => subscription.remove();
  }, [router, user]);

  if (!LazyAppTabs) {
    LazyAppTabs = require('@/components/app-tabs').default;
  }

  return (
    <ErrorBoundary 
      FallbackComponent={GlobalErrorFallback}
      onReset={() => {
        // Redefine o estado aqui se necessário antes da retentativa
      }}
    >
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
    </ErrorBoundary>
  );
}
