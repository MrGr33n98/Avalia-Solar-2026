import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  Search,
  MapPin,
  Star,
  ShieldCheck,
  Heart,
  ChevronDown,
  ChevronRight,
  Sun,
  Cpu,
  Battery,
  Wrench,
  Car,
  Bell,
  MessageSquare,
  Camera,
  BookOpen,
} from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { companiesApi, categoriesApi, Company } from '@/lib/api';
import { apolloClient } from '@/lib/apolloClient';
import { gql } from '@apollo/client';
import { useTracking } from '@/hooks/useTracking';

const { width } = Dimensions.get('window');

// Queries GraphQL
const GET_CATEGORIES_GRAPHQL = gql`
  query GetCategories {
    categories {
      id
      name
      slug
    }
  }
`;

const GET_COMPANIES_GRAPHQL = gql`
  query GetCompanies($state: String!) {
    companies(state: $state, limit: 10, sort: "recommended") {
      nodes {
        id
        name
        slug
        logoUrl
        ratingAvg
        reviewsCount
        isVerified
        isFeatured
        city
        state
        categories {
          id
          name
          slug
        }
      }
    }
  }
`;

// Ícones correspondentes a cada ID de categoria para exibir no Grid de Referência
const getCategoryIcon = (slug: string, color: string) => {
  switch (slug) {
    case 'energia-solar-residencial':
    case 'energia-solar':
    case 'paineis':
      return <Sun color={color} size={26} strokeWidth={2.2} />;
    case 'inversores':
      return <Cpu color={color} size={26} strokeWidth={2.2} />;
    case 'baterias':
      return <Battery color={color} size={26} strokeWidth={2.2} />;
    case 'instalacao':
      return <Wrench color={color} size={26} strokeWidth={2.2} />;
    case 'mobilidade-eletrica':
    case 'carregadores-veiculares':
      return <Car color={color} size={26} strokeWidth={2.2} />;
    default:
      return <Sun color={color} size={26} strokeWidth={2.2} />;
  }
};

export default function HomeScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('MT'); // Default Cuiabá - MT conforme a imagem
  const [selectedCity, setSelectedCity] = useState('Cuiabá');
  const [favorites, setFavorites] = useState<number[]>([]);
  const { trackCompanyClick } = useTracking();

  // Buscar categorias
  const { data: categories = [], isLoading: isLoadingCats } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const isGraphqlEnabled = process.env.EXPO_PUBLIC_GRAPHQL_HOME_ENABLED === 'true';
      if (isGraphqlEnabled) {
        try {
          console.log('[Home] Buscando categorias via GraphQL...');
          const { data } = await apolloClient.query({
            query: GET_CATEGORIES_GRAPHQL,
            fetchPolicy: 'cache-first',
          });
          return data.categories;
        } catch (err) {
          console.warn('[Home] Erro ao buscar categorias via GraphQL, caindo para REST:', err);
        }
      }
      return categoriesApi.getAll();
    },
  });

  // Buscar empresas em destaque / recomendadas
  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['companies-featured', selectedState],
    queryFn: async () => {
      const isGraphqlEnabled = process.env.EXPO_PUBLIC_GRAPHQL_HOME_ENABLED === 'true';
      if (isGraphqlEnabled) {
        try {
          console.log('[Home] Buscando empresas via GraphQL...');
          const { data } = await apolloClient.query({
            query: GET_COMPANIES_GRAPHQL,
            variables: { state: selectedState },
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
            verified: node.isVerified,
            featured: node.isFeatured,
            categories: node.categories || [],
          }));
        } catch (err) {
          console.warn('[Home] Erro ao buscar empresas via GraphQL, caindo para REST:', err);
        }
      }
      return companiesApi.getAll({ state: selectedState });
    },
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push({
        pathname: '/explore',
        params: { q: searchQuery },
      });
    }
  };

  const selectCategory = (id: number) => {
    router.push({
      pathname: '/explore',
      params: { category_id: id.toString() },
    });
  };

  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
    );
  };

  const displayCategories = categories.length > 0 ? categories : [
    { id: 1, name: 'Painéis', slug: 'energia-solar' },
    { id: 2, name: 'Inversores', slug: 'inversores' },
    { id: 3, name: 'Baterias', slug: 'baterias' },
    { id: 4, name: 'Instalação', slug: 'instalacao' },
    { id: 5, name: 'Mobilidade', slug: 'mobilidade-eletrica' },
  ];

  const displayCompanies = companies.length > 0 ? companies : mockReferencedCompanies;

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header Azul Escuro com atalhos de Chat/Notificações */}
        <View style={[styles.headerContainer, { backgroundColor: colors.brandDarkBlue }]}>
          <SafeAreaView edges={['top', 'left', 'right']}>
            <View style={styles.headerTitleRow}>
              <View style={{ width: 40 }} /> {/* Espaçador esquerdo para centralizar título */}
              <ThemedText style={styles.headerTitle}>Home</ThemedText>
              
              {/* Botões do Topo Superior Direito */}
              <View style={styles.headerIconsRight}>
                <TouchableOpacity onPress={() => router.push('/notifications')} style={{ marginRight: 14 }}>
                  <Bell color="#ffffff" size={20} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/chat')}>
                  <MessageSquare color="#ffffff" size={20} />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Seletor de localização */}
            <TouchableOpacity style={styles.locationSelector}>
              <MapPin size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <ThemedText style={styles.locationText}>{selectedCity} - {selectedState}</ThemedText>
              <ChevronDown size={14} color="#ffffff" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        {/* Input de busca flutuante com sombra */}
        <View style={styles.searchWrapper}>
          <View style={[styles.searchBox, { backgroundColor: colors.background }]}>
            <Search size={18} color="#8E8E93" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Busque uma categoria..."
              placeholderTextColor="#8E8E93"
              style={[styles.searchInput, { color: colors.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
          </View>
        </View>

        {/* Banners Úteis (Calculadora Solar e Scanner) */}
        <View style={styles.toolsContainer}>
          <TouchableOpacity
            style={[styles.toolBanner, { backgroundColor: '#003E7E' }]}
            onPress={() => router.push('/calculadora')}
          >
            <View style={styles.toolBannerLeft}>
              <Sun color="#ffffff" size={22} style={{ marginBottom: 4 }} />
              <ThemedText style={styles.toolBannerTitle}>Calculadora Solar</ThemedText>
              <ThemedText style={styles.toolBannerSubtitle}>Simule payback e placas</ThemedText>
            </View>
            <ChevronRight color="#ffffff" size={16} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolBanner, { backgroundColor: '#10B981' }]}
            onPress={() => router.push('/scanner')}
          >
            <View style={styles.toolBannerLeft}>
              <Camera color="#ffffff" size={22} style={{ marginBottom: 4 }} />
              <ThemedText style={styles.toolBannerTitle}>Escanear Conta</ThemedText>
              <ThemedText style={styles.toolBannerSubtitle}>Leitura rápida com câmera</ThemedText>
            </View>
            <ChevronRight color="#ffffff" size={16} />
          </TouchableOpacity>
        </View>

        {/* Bloco de Categorias */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Categorias</ThemedText>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {displayCategories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryItem}
              onPress={() => selectCategory(cat.id)}
            >
              <View style={[styles.categoryCircle, { borderColor: colors.brandDarkBlue, backgroundColor: colors.background }]}>
                {getCategoryIcon(cat.slug, colors.brandDarkBlue)}
              </View>
              <ThemedText style={styles.categoryName} numberOfLines={1}>
                {cat.name}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Recomendados para você em Grid de 2 colunas */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Recomendados para você</ThemedText>
        </View>

        {isLoadingCompanies ? (
          <ActivityIndicator color="#003E7E" style={{ marginVertical: Spacing.four }} />
        ) : (
          <View style={styles.gridContainer}>
            {displayCompanies.map((company) => {
              const isFav = favorites.includes(company.id);
              return (
                <TouchableOpacity
                  key={company.id}
                  style={[styles.gridCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => {
                    trackCompanyClick(company.id, company.name, 'home_recommendations');
                    router.push(`/company/${company.id}`);
                  }}
                >
                  {/* Favorito e Logo */}
                  <View style={styles.cardTopRow}>
                    {company.logo_url ? (
                      <Image source={{ uri: company.logo_url }} style={styles.companyLogo} />
                    ) : (
                      <View style={[styles.companyLogoPlaceholder, { backgroundColor: colors.backgroundSelected }]}>
                        {getCategoryIcon(company.categories?.[0]?.slug || 'energia-solar', colors.brandDarkBlue)}
                      </View>
                    )}
                    
                    <TouchableOpacity onPress={() => toggleFavorite(company.id)} style={styles.favoriteButton}>
                      <Heart
                        size={18}
                        color={isFav ? '#E53E3E' : '#8E8E93'}
                        fill={isFav ? '#E53E3E' : 'transparent'}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Informações da Empresa */}
                  <View style={styles.cardInfoContainer}>
                    <View style={styles.companyNameRow}>
                      <ThemedText style={styles.companyName} numberOfLines={1}>
                        {company.name}
                      </ThemedText>
                      {company.verified && (
                        <ShieldCheck size={14} color="#10B981" style={{ marginLeft: 2 }} />
                      )}
                    </View>
                    
                    <ThemedText style={styles.companySubname} numberOfLines={1}>
                      {company.name}
                    </ThemedText>

                    {/* Avaliação */}
                    <View style={styles.ratingRow}>
                      <Star size={12} color="#F59E0B" fill="#F59E0B" style={{ marginRight: 2 }} />
                      <ThemedText style={styles.ratingText}>
                        {company.rating ? company.rating.toFixed(1) : '4.5'}
                      </ThemedText>
                      <ThemedText style={styles.reviewCountText}>
                        ({company.review_count || 1})
                      </ThemedText>
                    </View>

                    {/* Preço de Orçamento Médio */}
                    <ThemedText style={styles.priceText}>
                      R$ {getPriceEstimate(company.id)}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Banner de Dicas e Guias Rápidos */}
        <TouchableOpacity
          style={[styles.guidesBanner, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
          onPress={() => router.push('/guides')}
        >
          <BookOpen color="#208AEF" size={20} style={{ marginRight: Spacing.three }} />
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.guidesBannerTitle}>Dicas & Guias de Energia</ThemedText>
            <ThemedText style={styles.guidesBannerSubtitle} themeColor="textSecondary">
              Esclareça suas dúvidas sobre placas e inversores
            </ThemedText>
          </View>
          <ChevronRight color="#8E8E93" size={16} />
        </TouchableOpacity>

      </ScrollView>
    </ThemedView>
  );
}

// Helper para obter preços mockados baseados no ID da empresa
const getPriceEstimate = (id: number) => {
  switch (id) {
    case 1:
      return '1.210,00';
    case 2:
      return '1.525,00';
    case 3:
      return '2.090,00';
    case 4:
      return '1.080,00';
    default:
      return '1.450,00';
  }
};

// Dados mockados de empresas conforme a imagem de referência
const mockReferencedCompanies: Company[] = [
  {
    id: 1,
    name: 'EcoEnergia Brasil',
    slug: 'ecoenergia-brasil',
    logo_url: null,
    rating: 4.8,
    review_count: 2,
    city: 'Cuiabá',
    state: 'MT',
    verified: true,
  },
  {
    id: 2,
    name: 'Volta Tech',
    slug: 'volta-tech',
    logo_url: null,
    rating: 4.5,
    review_count: 3,
    city: 'Cuiabá',
    state: 'MT',
    verified: false,
  },
  {
    id: 3,
    name: 'Solar Prime Cuiabá',
    slug: 'solar-prime-cuiaba',
    logo_url: null,
    rating: 4.9,
    review_count: 2,
    city: 'Cuiabá',
    state: 'MT',
    verified: true,
  },
  {
    id: 4,
    name: 'Global Solar',
    slug: 'global-solar',
    logo_url: null,
    rating: 4.9,
    review_count: 5,
    city: 'Cuiabá',
    state: 'MT',
    verified: true,
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.five,
  },
  headerContainer: {
    paddingBottom: 25,
    borderBottomLeftRadius: Spacing.four,
    borderBottomRightRadius: Spacing.four,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerIconsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.one,
  },
  locationText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchWrapper: {
    paddingHorizontal: Spacing.four,
    marginTop: -20, // Faz flutuar sobre o header
    marginBottom: Spacing.three,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 24,
    paddingHorizontal: Spacing.four,
    // Sombras do botão flutuante
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  toolsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    marginVertical: Spacing.two,
  },
  toolBanner: {
    flex: 1,
    borderRadius: 12,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  toolBannerLeft: {
    flex: 1,
    gap: 2,
  },
  toolBannerTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  toolBannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 9,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  categoriesContainer: {
    paddingLeft: Spacing.four,
    paddingRight: Spacing.two,
    gap: Spacing.three,
    paddingVertical: Spacing.one,
  },
  categoryItem: {
    alignItems: 'center',
    width: 68,
  },
  categoryCircle: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.four,
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  gridCard: {
    width: (width - Spacing.four * 2 - Spacing.three) / 2,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: Spacing.three,
    // Sombra suave
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.two,
  },
  companyLogo: {
    width: 36,
    height: 36,
    borderRadius: 6,
    resizeMode: 'cover',
  },
  companyLogoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    padding: 2,
  },
  cardInfoContainer: {
    gap: 2,
  },
  companyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyName: {
    fontSize: 13,
    fontWeight: 'bold',
    flex: 1,
  },
  companySubname: {
    fontSize: 10,
    color: '#8E8E93',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  reviewCountText: {
    fontSize: 10,
    color: '#8E8E93',
  },
  priceText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
    marginTop: Spacing.two,
  },
  guidesBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.four,
    marginTop: Spacing.four,
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
  },
  guidesBannerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  guidesBannerSubtitle: {
    fontSize: 10,
    marginTop: 2,
  },
});
