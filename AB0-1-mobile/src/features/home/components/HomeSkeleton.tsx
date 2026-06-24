import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions, useColorScheme } from 'react-native';
import { Spacing, Colors } from '@/constants/theme';

const { width } = Dimensions.get('window');

const SkeletonItem = ({ style }: { style?: any }) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        style,
        {
          backgroundColor: colors.border,
          opacity: opacity,
        },
      ]}
    />
  );
};

export const HomeSkeleton = () => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  return (
    <View style={styles.container}>
      {/* Banner Skeleton */}
      <View style={styles.bannerContainer}>
        <SkeletonItem style={styles.banner} />
      </View>

      {/* Tools Skeleton */}
      <View style={styles.toolsContainer}>
        <SkeletonItem style={styles.tool} />
        <SkeletonItem style={styles.tool} />
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <SkeletonItem style={styles.title} />
      </View>

      {/* Categories Skeleton */}
      <View style={styles.categoriesContainer}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.categoryItem}>
            <SkeletonItem style={styles.categoryCircle} />
            <SkeletonItem style={styles.categoryText} />
          </View>
        ))}
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <SkeletonItem style={styles.title} />
      </View>

      {/* Grid Skeleton */}
      <View style={styles.gridContainer}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.gridCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <View style={styles.cardTopRow}>
              <SkeletonItem style={styles.logo} />
              <SkeletonItem style={styles.fav} />
            </View>
            <SkeletonItem style={styles.cardLineLarge} />
            <SkeletonItem style={styles.cardLineSmall} />
            <SkeletonItem style={styles.cardLineMedium} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing.two,
  },
  bannerContainer: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.four,
  },
  banner: {
    width: '100%',
    height: 160,
    borderRadius: 12,
  },
  toolsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  tool: {
    flex: 1,
    height: 70,
    borderRadius: 12,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.two,
  },
  title: {
    width: 120,
    height: 20,
    borderRadius: 4,
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingLeft: Spacing.four,
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  categoryItem: {
    alignItems: 'center',
    width: 68,
  },
  categoryCircle: {
    width: 52,
    height: 52,
    borderRadius: 14,
    marginBottom: 8,
  },
  categoryText: {
    width: 40,
    height: 10,
    borderRadius: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.four,
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  gridCard: {
    width: (width - Spacing.four * 2 - Spacing.three) / 2,
    borderRadius: 12,
    padding: Spacing.three,
    height: 160,
    borderWidth: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  fav: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  cardLineLarge: {
    width: '100%',
    height: 14,
    borderRadius: 4,
    marginBottom: 8,
  },
  cardLineSmall: {
    width: '60%',
    height: 10,
    borderRadius: 4,
    marginBottom: 12,
  },
  cardLineMedium: {
    width: '40%',
    height: 12,
    borderRadius: 4,
  },
});
