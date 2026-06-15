'use client';

import { useState, useCallback } from 'react';

interface GeoCoords {
  lat: number;
  lng: number;
}

interface UseGeoLocationReturn {
  coords: GeoCoords | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
  requestLocation: () => void;
  clearLocation: () => void;
}

export function useGeoLocation(): UseGeoLocationReturn {
  const [coords, setCoords] = useState<GeoCoords | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada neste navegador.');
      return;
    }

    setLoading(true);
    setError(null);
    setPermissionDenied(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Arredonda para ~1km de precisão (preserva privacidade)
        const lat = Math.round(position.coords.latitude * 100) / 100;
        const lng = Math.round(position.coords.longitude * 100) / 100;
        setCoords({ lat, lng });
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionDenied(true);
          setError('Permissão de localização negada. Use a cidade para buscar.');
        } else if (err.code === err.TIMEOUT) {
          setError('Tempo esgotado ao obter localização.');
        } else {
          setError('Não foi possível obter sua localização.');
        }
      },
      {
        timeout: 10000,
        maximumAge: 300000, // Cache de 5min — não rastreia posição contínua
        enableHighAccuracy: false, // Precisão baixa = menos bateria, maior privacidade
      }
    );
  }, []);

  const clearLocation = useCallback(() => {
    setCoords(null);
    setError(null);
    setPermissionDenied(false);
  }, []);

  return { coords, loading, error, permissionDenied, requestLocation, clearLocation };
}
