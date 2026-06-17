import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import { Spacing } from '@/constants/theme';

interface LoadingListProps {
  count?: number;
}

export function LoadingList({ count = 5 }: LoadingListProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.item}>
          <Skeleton width={50} height={50} borderRadius={25} />
          <View style={styles.content}>
            <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
            <Skeleton width="40%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  content: {
    flex: 1,
    marginLeft: Spacing.three,
  },
});
