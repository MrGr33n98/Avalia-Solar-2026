import React, { useState } from 'react';
import { Colors } from '@/constants/theme';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Star, ThumbsUp, MessageSquare } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { companiesApi, reviewsApi, Review } from '@/lib/api';

export default function CompanyReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();

  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  // Buscar dados da empresa
  const { data: company, isLoading: isLoadingCompany } = useQuery({
    queryKey: ['company-detail', id],
    queryFn: () => companiesApi.getByIdOrSlug(id!),
    enabled: !!id,
  });

  // Buscar reviews
  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: ['company-reviews', id],
    queryFn: () => (id ? reviewsApi.getByCompany(Number(id)) : Promise.resolve([])),
    enabled: !!id,
  });

  if (isLoadingCompany || isLoadingReviews) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.tint} />
        <ThemedText style={{ marginTop: Spacing.three }}>Carregando avaliações...</ThemedText>
      </ThemedView>
    );
  }

  // Estatísticas de distribuição
  const totalReviews = reviews.length;
  const ratingCounts = [0, 0, 0, 0, 0, 0]; // index 1 a 5
  reviews.forEach((r) => {
    const rate = Math.round(r.rating);
    if (rate >= 1 && rate <= 5) ratingCounts[rate]++;
  });

  const averageRating = company?.rating || 5.0;

  const filteredReviews = ratingFilter
    ? reviews.filter((r) => Math.round(r.rating) === ratingFilter)
    : reviews;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={colors.backgroundElement} size={24} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerTitle}>Avaliações</ThemedText>
          <ThemedText style={styles.headerSubtitle} numberOfLines={1}>
            {company?.name || 'Integrador'}
          </ThemedText>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Painel Geral de Score */}
        <View style={[styles.scorePanel, { backgroundColor: colors.backgroundElement }]}>
          <View style={styles.averageContainer}>
            <ThemedText style={styles.averageScoreText}>{averageRating.toFixed(1)}</ThemedText>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  color={colors.starYellow}
                  fill={star <= Math.round(averageRating) ? colors.starYellow : 'transparent'}
                />
              ))}
            </View>
            <ThemedText style={styles.totalReviewsText} themeColor="textSecondary">
              {totalReviews} avaliações
            </ThemedText>
          </View>

          {/* Gráfico de Distribuição */}
          <View style={styles.distributionContainer}>
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = ratingCounts[stars];
              const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <View key={stars} style={styles.distRow}>
                  <ThemedText style={styles.distStarText}>{stars}★</ThemedText>
                  <View style={[styles.distBarBg, { backgroundColor: colors.backgroundSelected }]}>
                    <View style={[styles.distBarFill, { width: `${pct}%`, backgroundColor: colors.starYellow }]} />
                  </View>
                  <ThemedText style={styles.distCountText} themeColor="textSecondary">
                    {count}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        </View>

        {/* Filtros Rápidos (Chips) */}
        <View style={styles.filtersSection}>
          <ThemedText style={styles.filtersLabel}>Filtrar por nota:</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                { backgroundColor: colors.backgroundElement },
                ratingFilter === null && { backgroundColor: colors.tint }
              ]}
              onPress={() => setRatingFilter(null)}
            >
              <ThemedText style={[styles.filterChipText, ratingFilter === null && { color: colors.backgroundElement, fontWeight: 'bold' }]}>
                Todas
              </ThemedText>
            </TouchableOpacity>

            {[5, 4, 3, 2, 1].map((star) => (
              <TouchableOpacity
                key={star}
                style={[
                  styles.filterChip,
                  { backgroundColor: colors.backgroundElement },
                  ratingFilter === star && { backgroundColor: colors.tint }
                ]}
                onPress={() => setRatingFilter(star)}
              >
                <ThemedText style={[styles.filterChipText, ratingFilter === star && { color: colors.backgroundElement, fontWeight: 'bold' }]}>
                  {star} Estrelas ({ratingCounts[star]})
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Listagem de Reviews */}
        <View style={styles.reviewsListSection}>
          {filteredReviews.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MessageSquare size={32} color={colors.textSecondary} style={{ marginBottom: 12 }} />
              <ThemedText style={styles.emptyText} themeColor="textSecondary">
                Nenhuma avaliação encontrada para este filtro.
              </ThemedText>
            </View>
          ) : (
            filteredReviews.map((review: Review) => (
              <View key={review.id} style={[styles.reviewCard, { borderBottomColor: colors.backgroundElement }]}>
                <View style={styles.cardHeader}>
                  <View>
                    <ThemedText style={styles.reviewerName}>{review.reviewer_name}</ThemedText>
                    <View style={styles.cardStars}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={12}
                          color={colors.starYellow}
                          fill={s <= review.rating ? colors.starYellow : 'transparent'}
                        />
                      ))}
                    </View>
                  </View>
                  <ThemedText style={styles.reviewDate} themeColor="textSecondary">
                    {review.created_at || 'Recente'}
                  </ThemedText>
                </View>

                {review.title ? (
                  <ThemedText style={styles.reviewTitle}>{review.title}</ThemedText>
                ) : null}

                {review.comment ? (
                  <ThemedText style={styles.reviewComment} themeColor="textSecondary">
                    {review.comment}
                  </ThemedText>
                ) : null}
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.backgroundElement,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.backgroundElement,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  scorePanel: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    gap: 20,
  },
  averageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.45,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingRight: 16,
  },
  averageScoreText: {
    fontSize: 44,
    fontWeight: '900',
    color: colors.brandDarkBlue,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginVertical: 6,
  },
  totalReviewsText: {
    fontSize: 12,
  },
  distributionContainer: {
    flex: 0.55,
    justifyContent: 'center',
    gap: 4,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distStarText: {
    fontSize: 11,
    width: 20,
    fontWeight: '600',
  },
  distBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  distBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  distCountText: {
    fontSize: 10,
    width: 20,
    textAlign: 'right',
  },
  filtersSection: {
    gap: 10,
    marginBottom: 20,
  },
  filtersLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginLeft: 4,
  },
  filtersScroll: {
    gap: 8,
    paddingHorizontal: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipText: {
    fontSize: 13,
  },
  reviewsListSection: {
    gap: 16,
  },
  reviewCard: {
    backgroundColor: colors.backgroundElement,
    borderRadius: 16,
    padding: 16,
    borderBottomWidth: 1,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardStars: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  reviewDate: {
    fontSize: 11,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: colors.backgroundElement,
  },
  reviewComment: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});
