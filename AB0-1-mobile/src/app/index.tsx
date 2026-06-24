import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  RefreshControl,
  Modal,
  Switch,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/client/react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Search,
  MapPin,
  ChevronDown,
  ChevronRight,
  Sun,
  Camera,
  Bell,
  MessageSquare,
  SlidersHorizontal,
} from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { GET_HOME_DATA } from '@/lib/queries/home';
import { useTracking } from '@/hooks/useTracking';
import { HomeSkeleton } from '@/features/home/components/HomeSkeleton';
import { BannerCarousel } from '@/features/home/components/BannerCarousel';
import { CategoryScroll } from '@/features/home/components/CategoryScroll';
import { FeaturedCompanies } from '@/features/home/components/FeaturedCompanies';
import { LatestArticles } from '@/features/home/components/LatestArticles';
import { BannerSlot } from '@/components/BannerSlot';
import { useAuthStore } from '@/store/auth';

const { width } = Dimensions.get('window');

// Assets dos Ícones de Referência Copiados
const IconeCategorias = require('../../assets/icones/icone_categorias_avalia_solar.png');
const IconeDestaques = require('../../assets/icones/icone_destaques_avalia_solar.png');
const IconeInstalar = require('../../assets/icones/icone_instalar_avalia_solar_40x40.png');
const IconeProdutos = require('../../assets/icones/icone_produtos_avalia_solar_40x40.png');
const IconeAvaliacoes = require('../../assets/icones/icone_avaliacoes_avalia_solar.png');

const IconeResidencial = require('../../assets/images/icone-avalia-solar-residencial.png');
const IconeComercial = require('../../assets/images/comercial-icone-avalia-solar.png');
const IconeRural = require('../../assets/images/rural-icone-avalia-solar.png');

// Assets das Imagens de Produtos para o Grid OLX Style
const ImgInversor = require('../../assets/images/icon-inversor-avalia-solar.jpeg');
const ImgCarregador = require('../../assets/images/icon-carregador-avalia-solar.jpeg');
const ImgSuportes = require('../../assets/images/solo.png');
const ImgBaterias = require('../../assets/images/sistema-off-grid.png');
const ImgPaineis = require('../../assets/images/compare-solar-v1.png');
const ImgKits = require('../../assets/images/late.png');

export default function HomeScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const canUseP2PChat = user?.role === 'review';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('MT'); 
  const [selectedCity, setSelectedCity] = useState('Cuiabá');
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // State da Aba Ativa do Topo (Tudo, Residencial, Comercial, Rural)
  const [activeTab, setActiveTab] = useState('tudo');

  // States para o Modal de Filtros
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false);
  const [filterMinRating, setFilterMinRating] = useState<number>(0);
  
  const { trackCompanyClick } = useTracking();

  // Buscar localização do usuário ao abrir
  React.useEffect(() => {
    (async () => {
      try {
        // Verificar Onboarding primeiro
        const seenOnboarding = await AsyncStorage.getItem('@avalia_solar:seen_onboarding');
        if (!seenOnboarding) {
          router.replace('/onboarding');
          return;
        }

        // Verificar se já existe localização salva manualmente no AsyncStorage
        const savedCity = await AsyncStorage.getItem('@avalia_solar:selected_city');
        const savedState = await AsyncStorage.getItem('@avalia_solar:selected_state');
        if (savedCity && savedState) {
          setSelectedCity(savedCity);
          setSelectedState(savedState);
          setIsLocationLoading(false);
          return;
        }

        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setIsLocationLoading(false);
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
          setSelectedState(state);
          setSelectedCity(city);
          await AsyncStorage.setItem('@avalia_solar:selected_state', state);
          await AsyncStorage.setItem('@avalia_solar:selected_city', city);
        }
      } catch (error) {
        console.log('[GPS Error]', error);
      } finally {
        setIsLocationLoading(false);
      }
    })();
  }, []);

  // Buscar dados da Home via Apollo
  const { data, loading, error, refetch } = useQuery(GET_HOME_DATA, {
    variables: { city: selectedCity, state: selectedState },
    fetchPolicy: 'cache-and-network',
  });

  const handleSearch = () => {
    if (searchQuery.trim() || filterVerifiedOnly || filterMinRating > 0) {
      setIsFilterModalVisible(false);
      router.push({
        pathname: '/explore',
        params: { 
          q: searchQuery, 
          verified: filterVerifiedOnly ? 'true' : undefined,
          min_rating: filterMinRating > 0 ? filterMinRating.toString() : undefined
        },
      });
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
    );
  };

  const categories = data?.categories || [];
  const companies = data?.companies?.nodes || [];
  const banners = data?.banners || [];
  const articles = data?.articles?.nodes || [];

  // Filtragem local dinâmica das empresas baseada na aba ativa do topo
  const filteredCompanies = React.useMemo(() => {
    if (activeTab === 'tudo') return companies;
    if (activeTab === 'residencial') {
      return companies.filter((c: any, idx: number) => 
        c.name.toLowerCase().includes('residencial') || c.name.toLowerCase().includes('solar') || idx % 2 === 0
      );
    }
    if (activeTab === 'comercial') {
      return companies.filter((c: any, idx: number) => 
        c.name.toLowerCase().includes('comercial') || c.name.toLowerCase().includes('empresa') || idx % 2 !== 0
      );
    }
    if (activeTab === 'rural') {
      return companies.filter((c: any, idx: number) => 
        c.name.toLowerCase().includes('rural') || c.name.toLowerCase().includes('agro') || idx % 3 === 0
      );
    }
    return companies;
  }, [companies, activeTab]);

  if (loading && !data) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" style={{ marginTop: 50 }} color={colors.tint} />
      </ThemedView>
    );
  }

  // Definição das abas principais inspiradas na referência
  const HEADER_TABS = [
    { id: 'tudo', label: 'Tudo', icon: IconeCategorias },
    { id: 'residencial', label: 'Residencial', icon: IconeResidencial },
    { id: 'comercial', label: 'Comercial', icon: IconeComercial },
    { id: 'rural', label: 'Rural', icon: IconeRural }
  ];

  // Grid de atalhos de ações rápidas
  const QUICK_ACTIONS = [
    { 
      id: 'favoritos', 
      label: 'Favoritos', 
      icon: IconeDestaques, 
      action: () => router.push({ pathname: '/explore', params: { verified: 'true' }}) 
    },
    { 
      id: 'simulador', 
      label: 'Simulador', 
      icon: IconeAvaliacoes, 
      action: () => router.push('/calculadora') 
    },
    { 
      id: 'servicos', 
      label: 'Orçamentos', 
      icon: IconeInstalar, 
      action: () => router.push('/request-quote') 
    },
    { 
      id: 'produtos', 
      label: 'Produtos', 
      icon: IconeProdutos, 
      action: () => router.push('/products') 
    }
  ];

  // Grid de 6 cards de Equipamentos Solares (OLX Style)
  const EQUIPMENTS_GRID = [
    { 
      id: 'inversores', 
      label: 'Inversores no precinho', 
      image: ImgInversor, 
      isPNG: false,
      action: () => router.push({ pathname: '/explore', params: { q: 'inversor' }}) 
    },
    { 
      id: 'paineis', 
      label: 'Painéis a partir de R$ 300', 
      image: ImgPaineis, 
      isPNG: true,
      action: () => router.push('/compare') 
    },
    { 
      id: 'wallbox', 
      label: 'Wallbox em até 10x', 
      image: ImgCarregador, 
      isPNG: false,
      action: () => router.push({ pathname: '/explore', params: { category_id: '31' }}) 
    },
    { 
      id: 'baterias', 
      label: 'Baterias e Off-Grid', 
      image: ImgBaterias, 
      isPNG: true,
      action: () => router.push({ pathname: '/explore', params: { q: 'bateria' }}) 
    },
    { 
      id: 'suportes', 
      label: 'Estruturas com 40% OFF', 
      image: ImgSuportes, 
      isPNG: true,
      action: () => router.push({ pathname: '/explore', params: { q: 'estrutura' }}) 
    },
    { 
      id: 'kits', 
      label: 'Kits solares completos', 
      image: ImgKits, 
      isPNG: true,
      action: () => router.push('/request-quote') 
    }
  ];

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* 1. Header Fundo Branco Premium com Geolocalização e Sino com Badge */}
      <SafeAreaView edges={['top']} style={[styles.premiumHeader, { backgroundColor: colors.background }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity 
            style={styles.premiumLocation} 
            onPress={() => router.push('/select-location')}
            activeOpacity={0.7}
          >
            <MapPin size={18} color={colors.tint} style={{ marginRight: 6 }} />
            {isLocationLoading ? (
              <ActivityIndicator size="small" color={colors.tint} style={{ marginRight: 6 }} />
            ) : (
              <ThemedText style={styles.premiumLocationText}>{selectedCity} - {selectedState}</ThemedText>
            )}
            <ChevronRight size={14} color={colors.textSecondary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          <View style={styles.premiumHeaderIcons}>
            <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.notificationBtn}>
              <Bell color={colors.text} size={22} />
              {/* Badge vermelho flutuante estilo Shopee */}
              <View style={styles.notificationBadge}>
                <ThemedText style={styles.notificationBadgeText}>4</ThemedText>
              </View>
            </TouchableOpacity>
            {canUseP2PChat && (
              <TouchableOpacity onPress={() => router.push('/p2p_chat')} style={{ marginLeft: 16 }}>
                <MessageSquare color={colors.text} size={22} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.tint} />
        }
      >
        
        {/* 2. Abas do Topo (Tudo, Residencial, Comercial, Rural) */}
        <View style={styles.tabsContainer}>
          {HEADER_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.tabItem}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.8}
              >
                <Image source={tab.icon} style={styles.tabIcon} resizeMode="contain" />
                <ThemedText style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                  {tab.label}
                </ThemedText>
                {isActive && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 3. Barra de Pesquisa Cinza Claro Arredondada */}
        <View style={styles.premiumSearchWrapper}>
          <TouchableOpacity 
            style={styles.premiumSearchBox}
            onPress={() => router.push('/search')}
            activeOpacity={0.9}
          >
            <Search size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <ThemedText style={styles.premiumSearchPlaceholder}>
              Buscar no Avalia Solar...
            </ThemedText>
            <TouchableOpacity style={styles.premiumFilterButton} onPress={() => setIsFilterModalVisible(true)}>
              <SlidersHorizontal size={18} color={colors.tint} />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* 4. Grid de 4 Ações Rápidas Quadradas */}
        <View style={styles.quickActionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickActionCard}
              onPress={action.action}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIconWrapper}>
                <Image source={action.icon} style={styles.quickActionIcon} resizeMode="contain" />
              </View>
              <ThemedText style={styles.quickActionLabel}>{action.label}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* 5. Carrossel de Banners e Slot Patrocinado do Active Admin */}
        <BannerSlot position="home_hero" state={selectedState} city={selectedCity} />

        {banners.length > 0 && (
          <BannerCarousel banners={banners} />
        )}

        {/* 6. Grid de Equipamentos Solares (OLX Style) */}
        <View style={styles.equipmentSection}>
          <ThemedText style={styles.equipmentSectionTitle}>Na Avalia Solar, você encontra os melhores preços</ThemedText>
          <View style={styles.equipmentGrid}>
            {EQUIPMENTS_GRID.map((prod) => (
              <TouchableOpacity
                key={prod.id}
                style={styles.equipmentCard}
                onPress={prod.action}
                activeOpacity={0.85}
              >
                <View style={styles.equipmentImageWrapper}>
                  <Image 
                    source={prod.image} 
                    style={prod.isPNG ? styles.equipmentImagePng : styles.equipmentImage} 
                    resizeMode="contain" 
                  />
                </View>
                <View style={styles.equipmentCardFooter}>
                  <ThemedText style={styles.equipmentCardLabel} numberOfLines={1}>{prod.label}</ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 7. Integradores Recomendados Dinâmicos baseados na Aba Selecionada */}
        <View style={styles.premiumSectionHeader}>
          <View>
            <ThemedText style={styles.premiumSectionTitle}>
              {activeTab === 'tudo' ? 'Integradores Recomendados' : `Instaladores ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
            </ThemedText>
            <ThemedText style={styles.premiumSectionSubtitle}>
              Recomendações em {selectedCity} - {selectedState}
            </ThemedText>
          </View>
        </View>
        
        <FeaturedCompanies 
          companies={filteredCompanies}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onPress={(company) => {
            trackCompanyClick(company.id, company.name, 'home_recommendations');
            router.push(`/company/${company.slug}`);
          }}
        />

        {/* Blog Feed */}
        {articles.length > 0 && (
          <>
            <View style={styles.premiumSectionHeader}>
              <ThemedText style={styles.premiumSectionTitle}>Blog e Dicas Úteis</ThemedText>
            </View>
            <LatestArticles 
              articles={articles}
              onPress={(article) => router.push(`/blog/${article.slug}`)}
            />
          </>
        )}

      </ScrollView>

      {/* MODAL DE FILTROS AVANÇADOS */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isFilterModalVisible}
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Filtros de Busca</ThemedText>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                <ThemedText style={{ color: colors.textSecondary, fontSize: 24 }}>×</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.filterRow}>
              <View>
                <ThemedText style={styles.filterLabel}>Apenas Empresas Verificadas</ThemedText>
                <ThemedText style={styles.filterHint}>Maior segurança e confiabilidade</ThemedText>
              </View>
              <Switch 
                value={filterVerifiedOnly}
                onValueChange={setFilterVerifiedOnly}
                trackColor={{ false: colors.border, true: colors.tint }}
                thumbColor={colors.backgroundElement}
              />
            </View>

            <View style={styles.filterSection}>
              <ThemedText style={styles.filterLabel}>Avaliação Mínima</ThemedText>
              <View style={styles.ratingChips}>
                {[0, 3, 4, 4.5].map((rating) => (
                  <TouchableOpacity 
                    key={rating}
                    style={[
                      styles.ratingChip, 
                      filterMinRating === rating && { backgroundColor: colors.tint, borderColor: colors.tint }
                    ]}
                    onPress={() => setFilterMinRating(rating)}
                  >
                    <ThemedText style={[
                      styles.ratingChipText,
                      filterMinRating === rating && { color: colors.backgroundElement }
                    ]}>
                      {rating === 0 ? 'Qualquer' : `${rating}+ Estrelas`}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.applyButton, { backgroundColor: colors.tint }]}
              onPress={handleSearch}
            >
              <ThemedText style={styles.applyButtonText}>Aplicar Filtros</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.six,
  },
  premiumHeader: {
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
  },
  premiumLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 20,
  },
  premiumLocationText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  premiumHeaderIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationBtn: {
    position: 'relative',
    padding: 2,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: colors.danger,
    borderRadius: 9,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: colors.backgroundElement,
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    backgroundColor: colors.backgroundElement,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabItem: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
    paddingBottom: 4,
  },
  tabIcon: {
    width: 44,
    height: 44,
    marginBottom: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeTabLabel: {
    color: colors.text,
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 28,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: colors.text,
  },
  premiumSearchWrapper: {
    paddingHorizontal: Spacing.four,
    marginVertical: 16,
  },
  premiumSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    height: 46,
    borderRadius: 23,
    paddingHorizontal: 16,
  },
  premiumSearchPlaceholder: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 14,
  },
  premiumFilterButton: {
    padding: 6,
    backgroundColor: colors.backgroundElement,
    borderRadius: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    gap: 10,
    marginBottom: 16,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.backgroundElement,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionIconWrapper: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
  },
  quickActionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  equipmentSection: {
    paddingHorizontal: Spacing.four,
    marginVertical: 18,
  },
  equipmentSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 14,
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  equipmentCard: {
    width: (width - Spacing.four * 2 - 10) / 2,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  equipmentImageWrapper: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  equipmentImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  equipmentImagePng: {
    width: 70,
    height: 70,
  },
  equipmentCardFooter: {
    backgroundColor: colors.backgroundElement,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  equipmentCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  premiumSectionHeader: {
    paddingHorizontal: Spacing.four,
    marginTop: 18,
    marginBottom: 12,
  },
  premiumSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  premiumSectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.five,
    minHeight: 300,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.five,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.five,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSubtle,
    paddingBottom: Spacing.four,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  filterHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  filterSection: {
    marginBottom: Spacing.six,
  },
  ratingChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  ratingChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.backgroundElement,
  },
  ratingChipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  applyButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 'auto',
  },
  applyButtonText: {
    color: colors.backgroundElement,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
