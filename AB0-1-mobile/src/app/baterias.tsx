import React from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, Image, useColorScheme, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Battery, Star, ShieldCheck, MapPin, ArrowLeft } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { companiesApi, Company } from '@/lib/api';

export default function BateriasScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();

  // Buscar empresas que fornecem baterias
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies-baterias'],
    queryFn: () => companiesApi.getAll({ q: 'bateria' }), // Filtro simples
  });

  const renderItem = ({ item }: { item: Company }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.backgroundElement }]}
      onPress={() => router.push(`/company/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        {item.logo_url ? (
          <Image source={{ uri: item.logo_url }} style={styles.logo} />
        ) : (
          <View style={[styles.logoPlaceholder, { backgroundColor: colors.backgroundSelected }]}>
            <Battery size={24} color="#003E7E" />
          </View>
        )}
        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <ThemedText style={styles.companyName} numberOfLines={1}>
              {item.name}
            </ThemedText>
            {item.verified && <ShieldCheck size={16} color="#10B981" style={{ marginLeft: 4 }} />}
          </View>
          
          <View style={styles.ratingRow}>
            <Star size={14} color="#F59E0B" fill="#F59E0B" />
            <ThemedText style={styles.ratingText}>{item.rating ? item.rating.toFixed(1) : '5.0'}</ThemedText>
            <ThemedText style={styles.reviewCountText}>({item.review_count || 0})</ThemedText>
          </View>

          <View style={styles.locationRow}>
            <MapPin size={12} color="#8E8E93" />
            <ThemedText style={styles.locationText}>{item.city || 'São Paulo'} - {item.state || 'SP'}</ThemedText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const featuredProducts = [
    { id: '3', name: 'BYD Battery-Box HVS 7.7', price: 'R$ 23.400,00', rating: 4.9 },
  ];

  const renderProductsHeader = () => (
    <View style={styles.productsHeaderContainer}>
      <ThemedText style={styles.productsHeaderTitle}>Modelos Recomendados (Ficha Técnica)</ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productsScroll}>
        {featuredProducts.map((prod) => (
          <TouchableOpacity
            key={prod.id}
            style={[styles.productCard, { backgroundColor: colors.backgroundElement }]}
            onPress={() => router.push(`/products/${prod.id}`)}
          >
            <View style={styles.productIconWrapper}>
              <Battery size={24} color="#10B981" />
            </View>
            <ThemedText style={styles.productName} numberOfLines={1}>{prod.name}</ThemedText>
            <ThemedText style={styles.productPrice}>{prod.price}</ThemedText>
            <View style={styles.productRating}>
              <Star size={10} color="#F59E0B" fill="#F59E0B" />
              <ThemedText style={styles.productRatingText}>{prod.rating}</ThemedText>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ThemedText style={styles.productsHeaderTitle}>Instaladores Credenciados</ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.header, { backgroundColor: colors.brandDarkBlue }]}>
          <View style={styles.headerTitleRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <ArrowLeft color="#ffffff" size={22} />
            </TouchableOpacity>
            <ThemedText type="subtitle" style={styles.headerTitle}>Baterias & Off-Grid</ThemedText>
            <View style={{ width: 32 }} />
          </View>
          <ThemedText style={styles.headerSubtitle}>Sistemas de armazenamento e geradores solares</ThemedText>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#208AEF" />
          </View>
        ) : (
          <FlatList
            data={companies.length > 0 ? companies : mockBateriasCompanies}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            ListHeaderComponent={renderProductsHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <ThemedText>Nenhum fornecedor encontrado</ThemedText>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const mockBateriasCompanies = [
  {
    id: 21,
    name: 'BYD Energy Brasil',
    slug: 'byd-energy',
    logo_url: null,
    rating: 4.8,
    review_count: 56,
    city: 'Campinas',
    state: 'SP',
    verified: true,
  },
  {
    id: 22,
    name: 'Moura Acumuladores Solares',
    slug: 'moura-solar',
    logo_url: null,
    rating: 4.7,
    review_count: 28,
    city: 'Belo Horizonte',
    state: 'MG',
    verified: true,
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  card: {
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
    width: 50,
    height: 50,
    borderRadius: Spacing.two,
  },
  logoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  reviewCountText: {
    fontSize: 11,
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
  empty: {
    paddingVertical: Spacing.six,
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  backBtn: {
    padding: 4,
  },
  productsHeaderContainer: {
    marginBottom: Spacing.four,
  },
  productsHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: Spacing.three,
    marginTop: Spacing.two,
  },
  productsScroll: {
    gap: 12,
    paddingBottom: Spacing.three,
  },
  productCard: {
    width: 150,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
  },
  productIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  productPrice: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
    fontWeight: '600',
  },
  productRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  productRatingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
});
