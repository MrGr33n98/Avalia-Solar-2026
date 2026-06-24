import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet , useColorScheme } from 'react-native';
import { MapPin, Navigation } from 'lucide-react-native';
import { Colors } from '@/constants/theme';

interface MobileRadiusFilterProps {
  radiusKm: number | null;
  onRadiusChange: (radius: number | null) => void;
  loadingLocation?: boolean;
}

const RADIUS_OPTIONS = [5, 10, 25, 50, 100];

export function MobileRadiusFilter({ radiusKm, onRadiusChange, loadingLocation }: MobileRadiusFilterProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MapPin size={16} color={colors.textSecondary} />
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
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
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
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: Colors.light.brandActiveBlue,
    borderColor: Colors.light.brandActiveBlue,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  pillTextActive: {
    color: colors.backgroundElement,
  },
});
