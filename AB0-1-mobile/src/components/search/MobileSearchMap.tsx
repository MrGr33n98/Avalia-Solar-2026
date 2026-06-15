import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
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
            title={company.name}
            description={company.description?.substring(0, 50)}
            onCalloutPress={() => onSelectCompany(company)}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
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
    backgroundColor: '#f8fafc',
    borderRadius: 16,
  },
  emptyText: {
    color: Colors.text.muted,
    fontSize: 14,
    textAlign: 'center',
  }
});
