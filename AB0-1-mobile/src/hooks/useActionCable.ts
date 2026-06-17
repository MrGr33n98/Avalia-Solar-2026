import { useEffect, useRef, useState } from 'react';
import { createConsumer, Consumer, Subscription } from '@rails/actioncable';
import { getApiBaseUrl, getStoredToken } from '@/lib/api';

interface UseActionCableOptions {
  channel: string;
  params?: Record<string, any>;
  onReceived?: (data: any) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export function useActionCable({
  channel,
  params = {},
  onReceived,
  onConnected,
  onDisconnected,
}: UseActionCableOptions) {
  const cableRef = useRef<Consumer | null>(null);
  const subscriptionRef = useRef<Subscription | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const setupCable = async () => {
      const token = await getStoredToken();
      if (!token || !isMounted) return;

      const wsUrl = getApiBaseUrl().replace('http', 'ws').replace('/api/v1', '/cable');
      
      if (!cableRef.current) {
        cableRef.current = createConsumer(`${wsUrl}?token=${token}`);
      }

      subscriptionRef.current = cableRef.current.subscriptions.create(
        { channel, ...params },
        {
          connected: () => {
            setConnected(true);
            onConnected?.();
          },
          disconnected: () => {
            setConnected(false);
            onDisconnected?.();
          },
          received: (data) => {
            onReceived?.(data);
          },
        }
      );
    };

    setupCable();

    return () => {
      isMounted = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      // Note: We might want to keep the consumer alive if other hooks are using it,
      // but ActionCable handles multiple subscriptions on one consumer well.
    };
  }, [channel, JSON.stringify(params)]);

  return { connected };
}
