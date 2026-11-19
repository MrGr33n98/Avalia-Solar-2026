'use client';

import { Attribution, AttributionTouch, UTMParameters } from './types';
import { getCookie, setCookie, deleteCookie } from './cookies';
import { hasAnalyticsConsent } from './consent';

const STORAGE_KEY = 'avaliasolar_attribution_v2';
const COOKIE_KEY = 'avaliasolar_attribution_v2';
const FIRST_TOUCH_TTL_DAYS = 365;
const LAST_TOUCH_TTL_DAYS = 30;
const ALLOWED_KEYS: (keyof UTMParameters)[] = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'fbclid',
  'msclkid',
];

type StoredPayload = {
  attribution: Attribution;
  expires_at: number;
};

const isBrowser = typeof window !== 'undefined';

/**
 * Normaliza valor de UTM (lowercase, remove chars inválidos, max 255)
 */
export function normalizeUtmValue(value?: string | null): string | null {
  if (!value) return null;
  const cleaned = value.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
  if (!cleaned) return null;
  return cleaned.slice(0, 255);
}

/**
 * Extrai UTMs/Ad IDs da URL fornecida ou da URL atual (client only).
 */
export function extractUtms(searchParams?: URLSearchParams): UTMParameters {
  if (!isBrowser && !searchParams) return {};
  const params = searchParams || new URLSearchParams(window.location.search);
  const utm: UTMParameters = {};

  ALLOWED_KEYS.forEach((key) => {
    const raw = params.get(key);
    const val = normalizeUtmValue(raw);
    if (val) {
      utm[key] = val;
    }
  });

  return utm;
}

function getReferrerHost(referrer?: string): string | undefined {
  const value = referrer || (isBrowser ? document.referrer : '');
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.hostname || undefined;
  } catch {
    return undefined;
  }
}

function isSameSiteHost(refHost?: string): boolean {
  if (!refHost || !isBrowser) return false;

  const currentHost = window.location.hostname;
  if (!currentHost) return false;
  if (refHost === currentHost) return true;

  return refHost.endsWith(`.${currentHost}`) || currentHost.endsWith(`.${refHost}`);
}

function getLandingPath(pathname?: string): string {
  if (pathname) return pathname;
  if (!isBrowser) return '/';
  try {
    return new URL(window.location.href).pathname || '/';
  } catch {
    return '/';
  }
}

function parseStored(json?: string | null): StoredPayload | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as StoredPayload;
  } catch {
    return null;
  }
}

function readFromStorages(): StoredPayload | null {
  if (!isBrowser) return null;

  const fromLocal = parseStored(localStorage.getItem(STORAGE_KEY));
  if (fromLocal) return fromLocal;

  const fromSession = parseStored(sessionStorage.getItem(STORAGE_KEY));
  if (fromSession) return fromSession;

  const fromCookie = parseStored(getCookie(COOKIE_KEY));
  return fromCookie;
}

function persist(payload: StoredPayload): void {
  if (!isBrowser) return;
  
  // 🚨 CRITICAL LGPD FIX: Do not persist analytics/marketing attribution cookies without consent
  if (!hasAnalyticsConsent()) {
    return;
  }

  const serialized = JSON.stringify(payload);

  try {
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch {}

  try {
    sessionStorage.setItem(STORAGE_KEY, serialized);
  } catch {}

  try {
    setCookie(COOKIE_KEY, serialized, FIRST_TOUCH_TTL_DAYS);
  } catch {}
}

function clearStorages(): void {
  if (!isBrowser) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    deleteCookie(COOKIE_KEY);
  } catch {}
}

function isExpired(payload?: StoredPayload | null): boolean {
  if (!payload) return true;
  return !!(payload.expires_at && Date.now() > payload.expires_at);
}

function buildTouch(values: UTMParameters, pathname?: string, referrer?: string): AttributionTouch {
  return {
    values,
    landing_path: getLandingPath(pathname),
    referrer_host: getReferrerHost(referrer),
    ts: new Date().toISOString(),
  };
}

function isInternalUtm(values: UTMParameters): boolean {
  const source = values.utm_source?.toLowerCase();
  const medium = values.utm_medium?.toLowerCase();
  return medium === 'internal' || source === 'blog' || source === 'avaliasolar' || source === 'avaliasolar_ads' || source === 'internal';
}

/**
 * Atualiza/persist a attribution (first/last touch) considerando navegação atual.
 * Deve ser chamado no client ao montar e em cada mudança de rota.
 */
export function updateAttribution(pathname?: string, searchParams?: URLSearchParams, referrer?: string): Attribution {
  const now = Date.now();
  const utmValues = extractUtms(searchParams);
  const stored = readFromStorages();

  if (isExpired(stored)) {
    clearStorages();
  }

  const existing = !isExpired(stored) && stored ? stored.attribution : null;
  const hasNewUtm = Object.keys(utmValues).length > 0;

  const externalUtm = hasNewUtm && !isInternalUtm(utmValues) ? utmValues : {};
  const internalUtm = hasNewUtm && isInternalUtm(utmValues) ? utmValues : null;
  const firstExternalTouch = existing?.first_external_touch ||
    (Object.keys(externalUtm).length > 0 ? buildTouch(externalUtm, pathname, referrer) : undefined);
  const lastExternalTouch = existing?.last_external_touch || existing?.last_touch;
  const first_touch = firstExternalTouch || existing?.first_touch || buildTouch({}, pathname, referrer);

  const refHost = getReferrerHost(referrer);
  const hasExternalReferrer = !!refHost && !isSameSiteHost(refHost);
  const shouldUpdateLast =
    Object.keys(externalUtm).length > 0 ||
    !existing ||
    (hasExternalReferrer && refHost !== existing?.last_touch?.referrer_host);
  const fallbackValues = lastExternalTouch?.values || firstExternalTouch?.values || {};
  const lastTouchValues = Object.keys(externalUtm).length > 0 ? externalUtm : fallbackValues;
  const last_touch = shouldUpdateLast
    ? buildTouch(lastTouchValues, pathname, referrer)
    : (lastExternalTouch || buildTouch(lastTouchValues, pathname, referrer));

  const attribution: Attribution = {
    first_touch,
    last_touch,
    first_external_touch: firstExternalTouch,
    last_external_touch: shouldUpdateLast ? last_touch : lastExternalTouch,
    last_internal_interaction: internalUtm
      ? buildTouch(internalUtm, pathname, referrer)
      : existing?.last_internal_interaction,
    ttl_days: FIRST_TOUCH_TTL_DAYS,
  };

  const expires_at = now + FIRST_TOUCH_TTL_DAYS * 24 * 60 * 60 * 1000;
  persist({ attribution, expires_at });

  return attribution;
}

/**
 * Retorna attribution válida (ou atualiza se expirou).
 */
export function getAttribution(): Attribution | null {
  if (!isBrowser) return null;
  const stored = readFromStorages();
  if (isExpired(stored)) {
    clearStorages();
    return null;
  }
  return stored?.attribution || null;
}

/**
 * Retorna UTMs do último touch (fallback para first_touch).
 */
export function getCurrentUTMs(): UTMParameters {
  const attribution = getAttribution();
  if (!attribution) return {};

  // Plan requirement: last_touch expires in 30 days
  const lastTouchTs = new Date(attribution.last_touch.ts).getTime();
  const thirtyDaysInMs = LAST_TOUCH_TTL_DAYS * 24 * 60 * 60 * 1000;
  const isLastTouchValid = (Date.now() - lastTouchTs) <= thirtyDaysInMs;

  const lastExternalTouch = attribution.last_external_touch || attribution.last_touch;
  if (isLastTouchValid && lastExternalTouch?.values && Object.keys(lastExternalTouch.values).length > 0) {
    return lastExternalTouch.values;
  }
  
  if (attribution.first_touch?.values) return attribution.first_touch.values;
  return {};
}

/**
 * Remove attribution de todos storages.
 */
export function clearUTMs(): void {
  clearStorages();
}

/**
 * Anexa UTMs ao link (apenas http/https). Não sobrescreve UTMs existentes.
 */
export function appendUtm(url: string, override?: Partial<UTMParameters>): string {
  const baseIsRelative = !/^https?:\/\//i.test(url);
  if (baseIsRelative && !isBrowser) return url;

  let target: URL;
  try {
    target = new URL(url, isBrowser ? window.location.origin : undefined);
  } catch {
    return url;
  }

  if (!/^https?:$/i.test(target.protocol)) return url;

  const existingKeys = ALLOWED_KEYS.filter((k) => target.searchParams.has(k));
  if (existingKeys.length === 0) {
    const source = { ...getCurrentUTMs(), ...override };
    ALLOWED_KEYS.forEach((key) => {
      const val = source[key];
      if (val) target.searchParams.set(key, val);
    });
  }

  if (baseIsRelative) {
    return `${target.pathname}${target.search}${target.hash}`;
  }
  return target.toString();
}
