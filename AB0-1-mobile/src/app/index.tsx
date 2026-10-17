import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@apollo/client/react';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  ChevronRight,
  Grid2X2,
  Heart,
  MapPin,
  MessageSquare,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  type DiscoveryCategory,
  OFFICIAL_MAIN_CATEGORIES,
  OFFICIAL_SOLUTION_TYPES,
} from '@/constants/category-visual-assets';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { BannerCarousel } from '@/features/home/components/BannerCarousel';
import { BrandScroll, type BrandCompany } from '@/features/home/components/BrandScroll';
import { CategoryScroll } from '@/features/home/components/CategoryScroll';
import {
  FeaturedCompanies,
  type FeaturedCompany,
} from '@/features/home/components/FeaturedCompanies';
import { HomeSkeleton } from '@/features/home/components/HomeSkeleton';
import { LatestArticles } from '@/features/home/components/LatestArticles';
import { useTracking } from '@/hooks/useTracking';
import { getBannerAudienceKey } from '@/lib/banner-audience';
import { GET_HOME_DATA } from '@/lib/queries/home';
import { useAuthStore } from '@/store/auth';

interface HomeCategory extends DiscoveryCategory {
  children?: HomeCategory[];
}

interface HomeBanner {
  id: string;
  imageUrl: string;
  linkUrl?: string;
  deliveryId?: string | null;
  sponsored?: boolean;
}

interface HomeArticle {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverUrl?: string;
}

interface HomeData {
  categories?: HomeCategory[];
  companies?: { nodes?: FeaturedCompany[] };
  banners?: HomeBanner[];
  articles?: { nodes?: HomeArticle[] };
}

function uniqueCategories(categories: HomeCategory[]) {
  return Array.from(new Map(categories.map((category) => [category.id, category])).values());
}

function normalizeCategoryKey(value?: string | null) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
}

function enrichOfficialCategories(
  officialCategories: DiscoveryCategory[],
  apiCategories: HomeCategory[]
) {
  return officialCategories.map((official) => {
    const match = apiCategories.find((category) => {
      const categorySlug = normalizeCategoryKey(category.slug || category.name);
      return (
        categorySlug === normalizeCategoryKey(official.slug) ||
        categorySlug === normalizeCategoryKey(official.name)
      );
    });

    return match ? { ...official, ...match } : official;
  });
}

export default function HomeScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const categoriesOffset = useRef(0);
  const companiesOffset = useRef(0);
  const user = useAuthStore((state) => state.user);
  const canUseP2PChat = user?.role === 'review';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false);
  const [filterMinRating, setFilterMinRating] = useState(0);
  const [audienceKey, setAudienceKey] = useState<string | null | undefined>(undefined);
  const { trackCompanyClick } = useTracking();

  useEffect(() => {
    let isMounted = true;

    const loadLocation = async () => {
      try {
        const seenOnboarding = await AsyncStorage.getItem('@avalia_solar:seen_onboarding');
        if (!seenOnboarding) {
          router.replace('/onboarding');
          return;
        }

        const savedCity = await AsyncStorage.getItem('@avalia_solar:selected_city');
        const savedState = await AsyncStorage.getItem('@avalia_solar:selected_state');
        if (savedCity && savedState) {
          if (isMounted) {
            setSelectedCity(savedCity);
            setSelectedState(savedState);
          }
          return;
        }

        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') return;

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const addresses = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        const address = addresses[0];
        const city = address?.subregion || address?.city || '';
        const state = address?.region || '';

        if (city && state) {
          if (isMounted) {
            setSelectedCity(city);
            setSelectedState(state);
          }
          await AsyncStorage.multiSet([
            ['@avalia_solar:selected_city', city],
            ['@avalia_solar:selected_state', state],
          ]);
        }
      } catch (locationError) {
        console.warn('[Home] Não foi possível obter a localização:', locationError);
      } finally {
        if (isMounted) setIsLocationLoading(false);
      }
    };

    void loadLocation();
    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    getBannerAudienceKey()
      .then(setAudienceKey)
      .catch(() => setAudienceKey(null));
  }, []);

  const { data, loading, error, refetch } = useQuery(GET_HOME_DATA, {
    variables: {
      city: selectedCity || undefined,
      state: selectedState || undefined,
      audienceKey,
    },
    fetchPolicy: 'cache-and-network',
    skip: audienceKey === undefined,
  });

  const homeData = data as HomeData | undefined;
  const apiCategories = useMemo(() => homeData?.categories || [], [homeData?.categories]);
  const companies = useMemo(() => homeData?.companies?.nodes || [], [homeData?.companies?.nodes]);
  const banners = homeData?.banners || [];
  const articles = homeData?.articles?.nodes || [];

  const mainCategories = useMemo<DiscoveryCategory[]>(() => {
    const roots = apiCategories.filter((category) => !category.parentId);
    return enrichOfficialCategories(OFFICIAL_MAIN_CATEGORIES, roots);
  }, [apiCategories]);

  const solutionTypes = useMemo<DiscoveryCategory[]>(() => {
    const children = apiCategories.flatMap((category) => category.children || []);
    const directChildren = apiCategories.filter((category) => Boolean(category.parentId));
    const solutions = uniqueCategories([...children, ...directChildren]);
    return enrichOfficialCategories(OFFICIAL_SOLUTION_TYPES, solutions);
  }, [apiCategories]);

  const displayedCompanies = useMemo(
    () =>
      showFavoritesOnly ? companies.filter((company) => favorites.includes(company.id)) : companies,
    [companies, favorites, showFavoritesOnly]
  );

  const displayLocation =
    selectedCity && selectedState ? `${selectedCity} - ${selectedState}` : 'Escolher localização';
  const isInitialLoading = audienceKey === undefined || (loading && !homeData);

  const toggleFavorite = (id: string) => {
    setFavorites((current) =>
      current.includes(id) ? current.filter((favoriteId) => favoriteId !== id) : [...current, id]
    );
  };

  const navigateToCategory = (category: DiscoveryCategory) => {
    const isApiId = /^\d+$/.test(category.id);
    router.push({
      pathname: '/explore',
      params: isApiId ? { category_id: category.id } : { q: category.name },
    });
  };

  const handleSearch = () => {
    const params: Record<string, string> = {};
    if (searchQuery.trim()) params.q = searchQuery.trim();
    if (filterVerifiedOnly) params.verified = 'true';
    if (filterMinRating > 0) params.min_rating = String(filterMinRating);
    setIsFilterModalVisible(false);
    router.push({ pathname: '/explore', params });
  };

  const scrollTo = (offset: React.MutableRefObject<number>) => {
    scrollRef.current?.scrollTo({ y: Math.max(offset.current - Spacing.two, 0), animated: true });
  };

  const toggleFavoritesView = () => {
    setShowFavoritesOnly((current) => !current);
    scrollTo(companiesOffset);
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView
        edges={['top']}
        style={[
          styles.header,
          { backgroundColor: colors.backgroundElement, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable
            style={({ pressed }) => [
              styles.locationButton,
              { backgroundColor: colors.surfaceSubtle, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => router.push('/select-location')}
            accessibilityRole="button"
            accessibilityLabel={`Localização: ${displayLocation}`}
          >
            <MapPin size={19} color={colors.tint} accessibilityElementsHidden />
            {isLocationLoading ? (
              <ActivityIndicator size="small" color={colors.tint} />
            ) : (
              <ThemedText style={[styles.locationText, { color: colors.text }]} numberOfLines={1}>
                {displayLocation}
              </ThemedText>
            )}
            <ChevronRight size={16} color={colors.textSecondary} accessibilityElementsHidden />
          </Pressable>

          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push('/notifications')}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel="Notificações"
            >
              <Bell color={colors.text} size={23} />
            </Pressable>
            {canUseP2PChat ? (
              <Pressable
                onPress={() => router.push('/p2p_chat')}
                style={styles.iconButton}
                accessibilityRole="button"
                accessibilityLabel="Mensagens"
              >
                <MessageSquare color={colors.text} size={23} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading && Boolean(homeData)}
            onRefresh={refetch}
            tintColor={colors.tint}
          />
        }
      >
        <View style={styles.searchWrapper}>
          <View
            style={[
              styles.searchBox,
              { backgroundColor: colors.backgroundElement, borderColor: colors.border },
            ]}
          >
            <Search size={20} color={colors.textSecondary} accessibilityElementsHidden />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              placeholder="Buscar empresas e soluções"
              placeholderTextColor={colors.textSecondary}
              returnKeyType="search"
              style={[styles.searchInput, { color: colors.text }]}
              accessibilityLabel="Buscar empresas e soluções"
            />
            <Pressable
              style={styles.searchFilterButton}
              onPress={() => setIsFilterModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Abrir filtros"
              hitSlop={4}
            >
              <SlidersHorizontal size={21} color={colors.tint} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.discoveryActions, { borderColor: colors.border }]}>
          <Pressable
            onPress={() => scrollTo(categoriesOffset)}
            style={({ pressed }) => [styles.discoveryAction, { opacity: pressed ? 0.65 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Ir para categorias"
          >
            <Grid2X2 size={21} color={colors.tint} />
            <ThemedText style={[styles.discoveryActionLabel, { color: colors.text }]}>
              Categorias
            </ThemedText>
          </Pressable>
          <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />
          <Pressable
            onPress={toggleFavoritesView}
            style={({ pressed }) => [styles.discoveryAction, { opacity: pressed ? 0.65 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Mostrar empresas favoritas"
            accessibilityState={{ selected: showFavoritesOnly }}
          >
            <Heart
              size={21}
              color={showFavoritesOnly ? colors.danger : colors.textSecondary}
              fill={showFavoritesOnly ? colors.danger : colors.backgroundElement}
            />
            <ThemedText style={[styles.discoveryActionLabel, { color: colors.text }]}>
              Favoritos{favorites.length ? ` (${favorites.length})` : ''}
            </ThemedText>
          </Pressable>
          <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />
          <Pressable
            onPress={() => setIsFilterModalVisible(true)}
            style={({ pressed }) => [styles.discoveryAction, { opacity: pressed ? 0.65 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Abrir filtros"
          >
            <SlidersHorizontal size={21} color={colors.textSecondary} />
            <ThemedText style={[styles.discoveryActionLabel, { color: colors.text }]}>
              Filtros
            </ThemedText>
          </Pressable>
        </View>

        {isInitialLoading ? (
          <HomeSkeleton />
        ) : error && !homeData ? (
          <View style={styles.feedbackContainer}>
            <ThemedText style={[styles.feedbackTitle, { color: colors.text }]}>
              Não foi possível carregar a vitrine.
            </ThemedText>
            <Pressable
              onPress={() => void refetch()}
              style={[styles.retryButton, { backgroundColor: colors.tint }]}
              accessibilityRole="button"
              accessibilityLabel="Tentar carregar novamente"
            >
              <ThemedText style={[styles.retryLabel, { color: colors.onTint }]}>
                Tentar novamente
              </ThemedText>
            </Pressable>
          </View>
        ) : (
          <>
            <View
              onLayout={(event) => {
                categoriesOffset.current = event.nativeEvent.layout.y;
              }}
              style={styles.section}
            >
              <View style={styles.sectionHeader}>
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                  Categorias em destaque
                </ThemedText>
              </View>
              <CategoryScroll
                categories={mainCategories}
                onSelect={navigateToCategory}
                accessibilityLabel="Categorias principais"
              />
            </View>

            {banners.length ? <BannerCarousel banners={banners} audienceKey={audienceKey} /> : null}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                  Tipos de solução
                </ThemedText>
                <ThemedText style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  Tecnologias e serviços do catálogo, não ofertas comerciais.
                </ThemedText>
              </View>
              <CategoryScroll
                categories={solutionTypes}
                onSelect={navigateToCategory}
                accessibilityLabel="Tipos de solução"
              />
            </View>

            {companies.some((company) => Boolean(company.logoUrl?.trim())) ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                    Marcas em destaque
                  </ThemedText>
                </View>
                <BrandScroll
                  companies={companies as BrandCompany[]}
                  onSelect={(company) => router.push(`/company/${company.slug}`)}
                />
              </View>
            ) : null}

            <View
              onLayout={(event) => {
                companiesOffset.current = event.nativeEvent.layout.y;
              }}
              style={styles.section}
            >
              <View style={styles.sectionHeader}>
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                  {showFavoritesOnly ? 'Empresas favoritas' : 'Empresas em destaque'}
                </ThemedText>
                {selectedCity && selectedState ? (
                  <ThemedText style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                    Em {selectedCity} - {selectedState}
                  </ThemedText>
                ) : null}
              </View>

              {showFavoritesOnly && !displayedCompanies.length ? (
                <View
                  style={[
                    styles.emptyState,
                    { backgroundColor: colors.backgroundElement, borderColor: colors.border },
                  ]}
                >
                  <Heart size={28} color={colors.textSecondary} />
                  <ThemedText style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                    Você ainda não marcou nenhuma empresa como favorita.
                  </ThemedText>
                  <Pressable
                    onPress={() => setShowFavoritesOnly(false)}
                    style={[styles.showAllButton, { borderColor: colors.border }]}
                    accessibilityRole="button"
                  >
                    <ThemedText style={[styles.showAllLabel, { color: colors.tint }]}>
                      Ver empresas em destaque
                    </ThemedText>
                  </Pressable>
                </View>
              ) : (
                <FeaturedCompanies
                  companies={displayedCompanies}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                  onPress={(company) => {
                    trackCompanyClick(company.id, company.name, 'home_featured');
                    router.push(`/company/${company.slug}`);
                  }}
                />
              )}
            </View>

            {articles.length ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                    Guias e novidades
                  </ThemedText>
                </View>
                <LatestArticles
                  articles={articles}
                  onPress={(article) => router.push(`/blog/${article.slug}`)}
                />
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        statusBarTranslucent
        visible={isFilterModalVisible}
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View
            style={[styles.modalContent, Shadows.lg, { backgroundColor: colors.backgroundElement }]}
          >
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
                Filtros de busca
              </ThemedText>
              <Pressable
                onPress={() => setIsFilterModalVisible(false)}
                style={styles.iconButton}
                accessibilityRole="button"
                accessibilityLabel="Fechar filtros"
              >
                <X size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
              <View style={styles.filterCopy}>
                <ThemedText style={[styles.filterLabel, { color: colors.text }]}>
                  Apenas empresas verificadas
                </ThemedText>
                <ThemedText style={[styles.filterHint, { color: colors.textSecondary }]}>
                  Exibe somente perfis com verificação.
                </ThemedText>
              </View>
              <Switch
                value={filterVerifiedOnly}
                onValueChange={setFilterVerifiedOnly}
                trackColor={{ false: colors.border, true: colors.tint }}
                thumbColor={colors.onTint}
                accessibilityLabel="Apenas empresas verificadas"
              />
            </View>

            <View style={styles.filterSection}>
              <ThemedText style={[styles.filterLabel, { color: colors.text }]}>
                Avaliação mínima
              </ThemedText>
              <View style={styles.ratingChips}>
                {[0, 3, 4, 4.5].map((rating) => {
                  const isSelected = filterMinRating === rating;
                  return (
                    <Pressable
                      key={rating}
                      style={[
                        styles.ratingChip,
                        {
                          backgroundColor: isSelected ? colors.tint : colors.backgroundElement,
                          borderColor: isSelected ? colors.tint : colors.border,
                        },
                      ]}
                      onPress={() => setFilterMinRating(rating)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                    >
                      <ThemedText
                        style={[
                          styles.ratingChipText,
                          { color: isSelected ? colors.onTint : colors.textSecondary },
                        ]}
                      >
                        {rating === 0 ? 'Qualquer' : `${rating}+ estrelas`}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.applyButton,
                { backgroundColor: colors.tint, opacity: pressed ? 0.75 : 1 },
              ]}
              onPress={handleSearch}
              accessibilityRole="button"
            >
              <ThemedText style={[styles.applyButtonText, { color: colors.onTint }]}>
                Aplicar filtros
              </ThemedText>
            </Pressable>
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
  header: {
    borderBottomWidth: 1,
    paddingBottom: Spacing.two,
  },
  headerRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  locationButton: {
    minWidth: 0,
    minHeight: 44,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: Spacing.six,
  },
  searchWrapper: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  searchBox: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.one,
  },
  searchInput: {
    minHeight: 46,
    flex: 1,
    fontSize: 14,
  },
  searchFilterButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoveryActions: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.three,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.two,
  },
  discoveryAction: {
    minHeight: 48,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.one,
  },
  discoveryActionLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionDivider: {
    width: 1,
    height: 28,
  },
  section: {
    marginTop: Spacing.four,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.two,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '800',
  },
  sectionSubtitle: {
    marginTop: Spacing.one,
    fontSize: 12,
    lineHeight: 17,
  },
  feedbackContainer: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 44,
    marginTop: Spacing.three,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  retryLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    minHeight: 180,
    marginHorizontal: Spacing.four,
    borderWidth: 1,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  emptyStateText: {
    marginTop: Spacing.two,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  showAllButton: {
    minHeight: 44,
    marginTop: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  showAllLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    minHeight: 330,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.four,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.four,
    borderBottomWidth: 1,
    paddingBottom: Spacing.four,
  },
  filterCopy: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  filterHint: {
    marginTop: Spacing.one,
    fontSize: 12,
  },
  filterSection: {
    marginBottom: Spacing.five,
  },
  ratingChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  ratingChip: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  ratingChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  applyButton: {
    minHeight: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
