import React from 'react';
import { Colors } from '@/constants/theme';
import { StyleSheet, View, TouchableOpacity , useColorScheme } from 'react-native';
import { AlertCircle, RefreshCw } from 'lucide-react-native';
import { ThemedText } from '../themed-text';
import { Colors, Spacing } from '@/constants/theme';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  title = 'Ocorreu um erro', 
  message = 'Não foi possível carregar os dados. Tente novamente mais tarde.', 
  onRetry 
}: ErrorStateProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <AlertCircle size={48} color={Colors.light.danger} />
      </View>
      <ThemedText style={styles.title}>{title}</ThemedText>
      <ThemedText style={styles.message} themeColor="textSecondary">
        {message}
      </ThemedText>

      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <RefreshCw size={18} color={colors.backgroundElement} style={styles.buttonIcon} />
          <ThemedText style={styles.buttonText}>Tentar Novamente</ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
    flex: 1,
  },
  iconContainer: {
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.four,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.tint, // Will adapt to proper theming later
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: colors.backgroundElement,
    fontWeight: '600',
    fontSize: 14,
  },
});
