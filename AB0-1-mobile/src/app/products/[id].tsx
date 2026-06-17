import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Star, Heart, Sun, Battery, Sparkles } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useQuery } from '@tanstack/react-query';
import { useCompareStore } from '@/store/compare';
import { productsApi } from '@/lib/api';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();

  // Buscar produto da API real
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getById(id as string),
    enabled: !!id,
  });

  if (isLoading || !product) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ThemedText>Carregando produto...</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.backgroundElement }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.surfaceSubtle }]} onPress={() => router.back()}>
          <ArrowLeft color={colors.backgroundElement} size={24} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: colors.text }]}>Detalhes do Produto</ThemedText>
        <TouchableOpacity style={[styles.favoriteButton, { backgroundColor: colors.surfaceSubtle }]}>
          <Heart color="#475569" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Imagem do Produto */}
        <View style={styles.imageContainer}>
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.backgroundSelected }]}>
            {product.category === 'Inversores' ? (
              <Sun color={colors.tint} size={96} />
            ) : (
              <Battery color={colors.success} size={96} />
            )}
          </View>
        </View>

        {/* Informações Principais */}
        <View style={styles.mainInfo}>
          <ThemedText style={[styles.brandText, { color: colors.tint }]}>{product.brand}</ThemedText>
          <ThemedText type="subtitle" style={[styles.nameText, { color: colors.text }]}>{product.name}</ThemedText>
          
          <View style={styles.ratingRow}>
            <Star size={16} color={colors.starYellow} fill={colors.starYellow} />
            <ThemedText style={styles.ratingText}>{product.rating.toFixed(1)}</ThemedText>
            <ThemedText style={styles.categoryBadge} themeColor="textSecondary">
              {product.category}
            </ThemedText>
          </View>

          <ThemedText style={[styles.priceText, { color: colors.text }]}>{product.price}</ThemedText>
        </View>

        {/* Descrição */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Descrição</ThemedText>
          <ThemedText style={styles.descText} themeColor="textSecondary">
            {product.description}
          </ThemedText>
        </View>

        {/* Destaques */}
        <View style={styles.highlightsContainer}>
          <View style={[styles.highlightCard, { backgroundColor: colors.backgroundElement }]}>
            <ThemedText style={styles.highlightVal}>{product.power}</ThemedText>
            <ThemedText style={styles.highlightLbl}>Potência</ThemedText>
          </View>
          <View style={[styles.highlightCard, { backgroundColor: colors.backgroundElement }]}>
            <ThemedText style={styles.highlightVal}>{product.efficiency}</ThemedText>
            <ThemedText style={styles.highlightLbl}>Eficiência</ThemedText>
          </View>
          <View style={[styles.highlightCard, { backgroundColor: colors.backgroundElement }]}>
            <ThemedText style={styles.highlightVal}>{product.warranty}</ThemedText>
            <ThemedText style={styles.highlightLbl}>Garantia</ThemedText>
          </View>
        </View>

        {/* Especificações Técnicas */}
        <View style={styles.section}>
          <View style={styles.specsHeader}>
            <Sparkles size={16} color={colors.tint} />
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Ficha Técnica</ThemedText>
          </View>

          <View style={styles.specsTable}>
            {product.specs && Object.entries(product.specs).map(([key, val], idx) => (
              <View key={idx} style={[styles.specsRow, { borderBottomColor: colors.backgroundSelected }]}>
                <ThemedText style={styles.specKey} themeColor="textSecondary">{key}</ThemedText>
                <ThemedText style={styles.specVal}>{String(val)}</ThemedText>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* Footer com botões de cotação / comparador */}
      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.backgroundElement }]}>
        <TouchableOpacity 
          style={[styles.compareButton, { borderColor: colors.tint }]}
          onPress={() => router.push('/compare')}
        >
          <ThemedText style={[styles.compareButtonText, { color: colors.tint }]}>Comparar</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.quoteButton, { backgroundColor: colors.brandDarkBlue || colors.brandDarkBlue }]}
          onPress={() => router.push('/request-quote')}
        >
          <ThemedText style={styles.quoteButtonText}>Solicitar Orçamento</ThemedText>
        </TouchableOpacity>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  imageContainer: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainInfo: {
    marginBottom: 20,
  },
  brandText: {
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  nameText: {
    fontSize: 22,
    fontWeight: '800',
    marginVertical: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  categoryBadge: {
    fontSize: 12,
    marginLeft: 6,
  },
  priceText: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 8,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  descText: {
    fontSize: 14,
    lineHeight: 22,
  },
  highlightsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginVertical: 16,
  },
  highlightCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
  },
  highlightVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  highlightLbl: {
    fontSize: 11,
    marginTop: 4,
  },
  specsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  specsTable: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  specsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  specKey: {
    fontSize: 13,
  },
  specVal: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
  },
  compareButton: {
    flex: 0.35,
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  compareButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  quoteButton: {
    flex: 0.65,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  quoteButtonText: {
    color: colors.backgroundElement,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
