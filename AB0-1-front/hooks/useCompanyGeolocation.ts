import { useState, useCallback } from 'react';

export type GeoErrorType = 'denied' | 'timeout' | 'unavailable' | 'unsupported' | 'error';

export function useCompanyGeolocation() {
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const getCoordinates = useCallback((): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        setGpsError('Geolocalização não suportada no seu navegador.');
        reject('unsupported');
        return;
      }

      setDetectingGps(true);
      setGpsError(null);

      const handleSuccess = (position: GeolocationPosition) => {
        setDetectingGps(false);
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      };

      const handleError = (error: GeolocationPositionError) => {
        setDetectingGps(false);
        let type: GeoErrorType = 'error';
        let msg = 'Não foi possível obter sua localização.';

        if (error.code === 1) {
          type = 'denied';
          msg = 'Permita o acesso à localização nas configurações do navegador/app.';
        } else if (error.code === 2) {
          type = 'unavailable';
          msg = 'Localização indisponível no momento.';
        } else if (error.code === 3) {
          type = 'timeout';
          msg = 'Não conseguimos obter sua localização. Tente novamente.';
        }

        setGpsError(msg);
        reject(type);
      };

      navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 1000 * 60 * 15,
      });
    });
  }, []);

  const clearError = useCallback(() => {
    setGpsError(null);
  }, []);

  return {
    detectingGps,
    gpsError,
    setGpsError,
    getCoordinates,
    clearError,
  };
}
