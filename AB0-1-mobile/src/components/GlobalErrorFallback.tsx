import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { ThemedText } from './themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from 'react-native';

interface GlobalErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export function GlobalErrorFallback({ error, resetError }: GlobalErrorFallbackProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.danger + '15' }]}>
        <AlertTriangle size={48} color={colors.danger} />
      </View>
      
      <ThemedText type="title" style={styles.title}>Ops, algo deu errado!</ThemedText>
      
      <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
        Encontramos um problema inesperado. Nossa equipe técnica já foi notificada.
      </ThemedText>

      {/* Em ambiente dev/staging, mostra o erro técnico. Pode ser escondido em prod. */}
      {__DEV__ && (
        <View style={[styles.errorBox, { backgroundColor: colors.backgroundSelected, borderColor: colors.border }]}>
          <ThemedText style={[styles.errorText, { color: colors.danger }]}>
            {error.toString()}
          </ThemedText>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.brandActiveBlue }]}
        onPress={resetError}
      >
        <RefreshCw size={18} color="#FFFFFF" style={styles.buttonIcon} />
        <ThemedText style={styles.buttonText}>Tentar Novamente</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
  },
  title: {
    fontSize: 24,
    marginBottom: Spacing.two,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Spacing.five,
    lineHeight: 24,
  },
  errorBox: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    width: '100%',
    marginBottom: Spacing.five,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.five,
    paddingVertical: 14,
    borderRadius: Spacing.full,
  },
  buttonIcon: {
    marginRight: Spacing.two,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
