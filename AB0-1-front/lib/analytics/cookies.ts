'use client';

/**
 * Lightweight cookie helpers without external deps.
 * Uses encodeURIComponent/ decodeURIComponent and keeps defaults LGPD-safe.
 */

const isBrowser = typeof window !== 'undefined';

export type CookieOptions = {
  days?: number;
  path?: string;
  domain?: string;
  sameSite?: 'Lax' | 'Strict' | 'None';
  secure?: boolean;
};

export function getCookie(name: string): string | null {
  if (!isBrowser) return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.*+?^${}()|[\]\\])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setCookie(name: string, value: string, days = 30, options: CookieOptions = {}): void {
  if (!isBrowser) return;

  const { path = '/', sameSite = 'Lax', domain } = options;
  const secure = options.secure ?? (process.env.NODE_ENV === 'production');
  const expires = new Date();
  expires.setDate(expires.getDate() + days);

  const cookie = [
    `${name}=${encodeURIComponent(value)}`,
    `Expires=${expires.toUTCString()}`,
    `Path=${path}`,
    `SameSite=${sameSite}`,
    domain ? `Domain=${domain}` : '',
    secure ? 'Secure' : '',
  ].filter(Boolean).join('; ');

  document.cookie = cookie;
}

export function deleteCookie(name: string, options: CookieOptions = {}): void {
  if (!isBrowser) return;
  const { path = '/', domain } = options;
  
  let cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=${path}; SameSite=Lax`;
  if (domain) {
    cookie += `; Domain=${domain}`;
  }
  
  document.cookie = cookie;
}
