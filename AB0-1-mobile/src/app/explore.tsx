import React, { useState, useEffect } from 'react';
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
import { Search, MapPin, Star, ShieldCheck, SlidersHorizontal, CheckCircle, ChevronDown } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { companiesApi, categoriesApi, Company } from '@/lib/api';
import { apolloClient } from '@/lib/apolloClient';
import { gql } from '@apollo/client';

const GET_COMPANIES_SEARCH_GRAPHQL = gql`
  query GetCompaniesSearch($q: String, $categoryId: ID, $state: String, $city: String, $verified: Boolean) {
    companies(q: $q, categoryId: $categoryId, state: $state, city: $city, verified: $verified, limit: 30) {
      nodes {
        id
        name
        slug
        logoUrl
        ratingAvg
        reviewsCount
        city
        state
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

  // Estados de Filtros
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

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
  };

  const renderCompanyItem = ({ item }: { item: Company }) => (
    <TouchableOpacity
      style={[styles.companyCard, { backgroundColor: colors.backgroundElement }]}
      onPress={() => router.push(`/company/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        {item.logo_url ? (
          <Image source={{ uri: item.logo_url }} style={styles.logo} />
        ) : (
          <View style={[styles.logoPlaceholder, { backgroundColor: colors.backgroundSelected }]}>
            <ThemedText style={styles.placeholderChar}>{item.name[0]}</ThemedText>
          </View>
        )}
        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <ThemedText style={styles.companyName} numberOfLines={1}>
              {item.name}
            </ThemedText>
            {item.verified && (
              <ShieldCheck size={16} color="#10B981" style={{ marginLeft: 4 }} />
            )}
          </View>

          <View style={styles.ratingRow}>
            <Star size={14} color="#F59E0B" fill="#F59E0B" />
            <ThemedText style={styles.ratingText}>
              {item.rating ? item.rating.toFixed(1) : '5.0'}
            </ThemedText>
            <ThemedText style={styles.reviewCountText}>
              ({item.review_count || 0} avaliações)
            </ThemedText>
          </View>

          <View style={styles.locationRow}>
            <MapPin size={12} color="#8E8E93" />
            <ThemedText style={styles.locationText} numberOfLines={1}>
              {item.city || 'São Paulo'} - {item.state || 'SP'}
            </ThemedText>
          </View>
        </View>
      </View>
      
      {item.description && (
        <ThemedText style={styles.descriptionText} numberOfLines={2} themeColor="textSecondary">
          {item.description}
        </ThemedText>
      )}

      {item.categories && item.categories.length > 0 && (
        <View style={styles.categoriesRow}>
          {item.categories.slice(0, 2).map((cat) => (
            <View key={cat.id} style={[styles.categoryBadge, { backgroundColor: colors.backgroundSelected }]}>
              <ThemedText style={styles.categoryBadgeText}>{cat.name}</ThemedText>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Barra de Busca e Filtros */}
        <View style={styles.searchHeader}>
          <View style={[styles.searchBox, { backgroundColor: colors.backgroundElement }]}>
            <Search size={18} color="#8E8E93" />
            <TextInput
              placeholder="Buscar por nome ou cidade..."
              placeholderTextColor="#8E8E93"
              style={[styles.searchInput, { color: colors.text }]}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity
            style={[styles.filterToggle, { backgroundColor: showFilters ? 'rgba(0, 62, 126, 0.1)' : colors.backgroundElement }]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={18} color={showFilters ? colors.brandDarkBlue : '#8E8E93'} />
          </TouchableOpacity>
        </View>

        {/* Filtros Avançados Expansíveis */}
        {showFilters && (
          <View style={[styles.advancedFiltersContainer, { borderBottomColor: colors.backgroundElement }]}>
            {/* Estado e Cidade */}
            <View style={styles.filterRow}>
              <View style={styles.pickerWrapper}>
                <ThemedText style={styles.filterLabel}>Estado</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeScroll}>
                  <TouchableOpacity
                    style={[styles.filterBadge, !selectedState && styles.activeBadge]}
                    onPress={() => { setSelectedState(''); setSelectedCity(''); }}
                  >
                    <ThemedText style={[styles.badgeText, !selectedState && styles.activeBadgeText]}>Todos</ThemedText>
                  </TouchableOpacity>
                  {(states.length > 0 ? states : ['SP', 'RJ', 'MG', 'PR']).map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[styles.filterBadge, selectedState === st && styles.activeBadge]}
                      onPress={() => { setSelectedState(st); setSelectedCity(''); }}
                    >
                      <ThemedText style={[styles.badgeText, selectedState === st && styles.activeBadgeText]}>{st}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {selectedState ? (
              <View style={styles.filterRow}>
                <View style={styles.pickerWrapper}>
                  <ThemedText style={styles.filterLabel}>Cidade</ThemedText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeScroll}>
                    <TouchableOpacity
                      style={[styles.filterBadge, !selectedCity && styles.activeBadge]}
                      onPress={() => setSelectedCity('')}
                    >
                      <ThemedText style={[styles.badgeText, !selectedCity && styles.activeBadgeText]}>Todas</ThemedText>
                    </TouchableOpacity>
                    {(cities.length > 0 ? cities : ['São Paulo', 'Campinas', 'Santos']).map((ct) => (
                      <TouchableOpacity
                        key={ct}
                        style={[styles.filterBadge, selectedCity === ct && styles.activeBadge]}
                        onPress={() => setSelectedCity(ct)}
                      >
                        <ThemedText style={[styles.badgeText, selectedCity === ct && styles.activeBadgeText]}>{ct}</ThemedText>
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
                <CheckCircle size={18} color={onlyVerified ? '#10B981' : '#8E8E93'} fill={onlyVerified ? '#10B981' : 'transparent'} />
                <ThemedText style={styles.checkboxLabel}>Apenas empresas certificadas (Verificadas)</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={clearFilters}>
                <ThemedText style={styles.clearText}>Limpar Filtros</ThemedText>
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
              <ThemedText style={[styles.categoryBadgeTextSelect, selectedCategory === null && { color: '#ffffff' }]}>
                Todas
              </ThemedText>
            </TouchableOpacity>

            {(categories.length > 0 ? categories : [
              { id: 1, name: 'Energia Solar', slug: 'energia-solar' },
              { id: 2, name: 'Mobilidade', slug: 'mobilidade-eletrica' },
              { id: 3, name: 'Off-Grid', slug: 'off-grid' },
              { id: 4, name: 'Usinas', slug: 'usina-solo' },
            ]).map((cat) => (
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
                    selectedCategory === cat.id && { color: '#ffffff' },
                    selectedCategory !== cat.id && { color: colors.text }
                  ]}
                >
                  {cat.name}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Listagem de Empresas */}
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.brandDarkBlue} />
            <ThemedText style={{ marginTop: Spacing.two }}>Buscando instaladores...</ThemedText>
          </View>
        ) : (
          <FlatList
            data={companies.length > 0 ? companies : mockExploreCompanies}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderCompanyItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
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
      </SafeAreaView>
    </ThemedView>
  );
}

// Mocks de fallback caso a API local não esteja operacional
const mockExploreCompanies: Company[] = [
  {
    id: 1,
    name: 'Solar SP Distribuidora',
    slug: 'solar-sp-distribuidora',
    logo_url: null,
    rating: 4.9,
    review_count: 32,
    city: 'São Paulo',
    state: 'SP',
    verified: true,
    description: 'Empresa especializada em soluções de energia solar residencial e comercial de grande porte com financiamento facilitado.',
    categories: [{ id: 1, name: 'Energia Solar', slug: 'energia-solar' }]
  },
  {
    id: 2,
    name: 'EcoVolt Engenharia',
    slug: 'ecovolt-engenharia',
    logo_url: null,
    rating: 4.8,
    review_count: 18,
    city: 'Campinas',
    state: 'SP',
    verified: true,
    description: 'Instalação de carregadores veiculares rápidos para condomínios residenciais e frotas de empresas.',
    categories: [{ id: 2, name: 'Mobilidade', slug: 'mobilidade-eletrica' }]
  },
  {
    id: 3,
    name: 'SunPower Soluções',
    slug: 'sunpower-solucoes',
    logo_url: null,
    rating: 4.7,
    review_count: 24,
    city: 'Ribeirão Preto',
    state: 'SP',
    verified: false,
    description: 'Projetos off-grid sob medida para sítios, fazendas e locais isolados da rede elétrica tradicional.',
    categories: [{ id: 3, name: 'Off-Grid', slug: 'off-grid' }]
  },
  {
    id: 4,
    name: 'Usinas Verdes SA',
    slug: 'usinas-verdes-sa',
    logo_url: null,
    rating: 4.5,
    review_count: 8,
    city: 'São José dos Campos',
    state: 'SP',
    verified: true,
    description: 'Construção de usinas solares de solo para compensação e geração compartilhada.',
    categories: [{ id: 4, name: 'Usinas', slug: 'usina-solo' }]
  }
];

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
    color: '#8E8E93',
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
    color: '#8E8E93',
  },
  activeBadgeText: {
    color: '#003E7E',
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
    color: '#E53E3E',
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
  companyCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(142, 142, 147, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: Spacing.two,
    resizeMode: 'cover',
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderChar: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003E7E',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  reviewCountText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    color: '#8E8E93',
  },
  descriptionText: {
    fontSize: 12,
    marginTop: Spacing.two,
    lineHeight: 16,
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#8E8E93',
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
});
