import React, { ReactNode, useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/auth';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface LoginGateProps {
  children: ReactNode;
  requireCompany?: boolean;
  fallback?: ReactNode;
}

export function LoginGate({ children, requireCompany = false, fallback }: LoginGateProps) {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted && !isLoading && !user) {
      if (!fallback) {
        // Usa replace para não poluir o histórico de navegação
        router.replace('/profile');
      }
    }
  }, [hasMounted, isLoading, user, fallback, router]);

  if (!hasMounted || isLoading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#208AEF" />
      </ThemedView>
    );
  }

  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText>Redirecionando para login...</ThemedText>
      </ThemedView>
    );
  }

  if (requireCompany && user.role !== 'company') {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={{ color: '#E53E3E', fontWeight: 'bold' }}>
          Acesso Restrito: Apenas parceiros podem visualizar este conteúdo.
        </ThemedText>
      </ThemedView>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});
