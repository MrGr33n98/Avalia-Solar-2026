'use client';

import { useState, useEffect, useCallback } from 'react';

interface IpApiResponse {
  city: string;
  region_code: string; // State abbreviation (e.g., 'SP')
  country_name: string;
}

export function useAutoLocalization() {
  const [detectedLocation, setDetectedLocation] = useState<{ state: string; city: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectLocation = useCallback(async (force = false) => {
    // Check if we already have it in session storage to avoid multiple API calls
    if (!force) {
      const cached = sessionStorage.getItem('avalia_solar_detected_location');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setDetectedLocation(parsed);
          return parsed;
        } catch (e) {
          sessionStorage.removeItem('avalia_solar_detected_location');
        }
      }
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://ipapi.co/json/');
      if (!response.ok) throw new Error('Failed to detect location');
      
      const data: IpApiResponse = await response.json();
      
      // We only care about Brazil for now
      if (data.country_name !== 'Brazil' && process.env.NODE_ENV === 'production') {
         // Optionally handle non-Brazil users
      }

      const location = {
        state: data.region_code,
        city: data.city
      };

      setDetectedLocation(location);
      sessionStorage.setItem('avalia_solar_detected_location', JSON.stringify(location));
      return location;
    } catch (err) {
      console.error('[useAutoLocalization] Error:', err);
      setError('Não foi possível detectar sua localização automaticamente.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { detectedLocation, loading, error, detectLocation };
}
