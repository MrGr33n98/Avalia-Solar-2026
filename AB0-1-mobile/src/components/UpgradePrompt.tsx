import React from 'react';
import { StyleSheet, View, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, Lock } from 'lucide-react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Colors, Spacing } from '../constants/theme';

interface UpgradePromptProps {
  title?: string;
  description?: string;
  feature?: string;
}

export function UpgradePrompt({
  title = 'Recurso Premium',
  description = 'Faça o upgrade do seu plano para liberar esta funcionalidade e aumentar as suas vendas.',
  feature,
}: UpgradePromptProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
        <Lock size={22} color="#F59E0B" />
      </View>

      <ThemedText style={styles.title}>{title}</ThemedText>
      
      {feature && (
        <View style={styles.featureBadge}>
          <Sparkles size={12} color="#8B5CF6" style={{ marginRight: 4 }} />
          <ThemedText style={styles.featureText}>{feature}</ThemedText>
        </View>
      )}

      <ThemedText style={styles.description} themeColor="textSecondary">
        {description}
      </ThemedText>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#8B5CF6' }]}
        onPress={() => router.push('/dashboard/plans')}
      >
        <Sparkles size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
        <ThemedText style={styles.buttonText}>Ver Planos de Assinatura</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.four,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.three,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: Spacing.two,
  },
  featureText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8B5CF6',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.four,
    paddingHorizontal: Spacing.two,
  },
  button: {
    height: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    width: '100%',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
