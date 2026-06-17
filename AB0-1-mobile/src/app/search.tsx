import React, { useState, useEffect } from 'react';
import { Colors } from '@/constants/theme';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, Search as SearchIcon, X, Clock, Sparkles } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';

export default function SearchScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const suggestions = ['Inversores', 'Baterias', 'Placas Solares', 'Instalação', 'Solar Prime'];

  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const saved = await AsyncStorage.getItem('@avalia_solar:recent_searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      } else {
        setRecentSearches(['Inversor Solar', 'Energia solar SP', 'WEG']);
      }
    } catch (e) {
      console.warn('Erro ao ler buscas recentes:', e);
    }
  };

  const saveRecentSearch = async (text: string) => {
    if (!text.trim()) return;
    const cleanText = text.trim();
    let updated = [cleanText, ...recentSearches.filter((item) => item !== cleanText)];
    updated = updated.slice(0, 5); // Limita a 5 buscas recentes
    setRecentSearches(updated);
    try {
      await AsyncStorage.setItem('@avalia_solar:recent_searches', JSON.stringify(updated));
    } catch (e) {
      console.warn('Erro ao salvar buscas recentes:', e);
    }
  };

  const handleSearchSubmit = (searchText: string) => {
    if (!searchText.trim()) return;
    saveRecentSearch(searchText);
    router.push({
      pathname: '/explore',
      params: { q: searchText },
    });
  };

  const clearRecentSearches = async () => {
    setRecentSearches([]);
    try {
      await AsyncStorage.removeItem('@avalia_solar:recent_searches');
    } catch (e) {
      console.warn('Erro ao limpar buscas recentes:', e);
    }
  };

  const removeSearchItem = async (itemToRemove: string) => {
    const updated = recentSearches.filter((item) => item !== itemToRemove);
    setRecentSearches(updated);
    try {
      await AsyncStorage.setItem('@avalia_solar:recent_searches', JSON.stringify(updated));
    } catch (e) {
      console.warn('Erro ao remover busca recente:', e);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Search Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={colors.backgroundElement} size={24} />
        </TouchableOpacity>

        <View style={[styles.searchBar, { backgroundColor: colors.backgroundElement }]}>
          <SearchIcon color={colors.textSecondary} size={18} />
          <TextInput
            placeholder="Buscar empresas, produtos..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { color: colors.text }]}
            value={query}
            onChangeText={setQuery}
            autoFocus
            onSubmitEditing={() => handleSearchSubmit(query)}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <X color={colors.textSecondary} size={18} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.content}>
        
        {/* Sugestões de Termos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sparkles size={16} color={colors.tint} />
            <ThemedText style={styles.sectionTitle}>Sugestões</ThemedText>
          </View>
          <View style={styles.chipRow}>
            {suggestions.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.chip, { backgroundColor: colors.backgroundElement }]}
                onPress={() => {
                  setQuery(item);
                  handleSearchSubmit(item);
                }}
              >
                <ThemedText style={styles.chipText}>{item}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Buscas Recentes */}
        {recentSearches.length > 0 && (
          <View style={[styles.section, { flex: 1 }]}>
            <View style={styles.recentHeaderRow}>
              <View style={styles.sectionHeader}>
                <Clock size={16} color={colors.textSecondary} />
                <ThemedText style={styles.sectionTitle}>Buscas recentes</ThemedText>
              </View>
              <TouchableOpacity onPress={clearRecentSearches}>
                <ThemedText style={styles.clearLink}>Limpar tudo</ThemedText>
              </TouchableOpacity>
            </View>

            <FlatList
              data={recentSearches}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={[styles.recentItem, { borderBottomColor: colors.backgroundSelected }]}>
                  <TouchableOpacity
                    style={styles.recentItemLeft}
                    onPress={() => {
                      setQuery(item);
                      handleSearchSubmit(item);
                    }}
                  >
                    <Clock size={14} color={colors.textSecondary} style={{ marginRight: 12 }} />
                    <ThemedText style={styles.recentText}>{item}</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeSearchItem(item)}>
                    <X size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.backgroundElement,
    borderBottomWidth: 1,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSubtle,
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
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearLink: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: '600',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  recentItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentText: {
    fontSize: 14,
  },
});
