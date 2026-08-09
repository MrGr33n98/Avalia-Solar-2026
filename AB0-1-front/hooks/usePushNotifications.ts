import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((sub) => {
          setSubscription(sub);
        });
      });
    }
  }, []);

  const subscribe = async () => {
    if (!isSupported) return null;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      
      setSubscription(sub);
      setPermission('granted');

      // Envia a assinatura para o backend
      const subscriptionJSON = sub.toJSON();
      await api.post('/push_subscriptions', {
        endpoint: subscriptionJSON.endpoint,
        p256dh: subscriptionJSON.keys?.p256dh,
        auth: subscriptionJSON.keys?.auth,
      });

      return sub;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      if (Notification.permission === 'denied') {
        setPermission('denied');
      }
      return null;
    }
  };

  const unsubscribe = async () => {
    if (!subscription) return;
    
    try {
      await subscription.unsubscribe();
      
      const subscriptionJSON = subscription.toJSON();
      await api.delete('/push_subscriptions', {
        data: { endpoint: subscriptionJSON.endpoint }
      });
      
      setSubscription(null);
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
    }
  };

  return {
    isSupported,
    permission,
    subscription,
    isSubscribed: !!subscription,
    subscribe,
    unsubscribe,
  };
}
