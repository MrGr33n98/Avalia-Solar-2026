import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  useColorScheme,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, Search, MapPin, ChevronRight, Map } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { companiesApi } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

const POPULAR_CITIES = [
  { city: 'São Paulo', state: 'SP' },
  { city: 'Campinas', state: 'SP' },
  { city: 'Sorocaba', state: 'SP' },
  { city: 'Ribeirão Preto', state: 'SP' },
  { city: 'São José dos Campos', state: 'SP' },
  { city: 'Santos', state: 'SP' },
  { city: 'Cuiabá', state: 'MT' },
  { city: 'Florianópolis', state: 'SC' },
  { city: 'Rio de Janeiro', state: 'RJ' },
  { city: 'Belo Horizonte', state: 'MG' },
];

export default function SelectCityScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();

  const [searchText, setSearchText] = useState('');
  const [selectedState, setSelectedState] = useState<string | null>(null);

  // Queries
  const { 
    data: states = [], 
    isLoading: isLoadingStates, 
    isError: isErrorStates,
    refetch: refetchStates 
  } = useQuery({
    queryKey: ['states'],
    queryFn: companiesApi.getStates,
  });

  const { 
    data: cities = [], 
    isLoading: isLoadingCities, 
    isError: isErrorCities,
    refetch: refetchCities 
  } = useQuery({
    queryKey: ['cities', selectedState],
    queryFn: () => companiesApi.getCities(selectedState!),
    enabled: !!selectedState,
  });

  const handleSelectCity = async (city: string, state: string) => {
    try {
      await AsyncStorage.setItem('@avalia_solar:selected_state', state);
      await AsyncStorage.setItem('@avalia_solar:selected_city', city);
      
      Alert.alert('Sucesso', `Localidade definida para ${city} - ${state}`, [
        { text: 'OK', onPress: () => router.replace('/') }
      ]);
    } catch (e) {
      console.warn('Erro ao salvar localidade:', e);
    }
  };

  // Debounced search logic could be added here, but since it's a local filter on fetched array, we can just useMemo
  const filteredCities = useMemo(() => {
    if (!searchText) return cities;
    return cities.filter(city => city.toLowerCase().includes(searchText.toLowerCase()));
  }, [cities, searchText]);

  const filteredStates = useMemo(() => {
    if (!searchText) return states;
    return states.filter(state => state.toLowerCase().includes(searchText.toLowerCase()));
  }, [states, searchText]);

  const filteredPopular = useMemo(() => {
    if (!searchText) return POPULAR_CITIES;
    return POPULAR_CITIES.filter(
      (item) =>
        item.city.toLowerCase().includes(searchText.toLowerCase()) ||
        item.state.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText]);

  // Renderização de Estados
  if (!selectedState) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.backgroundElement }]}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.surfaceSubtle }]} onPress={() => router.back()}>
            <ArrowLeft color={colors.text} size={24} />
          </TouchableOpacity>
          <View style={[styles.searchBar, { backgroundColor: colors.surfaceSubtle }]}>
            <Search color={colors.textSecondary} size={18} />
            <TextInput
              placeholder="Buscar estado..."
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { color: colors.text }]}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>

        <View style={styles.content}>
          <ThemedText style={styles.sectionTitle}>
            {searchText ? 'Resultados da busca' : 'Selecione o Estado'}
          </ThemedText>

          {isLoadingStates ? (
            <View style={{ gap: 16 }}>
              <Skeleton height={50} borderRadius={8} />
              <Skeleton height={50} borderRadius={8} />
              <Skeleton height={50} borderRadius={8} />
            </View>
          ) : isErrorStates ? (
            <ErrorState 
              title="Erro ao carregar" 
              message="Não foi possível carregar a lista de estados."
              onRetry={refetchStates} 
            />
          ) : states.length > 0 ? (
            <FlatList
              data={filteredStates}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.itemRow, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setSelectedState(item);
                    setSearchText('');
                  }}
                >
                  <View style={styles.itemLeft}>
                    <Map size={16} color={colors.tint} style={{ marginRight: 12 }} />
                    <ThemedText style={styles.itemName}>{item}</ThemedText>
                  </View>
                  <ChevronRight size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={<EmptyState title="Nenhum estado encontrado" />}
            />
          ) : (
            // Fallback para populares caso a API esteja vazia/fora
            <FlatList
              data={filteredPopular}
              keyExtractor={(item, idx) => `pop-${idx}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.itemRow, { borderBottomColor: colors.border }]}
                  onPress={() => handleSelectCity(item.city, item.state)}
                >
                  <View style={styles.itemLeft}>
                    <MapPin size={16} color={colors.tint} style={{ marginRight: 12 }} />
                    <View>
                      <ThemedText style={styles.itemName}>{item.city}</ThemedText>
                      <ThemedText style={styles.stateName} themeColor="textSecondary">
                        {item.state} - Brasil
                      </ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Renderização de Cidades
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.backgroundElement }]}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.surfaceSubtle }]} 
          onPress={() => {
            setSelectedState(null);
            setSearchText('');
          }}
        >
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <View style={[styles.searchBar, { backgroundColor: colors.surfaceSubtle }]}>
          <Search color={colors.textSecondary} size={18} />
          <TextInput
            placeholder={`Buscar em ${selectedState}...`}
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { color: colors.text }]}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      <View style={styles.content}>
        <ThemedText style={styles.sectionTitle}>
          Cidades em {selectedState}
        </ThemedText>

        {isLoadingCities ? (
          <View style={{ gap: 16 }}>
            <Skeleton height={50} borderRadius={8} />
            <Skeleton height={50} borderRadius={8} />
            <Skeleton height={50} borderRadius={8} />
          </View>
        ) : isErrorCities ? (
          <ErrorState 
            title="Erro ao carregar" 
            message="Não foi possível carregar as cidades deste estado."
            onRetry={refetchCities} 
          />
        ) : (
          <FlatList
            data={filteredCities}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.itemRow, { borderBottomColor: colors.border }]}
                onPress={() => handleSelectCity(item, selectedState)}
              >
                <View style={styles.itemLeft}>
                  <MapPin size={16} color={colors.tint} style={{ marginRight: 12 }} />
                  <View>
                    <ThemedText style={styles.itemName}>{item}</ThemedText>
                    <ThemedText style={styles.stateName} themeColor="textSecondary">
                      {selectedState} - Brasil
                    </ThemedText>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<EmptyState title="Nenhuma cidade encontrada" />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 16,
    marginLeft: 4,
    color: colors.textSecondary, // Pode usar themeColor depois se quiser, mas deixamos similar ao original
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
  },
  stateName: {
    fontSize: 11,
    marginTop: 2,
  },
});
