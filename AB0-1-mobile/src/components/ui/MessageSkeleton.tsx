import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import { Spacing } from '@/constants/theme';

export function MessageSkeleton() {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View 
          key={i} 
          style={[
            styles.message, 
            i % 2 === 0 ? styles.sent : styles.received
          ]}
        >
          <Skeleton 
            width={i % 2 === 0 ? "70%" : "60%"} 
            height={40} 
            borderRadius={12} 
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.four,
  },
  message: {
    marginBottom: Spacing.three,
    flexDirection: 'row',
  },
  sent: {
    justifyContent: 'flex-end',
  },
  received: {
    justifyContent: 'flex-start',
  },
});
