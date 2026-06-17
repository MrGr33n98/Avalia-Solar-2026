import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Sun, Cpu, Battery, Wrench, Car } from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

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

const getCategoryIcon = (slug: string, color: string) => {
  switch (slug) {
    case 'energia-solar-residencial':
    case 'energia-solar':
    case 'paineis':
      return <Sun color={color} size={26} strokeWidth={2.2} />;
    case 'inversores':
      return <Cpu color={color} size={26} strokeWidth={2.2} />;
    case 'baterias':
      return <Battery color={color} size={26} strokeWidth={2.2} />;
    case 'instalacao':
      return <Wrench color={color} size={26} strokeWidth={2.2} />;
    case 'mobilidade-eletrica':
    case 'carregadores-veiculares':
      return <Car color={color} size={26} strokeWidth={2.2} />;
    default:
      return <Sun color={color} size={26} strokeWidth={2.2} />;
  }
};

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
            {getCategoryIcon(cat.slug, colors.brandActiveBlue)}
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
  categoryName: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});
