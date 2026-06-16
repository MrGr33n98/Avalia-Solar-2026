import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/client';
import { useRouter } from 'expo-router';
import {
  Search,
  MapPin,
  ChevronDown,
  ChevronRight,
  Sun,
  Camera,
  Bell,
  MessageSquare,
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

export default function HomeScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('MT'); 
  const [selectedCity, setSelectedCity] = useState('Cuiabá');
  const [favorites, setFavorites] = useState<string[]>([]);
  const { trackCompanyClick } = useTracking();

  // Buscar dados da Home via Apollo
  const { data, loading, error, refetch } = useQuery(GET_HOME_DATA, {
    variables: { city: selectedCity, state: selectedState },
    fetchPolicy: 'cache-and-network',
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push({
        pathname: '/explore',
        params: { q: searchQuery },
      });
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
    );
  };

  if (loading && !data) {
    return (
      <ThemedView style={styles.container}>
        <HomeSkeleton />
      </ThemedView>
    );
  }

  const categories = data?.categories || [];
  const companies = data?.companies?.nodes || [];
  const banners = data?.banners || [];
  const articles = data?.articles?.nodes || [];

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.brandDarkBlue} />
        }
      >
        
        {/* Header Azul Escuro com atalhos de Chat/Notificações */}
        <View style={[styles.headerContainer, { backgroundColor: colors.brandDarkBlue }]}>
          <SafeAreaView edges={['top', 'left', 'right']}>
            <View style={styles.headerTitleRow}>
              <View style={{ width: 40 }} />
              <ThemedText style={styles.headerTitle}>Home</ThemedText>
              
              <View style={styles.headerIconsRight}>
                <TouchableOpacity onPress={() => router.push('/notifications')} style={{ marginRight: 14 }}>
                  <Bell color="#ffffff" size={20} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/chat')}>
                  <MessageSquare color="#ffffff" size={20} />
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity style={styles.locationSelector}>
              <MapPin size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <ThemedText style={styles.locationText}>{selectedCity} - {selectedState}</ThemedText>
              <ChevronDown size={14} color="#ffffff" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

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

        {/* Banners Reais ou Ferramentas Rápidas */}
        {banners.length > 0 ? (
          <BannerCarousel banners={banners} />
        ) : (
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
        )}

        {/* Categorias Reais */}
        {categories.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Categorias</ThemedText>
            </View>
            <CategoryScroll 
              categories={categories} 
              onSelect={(id) => router.push({ pathname: '/explore', params: { category_id: id }})} 
            />
          </>
        )}

        {/* Empresas em Destaque (Reais) */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Recomendados para você</ThemedText>
        </View>
        <FeaturedCompanies 
          companies={companies}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onPress={(company) => {
            trackCompanyClick(company.id, company.name, 'home_recommendations');
            router.push(`/company/${company.slug}`);
          }}
        />

        {/* Blog Feed (Real) */}
        {articles.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Blog Avalia Solar</ThemedText>
            </View>
            <LatestArticles 
              articles={articles}
              onPress={(article) => router.push(`/blog/${article.slug}`)}
            />
          </>
        )}

      </ScrollView>
    </ThemedView>
  );
}

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
    marginTop: -20, 
    marginBottom: Spacing.three,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 24,
    paddingHorizontal: Spacing.four,
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
});
