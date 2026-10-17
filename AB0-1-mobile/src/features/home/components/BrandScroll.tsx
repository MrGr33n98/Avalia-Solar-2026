import React from 'react';
import { Pressable, ScrollView, StyleSheet, View, useColorScheme } from 'react-native';
import { Image } from 'expo-image';
import { Building2 } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';

export interface BrandCompany {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
}

interface BrandScrollProps {
  companies: BrandCompany[];
  onSelect: (company: BrandCompany) => void;
}

export function BrandScroll({ companies, onSelect }: BrandScrollProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const brands = companies.filter((company) => Boolean(company.logoUrl?.trim()));

  if (!brands.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      accessibilityRole="list"
      accessibilityLabel="Marcas em destaque"
    >
      {brands.map((company) => (
        <Pressable
          key={company.id}
          onPress={() => onSelect(company)}
          accessibilityRole="button"
          accessibilityLabel={`Ver perfil de ${company.name}`}
          style={({ pressed }) => [
            styles.card,
            Shadows.sm,
            {
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
              opacity: pressed ? 0.72 : 1,
            },
          ]}
        >
          {company.logoUrl ? (
            <Image
              source={{ uri: company.logoUrl }}
              style={styles.logo}
              contentFit="contain"
              transition={150}
              accessibilityLabel={`Logotipo ${company.name}`}
            />
          ) : (
            <View style={[styles.fallback, { backgroundColor: colors.surfaceSubtle }]}>
              <Building2 size={24} color={colors.textSecondary} accessibilityElementsHidden />
              <ThemedText style={[styles.fallbackText, { color: colors.textSecondary }]}>
                {company.name}
              </ThemedText>
            </View>
          )}
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
  },
  card: {
    width: 132,
    height: 72,
    padding: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    marginTop: Spacing.one,
    maxWidth: 108,
    fontSize: 10,
    fontWeight: '600',
  },
});
