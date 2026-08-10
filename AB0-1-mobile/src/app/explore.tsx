import React, { useState, useEffect } from 'react';
import { Colors } from '@/constants/theme';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  useColorScheme,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Search, MapPin, Star, ShieldCheck, SlidersHorizontal, CheckCircle, ChevronDown, Heart } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { companiesApi, categoriesApi, Company } from '@/lib/api';
import { apolloClient } from '@/lib/apolloClient';
import { gql } from '@apollo/client';

import { useMobileLocation } from '@/hooks/useMobileLocation';
import { MobileRadiusFilter } from '@/components/search/MobileRadiusFilter';
import { MobileSearchMap } from '@/components/search/MobileSearchMap';
import { useTracking } from '@/hooks/useTracking';
import { useCompareStore } from '@/store/compare';
import { BannerSlot } from '@/components/BannerSlot';

const GET_COMPANIES_SEARCH_GRAPHQL = gql`
  query GetCompaniesSearch($q: String, $categoryId: ID, $state: String, $city: String, $verified: Boolean, $latitude: Float, $longitude: Float, $radiusKm: Int) {
    companies(q: $q, categoryId: $categoryId, state: $state, city: $city, verified: $verified, latitude: $latitude, longitude: $longitude, radiusKm: $radiusKm, limit: 30) {
      nodes {
        id
        name
        slug
        logoUrl
        ratingAvg
        reviewsCount
        city
        state
        latitude
        longitude
        distanceKm
        verified: isVerified
        featured: isFeatured
        description
        categories {
          id
          name
          slug
        }
      }
    }
  }
`;

export default function ExploreScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string; category_id?: string }>();
  const { trackCompanyClick } = useTracking();

  // Estados de Filtros
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // GEO State
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const { coords: userLocation, loading: loadingLocation } = useMobileLocation(true);

  // Compare Store
  const { selectedCompanies, addCompany, removeCompany, isComparing } = useCompareStore();

  // Favoritos local
  const [favorites, setFavorites] = useState<string[]>([]);
  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
    );
  };

  // Inicializa filtros a partir de parâmetros da rota (ex: vindo da Home)
  useEffect(() => {
    if (params.q) {
      setSearch(params.q);
    }
    if (params.category_id) {
      setSelectedCategory(Number(params.category_id));
    }
  }, [params.q, params.category_id]);

  // Buscar categorias para o filtro horizontal
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  // Buscar estados da API
  const { data: states = [] } = useQuery({
    queryKey: ['states'],
    queryFn: () => companiesApi.getStates(),
  });

  // Buscar cidades do estado selecionado
  const { data: cities = [] } = useQuery({
    queryKey: ['cities', selectedState],
    queryFn: () => (selectedState ? companiesApi.getCities(selectedState) : Promise.resolve([])),
    enabled: !!selectedState,
  });

  // Buscar empresas filtradas
  const { data: companies = [], isLoading, refetch } = useQuery({
    queryKey: [
      'companies-search',
      search,
      selectedCategory,
      selectedState,
      selectedCity,
      onlyVerified,
    ],
    queryFn: async () => {
      const isGraphqlEnabled = process.env.EXPO_PUBLIC_GRAPHQL_COMPANIES_ENABLED === 'true';
      if (isGraphqlEnabled) {
        try {
          console.log('[Explore] Buscando empresas via GraphQL...');
          const { data } = await apolloClient.query({
            query: GET_COMPANIES_SEARCH_GRAPHQL,
            variables: {
              q: search || undefined,
              categoryId: selectedCategory ? String(selectedCategory) : undefined,
              state: selectedState || undefined,
              city: selectedCity || undefined,
              verified: onlyVerified || undefined,
              latitude: userLocation?.lat,
              longitude: userLocation?.lng,
              radiusKm: radiusKm || undefined,
            },
            fetchPolicy: 'network-only',
          });

          return data.companies.nodes.map((node: any) => ({
            id: Number(node.id),
            name: node.name,
            slug: node.slug,
            logo_url: node.logoUrl,
            rating: node.ratingAvg,
            review_count: node.reviewsCount,
            city: node.city,
            state: node.state,
            latitude: node.latitude,
            longitude: node.longitude,
            distanceKm: node.distanceKm,
            verified: node.verified,
            featured: node.featured,
            description: node.description,
            categories: node.categories || [],
          }));
        } catch (err) {
          console.warn('[Explore] Erro ao buscar empresas via GraphQL, caindo para REST:', err);
        }
      }

      return companiesApi.getAll({
        q: search || undefined,
        category_id: selectedCategory || undefined,
        state: selectedState || undefined,
        city: selectedCity || undefined,
        verified: onlyVerified ? true : undefined,
      });
    },
  });

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory(null);
    setSelectedState('');
    setSelectedCity('');
    setOnlyVerified(false);
    setRadiusKm(null);
    setShowFilters(false);
  };

  const renderCompanyItem = ({ item }: { item: Company }) => {
    const isFav = favorites.includes(item.id.toString());
    const isComp = isComparing(item.id.toString());

    return (
      <TouchableOpacity
        style={[styles.horizontalCard, { backgroundColor: colors.backgroundElement }]}
        onPress={() => {
          trackCompanyClick(item.id, item.name, 'search_results');
          router.push(`/company/${item.id}`);
        }}
        activeOpacity={0.9}
      >
        {/* Imagem do integrador na esquerda */}
        {item.logo_url ? (
          <Image source={{ uri: item.logo_url }} style={styles.horizontalLogo} />
        ) : (
          <View style={[styles.horizontalLogoPlaceholder, { backgroundColor: colors.backgroundSelected }]}>
            <ThemedText style={styles.placeholderChar}>{item.name[0]}</ThemedText>
          </View>
        )}

        {/* Informações na direita */}
        <View style={styles.horizontalInfo}>
          <View style={styles.horizontalTitleRow}>
            <ThemedText style={styles.horizontalName} numberOfLines={1}>
              {item.name}
            </ThemedText>
            {item.verified && (
              <ShieldCheck size={16} color={colors.success} style={{ marginLeft: 4 }} />
            )}
          </View>

          {/* Rating */}
          <View style={styles.horizontalRatingRow}>
            <Star size={12} color={colors.starYellow} fill={colors.starYellow} style={{ marginRight: 2 }} />
            <ThemedText style={styles.horizontalRatingText}>
              {item.rating ? item.rating.toFixed(1) : '5.0'}
            </ThemedText>
            <ThemedText style={styles.horizontalReviewCount}>
              ({item.review_count || 0})
            </ThemedText>
          </View>

          {/* Localização */}
          <View style={styles.horizontalLocationRow}>
            <MapPin size={11} color={colors.textSecondary} style={{ marginRight: 4 }} />
            <ThemedText style={styles.horizontalLocationText} numberOfLines={1}>
              {item.city} - {item.state}
              {item.distanceKm ? ` (${item.distanceKm.toFixed(1)} km)` : ''}
            </ThemedText>
          </View>

          {/* Tags de benefícios coloridas estilo OLX */}
          <View style={styles.horizontalTagsRow}>
            {item.verified && (
              <View style={[styles.benefitBadge, styles.benefitBadgeGreen]}>
                <ThemedText style={styles.benefitBadgeTextGreen}>Selo Verificado</ThemedText>
              </View>
            )}
            {item.featured && (
              <View style={[styles.benefitBadge, styles.benefitBadgePurple]}>
                <ThemedText style={styles.benefitBadgeTextPurple}>Destaque</ThemedText>
              </View>
            )}
            {!item.verified && !item.featured && (
              <View style={[styles.benefitBadge, styles.benefitBadgeGray]}>
                <ThemedText style={styles.benefitBadgeTextGray}>Parceiro Solar</ThemedText>
              </View>
            )}
          </View>

          {/* Ações de Comparar */}
          <View style={styles.horizontalActionsRow}>
            <TouchableOpacity
              style={[styles.horizontalCompareBtn, isComp && styles.horizontalCompareBtnActive]}
              onPress={(e) => {
                e.stopPropagation();
                if (isComp) {
                  removeCompany(item.id.toString());
                } else {
                  addCompany({
                    id: item.id.toString(),
                    name: item.name,
                    logoUrl: item.logo_url,
                    ratingAvg: item.rating,
                    reviewsCount: item.review_count,
                    isVerified: item.verified,
                  });
                }
              }}
            >
              <ThemedText style={[styles.horizontalCompareBtnText, isComp && { color: colors.backgroundElement }]}>
                {isComp ? 'Comparando' : '+ Comparar'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Curtir (coração) no canto superior direito flutuando */}
        <TouchableOpacity 
          style={styles.horizontalFavBtn}
          onPress={(e) => {
            e.stopPropagation();
            toggleFavorite(item.id.toString());
          }}
        >
          <Heart
            size={18}
            color={favorites.includes(item.id.toString()) ? colors.danger : colors.textSecondary}
            fill={favorites.includes(item.id.toString()) ? colors.danger : 'transparent'}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Barra de Busca e Filtros */}
        <View style={styles.searchHeader}>
          <View style={[styles.searchBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border, borderWidth: 1 }]}>
            <Search size={18} color={colors.textSecondary} />
            <TextInput
              placeholder="Buscar por nome ou cidade..."
              placeholderTextColor={colors.textSecondary}
              style={[styles.searchInput, { color: colors.text }]}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.filterToggle, { backgroundColor: viewMode === 'map' ? colors.brandActiveBlue + '20' : colors.backgroundElement, marginRight: 8 }]}
              onPress={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
            >
              <MapPin size={18} color={viewMode === 'map' ? colors.brandActiveBlue : colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Barra de Chips de Filtros Rápidos (OLX Style) */}
        <View style={styles.quickFiltersWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickFiltersScroll}>
            
            <TouchableOpacity 
              style={[styles.quickFilterChip, showFilters && [styles.quickFilterChipActive, { backgroundColor: colors.brandActiveBlue }]]}
              onPress={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal size={14} color={showFilters ? colors.backgroundElement : colors.textSecondary} style={{ marginRight: 6 }} />
              <ThemedText style={[styles.quickFilterText, showFilters && { color: colors.backgroundElement }]}>
                Filtros {(onlyVerified || radiusKm || selectedState || selectedCity) ? '(Ativos)' : ''}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.quickFilterChip, onlyVerified && [styles.quickFilterChipActive, { backgroundColor: colors.success }]]}
              onPress={() => setOnlyVerified(!onlyVerified)}
            >
              <CheckCircle size={14} color={onlyVerified ? colors.backgroundElement : colors.textSecondary} style={{ marginRight: 6 }} />
              <ThemedText style={[styles.quickFilterText, onlyVerified && { color: colors.backgroundElement }]}>
                Verificados
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.quickFilterChip, !!radiusKm && [styles.quickFilterChipActive, { backgroundColor: colors.brandActiveBlue }]]}
              onPress={() => {
                if (radiusKm) {
                  setRadiusKm(null);
                } else {
                  setRadiusKm(50); // Valor de raio inicial rápido
                }
              }}
            >
              <MapPin size={14} color={radiusKm ? colors.backgroundElement : colors.textSecondary} style={{ marginRight: 6 }} />
              <ThemedText style={[styles.quickFilterText, radiusKm && { color: colors.backgroundElement }]}>
                Até 50km
              </ThemedText>
            </TouchableOpacity>

          </ScrollView>
        </View>

        {/* Filtros Avançados Expansíveis */}
        {showFilters && (
          <View style={[styles.advancedFiltersContainer, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
            {/* Estado e Cidade */}
            <View style={styles.filterRow}>
              <View style={styles.pickerWrapper}>
                <ThemedText style={[styles.filterLabel, { color: colors.textSecondary }]}>Estado</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeScroll}>
                  <TouchableOpacity
                    style={[styles.filterBadge, !selectedState && [styles.activeBadge, { backgroundColor: colors.brandActiveBlue }]]}
                    onPress={() => { setSelectedState(''); setSelectedCity(''); }}
                  >
                    <ThemedText style={[styles.badgeText, !selectedState && styles.activeBadgeText]}>Todos</ThemedText>
                  </TouchableOpacity>
                  {(states.length > 0 ? states : ['SP', 'RJ', 'MG', 'PR']).map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[styles.filterBadge, selectedState === st && [styles.activeBadge, { backgroundColor: colors.brandActiveBlue }]]}
                      onPress={() => { setSelectedState(st); setSelectedCity(''); }}
                    >
                      <ThemedText style={[styles.badgeText, selectedState === st && styles.activeBadgeText, { color: selectedState === st ? colors.backgroundElement : colors.text }]}>{st}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {selectedState ? (
              <View style={styles.filterRow}>
                <View style={styles.pickerWrapper}>
                  <ThemedText style={[styles.filterLabel, { color: colors.textSecondary }]}>Cidade</ThemedText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeScroll}>
                    <TouchableOpacity
                      style={[styles.filterBadge, !selectedCity && [styles.activeBadge, { backgroundColor: colors.brandActiveBlue }]]}
                      onPress={() => setSelectedCity('')}
                    >
                      <ThemedText style={[styles.badgeText, !selectedCity && styles.activeBadgeText]}>Todas</ThemedText>
                    </TouchableOpacity>
                    {(cities.length > 0 ? cities : ['São Paulo', 'Campinas', 'Santos']).map((ct) => (
                      <TouchableOpacity
                        key={ct}
                        style={[styles.filterBadge, selectedCity === ct && [styles.activeBadge, { backgroundColor: colors.brandActiveBlue }]]}
                        onPress={() => setSelectedCity(ct)}
                      >
                        <ThemedText style={[styles.badgeText, selectedCity === ct && styles.activeBadgeText, { color: selectedCity === ct ? colors.backgroundElement : colors.text }]}>{ct}</ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            ) : null}

            {/* Checkbox Apenas Verificadas */}
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setOnlyVerified(!onlyVerified)}
              >
                <CheckCircle size={18} color={onlyVerified ? colors.success : colors.textSecondary} fill={onlyVerified ? colors.success : 'transparent'} />
                <ThemedText style={[styles.checkboxLabel, { color: colors.text }]}>Apenas empresas certificadas (Verificadas)</ThemedText>
              </TouchableOpacity>
              
              <View style={{ marginTop: 12 }}>
                <MobileRadiusFilter 
                  radiusKm={radiusKm} 
                  onRadiusChange={setRadiusKm} 
                  loadingLocation={loadingLocation} 
                />
              </View>

              <TouchableOpacity onPress={clearFilters} style={{ marginTop: 12 }}>
                <ThemedText style={[styles.clearText, { color: colors.danger }]}>Limpar Filtros</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Categorias Horizontal Scroll */}
        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            <TouchableOpacity
              style={[styles.categoryBadgeSelect, selectedCategory === null && { backgroundColor: colors.brandDarkBlue }]}
              onPress={() => setSelectedCategory(null)}
            >
              <ThemedText style={[styles.categoryBadgeTextSelect, selectedCategory === null && { color: colors.backgroundElement }]}>
                Todas
              </ThemedText>
            </TouchableOpacity>

            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryBadgeSelect,
                  selectedCategory === cat.id && { backgroundColor: colors.brandDarkBlue },
                  selectedCategory !== cat.id && { backgroundColor: colors.backgroundElement }
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <ThemedText
                  style={[
                    styles.categoryBadgeTextSelect,
                    selectedCategory === cat.id && { color: colors.backgroundElement },
                    selectedCategory !== cat.id && { color: colors.text }
                  ]}
                >
                  {cat.name}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* View Mode: Map or List */}
        {isLoading ? (
          <LoadingList count={6} />
        ) : viewMode === 'map' ? (
<View style={{ flex: 1, marginTop: 12 }}>
            <MobileSearchMap 
              companies={companies} 
              userLocation={userLocation}
              radiusKm={radiusKm}
              onSelectCompany={(company) => {
                if (company) {
                  trackCompanyClick(company.id, company.name, 'search_map');
                }
                router.push(`/company/${company.id}`);
              }}
            />
          </View>
        ) : (
          <FlatList
            data={companies}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderCompanyItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <BannerSlot
                position="search_top"
                state={selectedState || undefined}
                city={selectedCity || undefined}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ThemedText type="subtitle">Nenhuma empresa encontrada</ThemedText>
                <ThemedText style={styles.emptySubtext} themeColor="textSecondary">
                  Tente alterar seus termos de busca ou filtros de localização.
                </ThemedText>
              </View>
            }
          />
        )}
        
        {/* Floating Action Button - Comparador e Leilão Reverso */}
        <View style={styles.fabWrapper}>
          {selectedCompanies.length > 0 && (
            <TouchableOpacity
              style={[styles.fabContainer, { backgroundColor: colors.success, marginBottom: 10 }]}
              activeOpacity={0.8}
              onPress={() => router.push('/compare')}
            >
              <View style={[styles.fabInner, { backgroundColor: 'transparent' }]}>
                <ThemedText style={[styles.fabText, { color: colors.backgroundElement }]}>
                  Ver Comparação ({selectedCompanies.length})
                </ThemedText>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.fabContainer}
            activeOpacity={0.8}
            onPress={() => router.push('/request-quote')}
          >
            <View style={styles.fabInner}>
              <Search size={20} color={colors.brandDarkBlue} style={{ marginRight: 6 }} />
              <ThemedText style={styles.fabText}>Receber Propostas</ThemedText>
            </View>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </ThemedView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 2,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.brandDarkBlue,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 23,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  filterToggle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  advancedFiltersContainer: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
  },
  filterRow: {
    marginBottom: Spacing.two,
  },
  pickerWrapper: {
    gap: 4,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  badgeScroll: {
    gap: Spacing.two,
    paddingVertical: 4,
  },
  filterBadge: {
    backgroundColor: 'rgba(142, 142, 147, 0.15)',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 15,
  },
  activeBadge: {
    backgroundColor: 'rgba(0, 62, 126, 0.15)',
  },
  badgeText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  activeBadgeText: {
    color: colors.brandDarkBlue,
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkboxLabel: {
    fontSize: 12,
  },
  clearText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: '600',
  },
  categoriesContainer: {
    paddingVertical: Spacing.two,
  },
  categoriesScroll: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  categoryBadgeSelect: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 18,
  },
  categoryBadgeTextSelect: {
    fontSize: 12,
    fontWeight: '600',
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  quickFiltersWrapper: {
    paddingVertical: 8,
    backgroundColor: colors.backgroundElement,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  quickFiltersScroll: {
    paddingHorizontal: Spacing.four,
    gap: 8,
  },
  quickFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElement,
  },
  quickFilterChipActive: {
    backgroundColor: colors.tint,
    borderColor: colors.tint,
  },
  quickFilterText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  horizontalCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    position: 'relative',
    marginBottom: 8,
  },
  horizontalLogo: {
    width: 90,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  horizontalLogoPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderChar: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.tint,
  },
  horizontalInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  horizontalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 24,
  },
  horizontalName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  horizontalRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  horizontalRatingText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  horizontalReviewCount: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  horizontalLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  horizontalLocationText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  horizontalTagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  benefitBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  benefitBadgeGreen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  benefitBadgeTextGreen: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
  },
  benefitBadgePurple: {
    backgroundColor: colors.backgroundElement,
    borderTopColor: colors.border,
  },
  benefitBadgeTextPurple: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  benefitBadgeGray: {
    backgroundColor: '#F9FAFB',
    borderColor: colors.border,
  },
  benefitBadgeTextGray: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  horizontalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  horizontalCompareBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  horizontalCompareBtnActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  horizontalCompareBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.tint,
  },
  horizontalFavBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 4,
  },
  emptyContainer: {
    paddingVertical: Spacing.six,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
  },
  fabWrapper: {
    position: 'absolute',
    bottom: Spacing.four,
    alignSelf: 'center',
    alignItems: 'center',
  },
  fabContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
    borderRadius: 30,
  },
  fabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.starYellow, // brandYellow
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    borderRadius: 30,
  },
  fabText: {
    color: colors.brandDarkBlue, // brandDarkBlue
    fontSize: 15,
    fontWeight: 'bold',
  }
});
