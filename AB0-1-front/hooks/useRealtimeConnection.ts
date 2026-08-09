'use client';

import { useEffect, useState, useCallback } from 'react';

type ConnectionState = 'online' | 'offline' | 'reconnecting';

export function useRealtimeConnection(onReconnect?: () => void) {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline'
  );
  
  const [isFocused, setIsFocused] = useState(
    typeof document !== 'undefined' ? document.hasFocus() : true
  );

  const handleOnline = useCallback(() => {
    setConnectionState('reconnecting');
    // Allow a small delay for WebSockets/Network to actually establish
    setTimeout(() => {
      setConnectionState('online');
      if (onReconnect) onReconnect();
    }, 1500);
  }, [onReconnect]);

  const handleOffline = useCallback(() => {
    setConnectionState('offline');
  }, []);

  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible') {
      setIsFocused(true);
      // If we come back and we're online, trigger a reconnect/sync just in case
      // the device was asleep and lost websocket ping/pong
      if (navigator.onLine) {
        handleOnline();
      }
    } else {
      setIsFocused(false);
    }
  }, [handleOnline]);

  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [handleOnline, handleOffline, handleVisibilityChange, handleFocus, handleBlur]);

  return {
    connectionState,
    isOnline: connectionState === 'online',
    isOffline: connectionState === 'offline',
    isReconnecting: connectionState === 'reconnecting',
    isFocused,
  };
}
