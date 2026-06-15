import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin, Navigation } from 'lucide-react-native';
import { Colors } from '@/constants/theme';

interface MobileRadiusFilterProps {
  radiusKm: number | null;
  onRadiusChange: (radius: number | null) => void;
  loadingLocation?: boolean;
}

const RADIUS_OPTIONS = [5, 10, 25, 50, 100];

export function MobileRadiusFilter({ radiusKm, onRadiusChange, loadingLocation }: MobileRadiusFilterProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MapPin size={16} color={Colors.text.muted} />
        <Text style={styles.title}>Buscar empresas próximas</Text>
      </View>
      
      {loadingLocation ? (
        <Text style={styles.loadingText}>Obtendo sua localização...</Text>
      ) : (
        <View style={styles.optionsRow}>
          <TouchableOpacity
            style={[styles.pill, radiusKm === null && styles.pillActive]}
            onPress={() => onRadiusChange(null)}
          >
            <Text style={[styles.pillText, radiusKm === null && styles.pillTextActive]}>Todas</Text>
          </TouchableOpacity>
          
          {RADIUS_OPTIONS.map((val) => (
            <TouchableOpacity
              key={val}
              style={[styles.pill, radiusKm === val && styles.pillActive]}
              onPress={() => onRadiusChange(val)}
            >
              <Text style={[styles.pillText, radiusKm === val && styles.pillTextActive]}>
                Até {val}km
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.muted,
    textTransform: 'uppercase',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.text.muted,
    fontStyle: 'italic',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pillActive: {
    backgroundColor: Colors.primary.default,
    borderColor: Colors.primary.default,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  pillTextActive: {
    color: '#ffffff',
  },
});
