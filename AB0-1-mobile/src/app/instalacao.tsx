import React from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, Image, useColorScheme, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Wrench, Star, ShieldCheck, MapPin } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { companiesApi, Company } from '@/lib/api';

export default function InstalacaoScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();

  // Buscar empresas instaladoras (qualquer empresa na API)
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies-instalacao'],
    queryFn: () => companiesApi.getAll(),
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
            <Wrench size={24} color="#003E7E" />
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

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.header, { backgroundColor: colors.brandDarkBlue }]}>
          <ThemedText type="subtitle" style={styles.headerTitle}>Empresas Instaladoras</ThemedText>
          <ThemedText style={styles.headerSubtitle}>Projetistas, engenheiros e instaladores perto de você</ThemedText>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#208AEF" />
          </View>
        ) : (
          <FlatList
            data={companies.length > 0 ? companies : mockInstalacaoCompanies}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
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

const mockInstalacaoCompanies = [
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
  }
});
