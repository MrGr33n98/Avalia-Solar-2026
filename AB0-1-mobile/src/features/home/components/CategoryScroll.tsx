import React from 'react';
import { Pressable, ScrollView, StyleSheet, View, useColorScheme } from 'react-native';
import { Image } from 'expo-image';
import { Shapes } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import {
  type DiscoveryCategory,
  getCategoryVisualAssetUri,
} from '@/constants/category-visual-assets';
import { Colors, Radius, Spacing } from '@/constants/theme';

interface CategoryScrollProps {
  categories: DiscoveryCategory[];
  onSelect: (category: DiscoveryCategory) => void;
  accessibilityLabel?: string;
}

export const CategoryScroll = ({
  categories,
  onSelect,
  accessibilityLabel = 'Categorias',
}: CategoryScrollProps) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  if (!categories?.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      accessibilityRole="list"
      accessibilityLabel={accessibilityLabel}
    >
      {categories.map((category) => {
        const imageUri =
          category.iconUrl || getCategoryVisualAssetUri(category.slug, category.name);

        return (
          <Pressable
            key={category.id}
            style={({ pressed }) => [
              styles.categoryItem,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: colors.border,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
            onPress={() => onSelect(category)}
            accessibilityRole="button"
            accessibilityLabel={`Explorar ${category.name}`}
          >
            <View style={[styles.visual, { backgroundColor: colors.surfaceSubtle }]}>
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  contentFit="contain"
                  transition={150}
                  style={styles.categoryImage}
                  accessibilityLabel={`Ilustração de ${category.name}`}
                />
              ) : (
                <Shapes size={30} color={colors.tint} accessibilityElementsHidden />
              )}
            </View>
            <ThemedText style={[styles.categoryName, { color: colors.text }]} numberOfLines={2}>
              {category.name}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingLeft: Spacing.four,
    paddingRight: Spacing.four,
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  categoryItem: {
    width: 104,
    minHeight: 124,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.lg,
  },
  visual: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  categoryImage: {
    width: 58,
    height: 58,
  },
  categoryName: {
    minHeight: 30,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});
