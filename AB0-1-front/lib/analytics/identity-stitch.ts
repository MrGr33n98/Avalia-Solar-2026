'use client';

import { alias, identify } from './index';
import { opaqueUserId } from './sanitize';
import { buildApiUrl } from '@/lib/api-config';

const ANONYMOUS_ID_STORAGE_KEYS = ['ajs_anonymous_id', 'as_anonymous_id'] as const;
const IDENTITY_STITCHED_KEY = 'avalia.identity_stitched';

export interface IdentityStitchPayload {
  user_id: string | number;
  anonymous_id?: string;
  role?: string;
  company_id?: string | number;
  session_id?: string | number;
  tracked_at?: string;
}

/**
 * Stitch anonymous identity to authenticated user
 * Call this immediately after user login/signup
 */
export const stitchIdentity = async (payload: IdentityStitchPayload) => {
  try {
    const userId = opaqueUserId(payload.user_id);
    const anonymousId = payload.anonymous_id || getAnonymousId();
    const stitchKey = userId + ':' + anonymousId;
    if (
      typeof window !== 'undefined' &&
      sessionStorage.getItem(IDENTITY_STITCHED_KEY + ':' + stitchKey)
    )
      return null;
    const identifyTraits = Object.fromEntries(
      Object.entries({
        role: payload.role,
        company_id: payload.company_id != null ? String(payload.company_id) : undefined,
        session_id: payload.session_id != null ? String(payload.session_id) : undefined,
        tracked_at: payload.tracked_at,
      }).filter(([, value]) => value !== undefined && value !== '')
    );

    // 1. Analytics core identify + alias
    identify(userId, identifyTraits);

    if (anonymousId) {
      alias(userId);
    }

    // 2. Backend stitching
    const response = await fetch(buildApiUrl('identity/stitch'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        anonymous_id: anonymousId,
        ...identifyTraits,
      }),
      keepalive: true,
    });

    if (!response.ok) {
      const details = await extractErrorDetails(response);
      throw new Error(`Identity stitch failed: ${details}`);
    }

    const data = await response.json();
    if (typeof window !== 'undefined')
      sessionStorage.setItem(IDENTITY_STITCHED_KEY + ':' + stitchKey, '1');

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
    const response = await fetch(buildApiUrl('identity/track_session'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const details = await extractErrorDetails(response);
      throw new Error(`Session tracking failed: ${details}`);
    }

    const data = await response.json();
    if (data.anonymous_id) {
      // Store anonymous_id in localStorage for persistence
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

  const existingAnonymousId = ANONYMOUS_ID_STORAGE_KEYS.map((key) =>
    localStorage.getItem(key)
  ).find((value): value is string => Boolean(value));

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
export const handleUserIdentified = async (user: {
  id: string | number;
  role?: string;
  company_id?: string | number;
  session_id?: string | number;
  tracked_at?: string;
}) => {
  const anonymousId = getAnonymousId();

  if (!anonymousId) {
    console.warn('[IdentityStitch] No anonymous_id found');
    return;
  }

  await stitchIdentity({
    user_id: user.id,
    anonymous_id: anonymousId,
    role: user.role,
    company_id: user.company_id,
    session_id: user.session_id,
    tracked_at: user.tracked_at,
  });
};

function persistAnonymousId(anonymousId: string): void {
  ANONYMOUS_ID_STORAGE_KEYS.forEach((key) => {
    localStorage.setItem(key, anonymousId);
  });
}

async function extractErrorDetails(response: Response): Promise<string> {
  try {
    const payload = await response.clone().json();
    return payload?.error || payload?.message || `${response.status} ${response.statusText}`.trim();
  } catch {
    return `${response.status} ${response.statusText}`.trim();
  }
}
