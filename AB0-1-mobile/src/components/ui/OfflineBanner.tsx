import React, { useEffect, useState } from 'react';
import { StyleSheet, Animated, useColorScheme } , useColorScheme } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { WifiOff } from 'lucide-react-native';
import { ThemedText } from '../themed-text';
import { Colors } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function OfflineBanner() {
  const netInfo = useNetInfo();
  const isOffline = netInfo.isConnected === false && netInfo.isInternetReachable === false;
  const [animation] = useState(new Animated.Value(0));
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isOffline ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOffline]);

  if (netInfo.isConnected === null) return null; // Loading state

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.danger,
          paddingTop: Math.max(insets.top, 16),
          transform: [{ translateY }],
          opacity: animation,
        },
      ]}
    >
      <WifiOff size={16} color={colors.backgroundElement} style={styles.icon} />
      <ThemedText style={styles.text}>Sem conexão com a internet</ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 12,
    zIndex: 999,
    elevation: 10,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: colors.backgroundElement,
    fontSize: 14,
    fontWeight: '600',
  },
});
