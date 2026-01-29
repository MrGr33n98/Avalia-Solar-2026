/**
 * UTM Parameter Management
 * Captures and persists UTM parameters across sessions
 */

import { UTMParameters } from './types';

const UTM_STORAGE_KEY = 'avaliasolar_utm';
const UTM_EXPIRY_DAYS = 30;

/**
 * Extract UTM parameters from URL
 */
export function extractUTMsFromURL(url?: string): UTMParameters {
  if (typeof window === 'undefined') return {};
  
  const searchParams = new URLSearchParams(
    url ? new URL(url).search : window.location.search
  );
  
  const utms: UTMParameters = {};
  
  if (searchParams.has('utm_source')) utms.utm_source = searchParams.get('utm_source')!;
  if (searchParams.has('utm_medium')) utms.utm_medium = searchParams.get('utm_medium')!;
  if (searchParams.has('utm_campaign')) utms.utm_campaign = searchParams.get('utm_campaign')!;
  if (searchParams.has('utm_content')) utms.utm_content = searchParams.get('utm_content')!;
  if (searchParams.has('utm_term')) utms.utm_term = searchParams.get('utm_term')!;
  
  return utms;
}

/**
 * Get stored UTM parameters
 */
export function getStoredUTMs(): UTMParameters | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(UTM_STORAGE_KEY);
    if (!stored) return null;
    
    const data = JSON.parse(stored);
    
    // Check expiry
    if (data.expiry && Date.now() > data.expiry) {
      localStorage.removeItem(UTM_STORAGE_KEY);
      return null;
    }
    
    return data.utms as UTMParameters;
  } catch (e) {
    console.warn('[UTM] Failed to parse stored UTMs', e);
    return null;
  }
}

/**
 * Store UTM parameters
 */
export function storeUTMs(utms: UTMParameters): void {
  if (typeof window === 'undefined') return;
  if (Object.keys(utms).length === 0) return;
  
  const expiry = Date.now() + (UTM_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  
  localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify({
    utms,
    expiry
  }));
}

/**
 * Initialize UTM tracking (call on app mount)
 */
export function initializeUTMs(): UTMParameters {
  // Check URL for new UTMs
  const urlUTMs = extractUTMsFromURL();
  
  // If URL has UTMs, store and return them
  if (Object.keys(urlUTMs).length > 0) {
    storeUTMs(urlUTMs);
    return urlUTMs;
  }
  
  // Otherwise return stored UTMs
  return getStoredUTMs() || {};
}

/**
 * Get current UTM parameters (URL or stored)
 */
export function getCurrentUTMs(): UTMParameters {
  const urlUTMs = extractUTMsFromURL();
  if (Object.keys(urlUTMs).length > 0) return urlUTMs;
  
  return getStoredUTMs() || {};
}

/**
 * Clear stored UTMs
 */
export function clearUTMs(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(UTM_STORAGE_KEY);
}
