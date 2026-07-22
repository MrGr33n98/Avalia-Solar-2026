'use client';

import { useEffect, useRef, useState } from 'react';
import { createConsumer, type Cable } from '@rails/actioncable';
import { resolveCableUrl } from '@/lib/cable';
import type { InboxMessage, InboxSession } from '@/lib/inbox-api';

export type InboxRealtimeEvent =
  | { type: 'inbox.message.created'; session: InboxSession; message: InboxMessage }
  | { type: 'inbox.session.updated'; session: InboxSession }
  | { type: 'inbox.typing'; session_id: number; actor: 'customer' | 'agent'; typing: boolean }
  | { type: 'inbox.message.acknowledged'; message: InboxMessage }
  | { type: 'inbox.error'; code: string; message: string };

export function useActionCableInbox(
  companyId: number | null,
  sessionId: number | null,
  onEvent: (event: InboxRealtimeEvent) => void
) {
  const [connected, setConnected] = useState(false);
  const callbackRef = useRef(onEvent);
  const subscriptionRef = useRef<{
    perform: (action: string, payload: Record<string, unknown>) => void;
  } | null>(null);

  useEffect(() => {
    callbackRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!companyId) return;

    const cable: Cable = createConsumer(resolveCableUrl());
    const subscription = cable.subscriptions.create(
      { channel: 'CompanyInboxChannel', company_id: companyId, session_id: sessionId },
      {
        connected: () => setConnected(true),
        disconnected: () => setConnected(false),
        rejected: () => setConnected(false),
        received: (event: InboxRealtimeEvent) => callbackRef.current(event),
      }
    );
    subscriptionRef.current = subscription;

    return () => {
      subscriptionRef.current = null;
      cable.subscriptions.remove(subscription);
      cable.disconnect();
      setConnected(false);
    };
  }, [companyId, sessionId]);

  return {
    connected,
    setTyping(typing: boolean) {
      if (!sessionId) return;
      subscriptionRef.current?.perform('typing', { session_id: sessionId, typing });
    },
  };
}
