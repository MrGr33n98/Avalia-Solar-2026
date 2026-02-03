/**
 * Event Deduplication
 * Prevents duplicate event tracking (React StrictMode, re-renders, etc)
 */

interface EventKey {
  name: string;
  eventId?: string;
  timestamp: number;
}

// In-memory cache (per session)
const eventCache = new Map<string, number>();

// Storage-based cache for critical events (persists across page loads within session)
const DEDUPE_STORAGE_KEY = 'avaliasolar_event_dedupe';
const DEDUPE_TTL = 5000; // 5 seconds

/**
 * Generate cache key for event
 */
function getCacheKey(eventName: string, eventId?: string): string {
  return eventId ? `${eventName}:${eventId}` : eventName;
}

/**
 * Check if event was recently tracked (in-memory)
 */
function isRecentInMemory(key: string): boolean {
  const lastTracked = eventCache.get(key);
  if (!lastTracked) return false;
  
  return Date.now() - lastTracked < DEDUPE_TTL;
}

/**
 * Check if critical event was recently tracked (storage-based)
 */
function isRecentInStorage(key: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const stored = sessionStorage.getItem(DEDUPE_STORAGE_KEY);
    if (!stored) return false;
    
    const cache: Record<string, number> = JSON.parse(stored);
    const lastTracked = cache[key];
    
    if (!lastTracked) return false;
    
    return Date.now() - lastTracked < DEDUPE_TTL;
  } catch (e) {
    return false;
  }
}

/**
 * Mark event as tracked (in-memory)
 */
function markTrackedInMemory(key: string): void {
  eventCache.set(key, Date.now());
  
  // Cleanup old entries periodically
  if (eventCache.size > 100) {
    const now = Date.now();
    eventCache.forEach((timestamp, k) => {
      if (now - timestamp > DEDUPE_TTL * 2) {
        eventCache.delete(k);
      }
    });
  }
}

/**
 * Mark critical event as tracked (storage-based)
 */
function markTrackedInStorage(key: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = sessionStorage.getItem(DEDUPE_STORAGE_KEY);
    const cache: Record<string, number> = stored ? JSON.parse(stored) : {};
    
    cache[key] = Date.now();
    
    // Cleanup old entries
    const now = Date.now();
    for (const k in cache) {
      if (now - cache[k] > DEDUPE_TTL * 2) {
        delete cache[k];
      }
    }
    
    sessionStorage.setItem(DEDUPE_STORAGE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('[Dedupe] Failed to mark event in storage', e);
  }
}

/**
 * Check if event should be tracked (not a duplicate)
 */
export function shouldTrackEvent(
  eventName: string,
  eventId?: string,
  critical?: boolean
): boolean {
  const key = getCacheKey(eventName, eventId);
  
  // Check in-memory cache
  if (isRecentInMemory(key)) {
    console.debug(`[Analytics] Dedupe: ${eventName} (in-memory)`);
    return false;
  }
  
  // For critical events, also check storage-based cache
  if (critical && isRecentInStorage(key)) {
    console.debug(`[Analytics] Dedupe: ${eventName} (storage)`);
    return false;
  }
  
  // Mark as tracked
  markTrackedInMemory(key);
  if (critical) {
    markTrackedInStorage(key);
  }
  
  return true;
}

/**
 * Generate unique event ID (UUID v4)
 */
export function generateEventId(): string {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Clear dedupe cache (for testing)
 */
export function clearDedupeCache(): void {
  eventCache.clear();
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(DEDUPE_STORAGE_KEY);
  }
}
