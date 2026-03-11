'use client';

import { alias, identify } from './index';

const ANONYMOUS_ID_STORAGE_KEYS = ['ajs_anonymous_id', 'as_anonymous_id'] as const;

export interface IdentityStitchPayload {
  user_id: string;
  anonymous_id?: string;
  email?: string;
  name?: string;
}

/**
 * Stitch anonymous identity to authenticated user
 * Call this immediately after user login/signup
 */
export const stitchIdentity = async (payload: IdentityStitchPayload) => {
  try {
    const anonymousId = payload.anonymous_id || getAnonymousId();

    // 1. Analytics core identify + alias
    identify(payload.user_id, {
      email: payload.email,
      name: payload.name
    });

    if (anonymousId) {
      alias(payload.user_id);
    }

    // 2. Backend stitching
    const response = await fetch('/api/v1/identity/stitch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: payload.user_id,
        anonymous_id: anonymousId
      }),
      keepalive: true
    });

    if (!response.ok) {
      throw new Error(`Identity stitch failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('[IdentityStitch] ✓ Success:', data);
    
    return data;
  } catch (error) {
    console.error('[IdentityStitch] Error:', error);
    throw error;
  }
};

/**
 * Track anonymous session activity
 * Call this on every page view to maintain session state
 */
export const trackSession = async (params: {
  anonymous_id?: string;
  company_id?: string;
  page_url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}) => {
  try {
    const response = await fetch('/api/v1/identity/track_session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error(`Session tracking failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Store anonymous_id in localStorage for persistence
    if (data.anonymous_id) {
      persistAnonymousId(data.anonymous_id);
    }
    
    return data;
  } catch (error) {
    console.error('[TrackSession] Error:', error);
    return null;
  }
};

/**
 * Get current anonymous ID
 * Returns stored anonymous_id or generates new one
 */
export const getAnonymousId = (): string => {
  if (typeof window === 'undefined') return '';
  
  const existingAnonymousId = ANONYMOUS_ID_STORAGE_KEYS
    .map((key) => localStorage.getItem(key))
    .find((value): value is string => Boolean(value));
  
  if (existingAnonymousId) {
    return existingAnonymousId;
  }

  const anonymousId = `anon-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  persistAnonymousId(anonymousId);
  
  return anonymousId;
};

/**
 * Hook to call after user authentication
 * Usage:
 * 
 * const { user } = useAuth();
 * 
 * useEffect(() => {
 *   if (user) {
 *     handleUserIdentified(user);
 *   }
 * }, [user]);
 */
export const handleUserIdentified = async (user: { id: string; email?: string; name?: string }) => {
  const anonymousId = getAnonymousId();
  
  if (!anonymousId) {
    console.warn('[IdentityStitch] No anonymous_id found');
    return;
  }
  
  await stitchIdentity({
    user_id: user.id,
    anonymous_id: anonymousId,
    email: user.email,
    name: user.name
  });
};

function persistAnonymousId(anonymousId: string): void {
  ANONYMOUS_ID_STORAGE_KEYS.forEach((key) => {
    localStorage.setItem(key, anonymousId);
  });
}
