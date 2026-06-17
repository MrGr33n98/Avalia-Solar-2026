import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Inbox } from 'lucide-react-native';
import { ThemedText } from '../themed-text';
import { Spacing } from '@/constants/theme';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, subtitle, icon }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {icon || <Inbox size={48} color="#94A3B8" />}
      </View>
      <ThemedText style={styles.title}>{title}</ThemedText>
      {subtitle && (
        <ThemedText style={styles.subtitle} themeColor="textSecondary">
          {subtitle}
        </ThemedText>
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
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});
