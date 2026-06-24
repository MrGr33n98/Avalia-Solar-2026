import React from 'react';
import { StyleSheet, View, Text , useColorScheme } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Company } from '@/lib/api';
import { Colors } from '@/constants/theme';

interface MobileSearchMapProps {
  companies: Company[];
  userLocation: { lat: number; lng: number } | null;
  radiusKm: number | null;
  onSelectCompany: (company: Company) => void;
}

export function MobileSearchMap({ companies, userLocation, radiusKm, onSelectCompany }: MobileSearchMapProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  // Only companies with coords
  const mapCompanies = companies.filter(c => c.latitude && c.longitude);
  
  if (!userLocation && mapCompanies.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nenhuma empresa com localização disponível.</Text>
      </View>
    );
  }

  const initialRegion = userLocation ? {
    latitude: userLocation.lat,
    longitude: userLocation.lng,
    latitudeDelta: radiusKm ? (radiusKm / 111) * 2 : 0.05,
    longitudeDelta: radiusKm ? (radiusKm / 111) * 2 : 0.05,
  } : {
    latitude: parseFloat(mapCompanies[0].latitude as string),
    longitude: parseFloat(mapCompanies[0].longitude as string),
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {mapCompanies.map(company => (
          <Marker
            key={company.id}
            coordinate={{
              latitude: parseFloat(company.latitude as string),
              longitude: parseFloat(company.longitude as string),
            }}
            onCalloutPress={() => onSelectCompany(company)}
          >
            <View style={[styles.customMarker, company.verified && styles.verifiedMarker]}>
              <Text style={styles.markerText}>
                {company.rating ? `⭐ ${company.rating.toFixed(1)}` : '⭐ Novo'}
              </Text>
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  customMarker: {
    backgroundColor: colors.backgroundElement,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  verifiedMarker: {
    borderColor: colors.success,
    borderWidth: 1.5,
  },
  markerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.brandDarkBlue,
  },
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.background,
    borderRadius: 16,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  }
});
