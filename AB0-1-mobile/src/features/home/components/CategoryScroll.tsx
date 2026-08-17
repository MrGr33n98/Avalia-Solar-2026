import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { getCategoryVisualAssetUri } from '@/constants/category-visual-assets';

interface Category {
  id: string;
  name: string;
  slug: string;
  iconUrl?: string;
}

interface CategoryScrollProps {
  categories: Category[];
  onSelect: (id: string) => void;
}

export const CategoryScroll = ({ categories, onSelect }: CategoryScrollProps) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  if (!categories || categories.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={styles.categoryItem}
          onPress={() => onSelect(cat.id)}
        >
          <View style={[styles.categoryCircle, { backgroundColor: colors.surfaceSubtle }]}>
            {getCategoryVisualAssetUri(cat.slug, cat.name) ? (
              <Image
                source={getCategoryVisualAssetUri(cat.slug, cat.name) as string}
                contentFit="contain"
                transition={150}
                style={styles.categoryImage}
                accessibilityLabel={`Imagem de ${cat.name}`}
              />
            ) : null}
          </View>
          <ThemedText style={styles.categoryName} numberOfLines={1}>
            {cat.name}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingLeft: Spacing.four,
    paddingRight: Spacing.two,
    gap: Spacing.three,
    paddingVertical: Spacing.one,
  },
  categoryItem: {
    alignItems: 'center',
    width: 68,
  },
  categoryCircle: {
    width: 60,
    height: 60,
    borderRadius: 24,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryImage: {
    width: 54,
    height: 54,
  },
  categoryName: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});
