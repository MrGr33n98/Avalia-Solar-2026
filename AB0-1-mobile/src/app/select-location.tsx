import React, { useState, useEffect } from 'react';
import { Colors } from '@/constants/theme';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MapPin, ArrowLeft, Search } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';

export default function SelectLocationScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [currentCity, setCurrentCity] = useState('Cuiabá');
  const [currentState, setCurrentState] = useState('MT');
  const [isGPSEnabled, setIsGPSEnabled] = useState(false);

  // Carrega localização atual salva
  useEffect(() => {
    async function loadSavedLocation() {
      const savedCity = await AsyncStorage.getItem('@avalia_solar:selected_city');
      const savedState = await AsyncStorage.getItem('@avalia_solar:selected_state');
      if (savedCity && savedState) {
        setCurrentCity(savedCity);
        setCurrentState(savedState);
      }
    }
    loadSavedLocation();
  }, []);

  const requestGPSLocation = async (value: boolean) => {
    setIsGPSEnabled(value);
    if (!value) return; // Se desligar, apenas altera o estado

    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Negada',
          'Precisamos de permissão de localização para buscar integradores próximos. Se desejar, selecione manualmente.',
          [
            { text: 'Selecionar Manualmente', onPress: () => router.push('/select-city') },
            { text: 'Cancelar', style: 'cancel', onPress: () => setIsGPSEnabled(false) }
          ]
        );
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      let reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode && reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const state = address.region || 'MT';
        const city = address.subregion || address.city || 'Cuiabá';

        setCurrentCity(city);
        setCurrentState(state);

        await AsyncStorage.setItem('@avalia_solar:selected_state', state);
        await AsyncStorage.setItem('@avalia_solar:selected_city', city);

        Alert.alert('Sucesso', `Localização definida para: ${city} - ${state}`, [
          { text: 'OK', onPress: () => router.replace('/') }
        ]);
      } else {
        throw new Error('Não foi possível decodificar o GPS.');
      }
    } catch (error) {
      console.log('[GPS Error]', error);
      Alert.alert('Erro', 'Falha ao obter localização via GPS. Selecione manualmente no campo abaixo.');
      setIsGPSEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      
      {/* Cabeçalho Clean estilo OLX */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Definir Localização</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        
        {/* Seção "Buscando em" */}
        <View style={styles.sectionContainer}>
          <ThemedText style={styles.sectionLabel}>Buscando em</ThemedText>
          <View style={styles.chipsRow}>
            <View style={styles.activeChip}>
              <ThemedText style={styles.activeChipText}>
                {currentCity} - {currentState}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Card com Switch para GPS estilo OLX */}
        <View style={styles.gpsCard}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            <ThemedText style={styles.gpsCardTitle}>Usar localização atual</ThemedText>
            <ThemedText style={styles.gpsCardSubtitle}>
              Ative para ver instaladores e produtos mais próximos e relevantes na sua região.
            </ThemedText>
          </View>
          {loading ? (
            <ActivityIndicator size="small" color={colors.tint} />
          ) : (
            <Switch
              value={isGPSEnabled}
              onValueChange={requestGPSLocation}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor={colors.backgroundElement}
            />
          )}
        </View>

        {/* Campo de Busca Manual */}
        <View style={styles.sectionContainer}>
          <ThemedText style={styles.sectionLabel}>Busque por cidade, estado ou CEP</ThemedText>
          <TouchableOpacity 
            style={styles.searchBox}
            onPress={() => router.push('/select-city')}
            activeOpacity={0.9}
          >
            <MapPin size={20} color={colors.textSecondary} style={{ marginRight: 10 }} />
            <ThemedText style={styles.searchPlaceholder}>
              Buscar localização...
            </ThemedText>
            <Search size={18} color={colors.tint} />
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundElement,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 20,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  activeChip: {
    backgroundColor: colors.tint + "20", // Roxo super leve de fundo
    borderWidth: 1,
    borderColor: colors.tint + "40",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  activeChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.tint,
  },
  gpsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 28,
  },
  gpsCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  gpsCardSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    backgroundColor: colors.backgroundElement,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
