'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { BRAZIL_STATES_OPTIONS } from '@/lib/company-options';

export interface DiscoveryLocation {
  state: string | null; // e.g. 'SC', 'SP'
  city: string | null;  // e.g. 'Florianópolis'
  source: 'explicit' | 'profile' | 'saved' | 'geolocation' | 'default';
  status: 'confirmed' | 'suggested' | 'unknown';
}

export interface LocationContextValue {
  location: DiscoveryLocation;
  selectedState: string;
  selectedCity: string | null;
  stateLabel: string;
  setState: (stateCode: string) => void;
  setCity: (cityName: string | null) => void;
  setLocation: (location: Partial<DiscoveryLocation>) => void;
  resetLocation: () => void;
}

const DEFAULT_STATE = 'SC';

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

function setCookie(name: string, value: string, days = 365): void {
  if (typeof document === 'undefined') return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function LocationProvider({
  children,
  defaultState = DEFAULT_STATE,
}: {
  children: React.ReactNode;
  defaultState?: string;
}) {
  const [location, setLocationState] = useState<DiscoveryLocation>(() => ({
    state: defaultState.toUpperCase(),
    city: null,
    source: 'default',
    status: 'suggested',
  }));

  // Hydrate from URL query, cookie or localStorage on client mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const queryState = urlParams.get('state')?.trim().toUpperCase();
    const queryCity = urlParams.get('city')?.trim() || null;

    if (queryState && BRAZIL_STATES_OPTIONS.some((s) => s.state === queryState)) {
      setLocationState({
        state: queryState,
        city: queryCity,
        source: 'explicit',
        status: 'confirmed',
      });
      localStorage.setItem('user_state', queryState);
      setCookie('user_state', queryState);
      if (queryCity) {
        localStorage.setItem('user_city', queryCity);
        setCookie('user_city', queryCity);
      }
      return;
    }

    const cookieState = getCookie('user_state')?.trim().toUpperCase();
    const cookieCity = getCookie('user_city')?.trim() || null;
    if (cookieState && BRAZIL_STATES_OPTIONS.some((s) => s.state === cookieState)) {
      setLocationState({
        state: cookieState,
        city: cookieCity,
        source: 'saved',
        status: 'confirmed',
      });
      localStorage.setItem('user_state', cookieState);
      return;
    }

    const storedState = localStorage.getItem('user_state')?.trim().toUpperCase();
    const storedCity = localStorage.getItem('user_city')?.trim() || null;
    if (storedState && BRAZIL_STATES_OPTIONS.some((s) => s.state === storedState)) {
      setLocationState({
        state: storedState,
        city: storedCity,
        source: 'saved',
        status: 'confirmed',
      });
      setCookie('user_state', storedState);
      return;
    }
  }, []);

  const setState = useCallback((stateCode: string) => {
    const normalized = stateCode.trim().toUpperCase();
    const valid = BRAZIL_STATES_OPTIONS.some((s) => s.state === normalized);
    const targetState = valid ? normalized : DEFAULT_STATE;

    setLocationState((prev) => ({
      ...prev,
      state: targetState,
      city: null, // Reset city when state changes to avoid mismatched location
      source: 'explicit',
      status: 'confirmed',
    }));

    if (typeof window !== 'undefined') {
      localStorage.setItem('user_state', targetState);
      localStorage.removeItem('user_city');
      setCookie('user_state', targetState);
      setCookie('user_city', '');

      // Shallow update URL if on Home without reloading or redirecting
      if (window.location.pathname === '/') {
        const url = new URL(window.location.href);
        url.searchParams.set('state', targetState);
        url.searchParams.delete('city');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, []);

  const setCity = useCallback((cityName: string | null) => {
    const normalized = cityName ? cityName.trim() : null;
    setLocationState((prev) => ({
      ...prev,
      city: normalized,
      source: 'explicit',
      status: normalized ? 'confirmed' : prev.status,
    }));

    if (typeof window !== 'undefined') {
      if (normalized) {
        localStorage.setItem('user_city', normalized);
        setCookie('user_city', normalized);
      } else {
        localStorage.removeItem('user_city');
        setCookie('user_city', '');
      }

      if (window.location.pathname === '/') {
        const url = new URL(window.location.href);
        if (normalized) {
          url.searchParams.set('city', normalized);
        } else {
          url.searchParams.delete('city');
        }
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, []);

  const setLocation = useCallback((partial: Partial<DiscoveryLocation>) => {
    setLocationState((prev) => {
      const next = { ...prev, ...partial };
      if (partial.state && typeof window !== 'undefined') {
        const normalized = partial.state.trim().toUpperCase();
        localStorage.setItem('user_state', normalized);
        setCookie('user_state', normalized);
      }
      return next;
    });
  }, []);

  const resetLocation = useCallback(() => {
    setLocationState({
      state: DEFAULT_STATE,
      city: null,
      source: 'default',
      status: 'suggested',
    });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_state');
      localStorage.removeItem('user_city');
      setCookie('user_state', '');
      setCookie('user_city', '');
      if (window.location.pathname === '/') {
        const url = new URL(window.location.href);
        url.searchParams.delete('state');
        url.searchParams.delete('city');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, []);

  const stateLabel = useMemo(() => {
    const found = BRAZIL_STATES_OPTIONS.find(
      (s) => s.state.toUpperCase() === (location.state || DEFAULT_STATE).toUpperCase()
    );
    return found ? found.label : location.state || 'Santa Catarina';
  }, [location.state]);

  const value = useMemo<LocationContextValue>(
    () => ({
      location,
      selectedState: location.state || DEFAULT_STATE,
      selectedCity: location.city,
      stateLabel,
      setState,
      setCity,
      setLocation,
      resetLocation,
    }),
    [location, stateLabel, setState, setCity, setLocation, resetLocation]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

const defaultLocationValue: LocationContextValue = {
  location: { state: null, city: null, source: 'default', status: 'unknown' },
  selectedState: '',
  selectedCity: null,
  stateLabel: '',
  setState: () => {},
  setCity: () => {},
  setLocation: () => {},
  resetLocation: () => {},
};

export function useLocation(): LocationContextValue {
  const context = useContext(LocationContext);
  if (!context) {
    return defaultLocationValue;
  }
  return context;
}
