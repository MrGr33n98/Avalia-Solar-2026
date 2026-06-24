const REALTIME_AUTH_TOKEN_KEY = 'avalia.realtime.access_token';

function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
}

function isTokenUsable(token: string) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;

  // Avoid opening a WebSocket with a token that is already expiring.
  return payload.exp * 1000 > Date.now() + 30_000;
}

export function setRealtimeAuthToken(token?: string | null) {
  if (typeof window === 'undefined') return;

  if (!token) {
    sessionStorage.removeItem(REALTIME_AUTH_TOKEN_KEY);
    return;
  }

  sessionStorage.setItem(REALTIME_AUTH_TOKEN_KEY, token);
}

export function getRealtimeAuthToken() {
  if (typeof window === 'undefined') return null;

  const token = sessionStorage.getItem(REALTIME_AUTH_TOKEN_KEY);
  if (!token) return null;

  if (!isTokenUsable(token)) {
    sessionStorage.removeItem(REALTIME_AUTH_TOKEN_KEY);
    return null;
  }

  return token;
}

export function clearRealtimeAuthToken() {
  if (typeof window === 'undefined') return;

  sessionStorage.removeItem(REALTIME_AUTH_TOKEN_KEY);
}
