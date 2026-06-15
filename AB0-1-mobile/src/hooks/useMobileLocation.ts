import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

interface GeoLocationState {
  coords: { lat: number; lng: number } | null;
  error: string | null;
  loading: boolean;
}

export function useMobileLocation(enabled: boolean = true) {
  const [locationState, setLocationState] = useState<GeoLocationState>({
    coords: null,
    error: null,
    loading: false,
  });

  useEffect(() => {
    if (!enabled) return;

    let mounted = true;

    async function requestLocation() {
      setLocationState(prev => ({ ...prev, loading: true, error: null }));
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          if (mounted) {
            setLocationState({
              coords: null,
              error: 'Permissão de localização negada.',
              loading: false,
            });
            Alert.alert(
              'Localização Necessária',
              'Para mostrar as empresas próximas, precisamos da sua localização. Ative nas configurações do aparelho.'
            );
          }
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (mounted) {
          setLocationState({
            coords: {
              lat: location.coords.latitude,
              lng: location.coords.longitude,
            },
            error: null,
            loading: false,
          });
        }
      } catch (err: any) {
        if (mounted) {
          setLocationState({
            coords: null,
            error: err.message || 'Erro ao obter localização.',
            loading: false,
          });
        }
      }
    }

    requestLocation();

    return () => {
      mounted = false;
    };
  }, [enabled]);

  return locationState;
}
