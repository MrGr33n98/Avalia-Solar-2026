import React from 'react';
import { Dimensions, Pressable, StyleSheet, View, useColorScheme } from 'react-native';
import { Image } from 'expo-image';
import { ArrowLeftRight, Building2, Heart, ShieldCheck, Star } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { useCompareStore } from '@/store/compare';

const { width } = Dimensions.get('window');

export interface FeaturedCompany {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  ratingAvg?: number | null;
  reviewsCount?: number | null;
  isVerified?: boolean;
  city?: string | null;
  state?: string | null;
}

interface FeaturedCompaniesProps {
  companies: FeaturedCompany[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onPress: (company: FeaturedCompany) => void;
}

export const FeaturedCompanies = ({
  companies,
  favorites,
  onToggleFavorite,
  onPress,
}: FeaturedCompaniesProps) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const selectedCompanies = useCompareStore((state) => state.selectedCompanies);
  const addCompany = useCompareStore((state) => state.addCompany);
  const removeCompany = useCompareStore((state) => state.removeCompany);
  const visibleCompanies = companies.slice(0, 6);

  if (!visibleCompanies.length) return null;

  return (
    <View style={styles.gridContainer}>
      {visibleCompanies.map((company) => {
        const isFavorite = favorites.includes(company.id);
        const isComparing = selectedCompanies.some((item) => item.id === company.id);
        const compareLimitReached = !isComparing && selectedCompanies.length >= 3;
        const location = [company.city, company.state].filter(Boolean).join(' - ');
        const hasRating =
          typeof company.ratingAvg === 'number' &&
          company.ratingAvg > 0 &&
          typeof company.reviewsCount === 'number' &&
          company.reviewsCount > 0;

        const toggleComparison = () => {
          if (isComparing) {
            removeCompany(company.id);
            return;
          }
          if (compareLimitReached) return;
          addCompany({
            id: company.id,
            name: company.name,
            logoUrl: company.logoUrl || undefined,
            ratingAvg: company.ratingAvg || undefined,
            reviewsCount: company.reviewsCount || undefined,
            isVerified: company.isVerified,
          });
        };

        return (
          <View
            key={company.id}
            style={[
              styles.gridCard,
              Shadows.sm,
              { backgroundColor: colors.backgroundElement, borderColor: colors.border },
            ]}
          >
            <View style={styles.cardTopRow}>
              <Pressable
                onPress={() => onPress(company)}
                accessibilityRole="button"
                accessibilityLabel={`Ver perfil de ${company.name}`}
                style={({ pressed }) => [
                  styles.companyLogoButton,
                  { borderColor: colors.border, opacity: pressed ? 0.72 : 1 },
                ]}
              >
                {company.logoUrl ? (
                  <Image
                    source={{ uri: company.logoUrl }}
                    style={styles.companyLogo}
                    contentFit="contain"
                    transition={150}
                    accessibilityLabel={`Logotipo ${company.name}`}
                  />
                ) : (
                  <View
                    style={[
                      styles.companyLogoPlaceholder,
                      { backgroundColor: colors.surfaceSubtle },
                    ]}
                  >
                    <Building2 color={colors.textSecondary} size={22} accessibilityElementsHidden />
                  </View>
                )}
              </Pressable>

              <Pressable
                onPress={() => onToggleFavorite(company.id)}
                style={({ pressed }) => [styles.favoriteButton, { opacity: pressed ? 0.65 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel={
                  isFavorite
                    ? `Remover ${company.name} dos favoritos`
                    : `Adicionar ${company.name} aos favoritos`
                }
                accessibilityState={{ selected: isFavorite }}
                hitSlop={4}
              >
                <Heart
                  size={22}
                  color={isFavorite ? colors.danger : colors.textSecondary}
                  fill={isFavorite ? colors.danger : colors.backgroundElement}
                />
              </Pressable>
            </View>

            <Pressable
              onPress={() => onPress(company)}
              accessibilityRole="button"
              accessibilityLabel={`Abrir ${company.name}`}
              style={styles.cardInfoContainer}
            >
              <View style={styles.companyNameRow}>
                <ThemedText style={[styles.companyName, { color: colors.text }]} numberOfLines={2}>
                  {company.name}
                </ThemedText>
                {company.isVerified ? (
                  <ShieldCheck size={15} color={colors.success} accessibilityLabel="Verificada" />
                ) : null}
              </View>

              {location ? (
                <ThemedText
                  style={[styles.companySubname, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {location}
                </ThemedText>
              ) : null}

              <View style={styles.ratingRow}>
                {hasRating ? (
                  <>
                    <Star size={13} color={colors.starYellow} fill={colors.starYellow} />
                    <ThemedText style={[styles.ratingText, { color: colors.text }]}>
                      {company.ratingAvg?.toFixed(1)}
                    </ThemedText>
                    <ThemedText style={[styles.reviewCountText, { color: colors.textSecondary }]}>
                      ({company.reviewsCount})
                    </ThemedText>
                  </>
                ) : (
                  <ThemedText style={[styles.reviewCountText, { color: colors.textSecondary }]}>
                    Sem avaliações
                  </ThemedText>
                )}
              </View>
            </Pressable>

            <Pressable
              onPress={toggleComparison}
              disabled={compareLimitReached}
              accessibilityRole="button"
              accessibilityLabel={
                compareLimitReached
                  ? 'Limite de três empresas para comparação atingido'
                  : isComparing
                    ? `Remover ${company.name} da comparação`
                    : `Comparar ${company.name}`
              }
              accessibilityState={{ selected: isComparing, disabled: compareLimitReached }}
              style={({ pressed }) => [
                styles.compareButton,
                {
                  backgroundColor: isComparing ? colors.tint : colors.surfaceSubtle,
                  borderColor: isComparing ? colors.tint : colors.border,
                  opacity: compareLimitReached ? 0.45 : pressed ? 0.72 : 1,
                },
              ]}
            >
              <ArrowLeftRight
                size={16}
                color={isComparing ? colors.onTint : colors.textSecondary}
                accessibilityElementsHidden
              />
              <ThemedText
                style={[styles.compareLabel, { color: isComparing ? colors.onTint : colors.text }]}
              >
                {isComparing ? 'Selecionada' : 'Comparar'}
              </ThemedText>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.four,
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  gridCard: {
    width: (width - Spacing.four * 2 - Spacing.three) / 2,
    minHeight: 210,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.three,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.two,
  },
  companyLogoButton: {
    width: 52,
    height: 52,
    borderRadius: Radius.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
  companyLogo: {
    width: '100%',
    height: '100%',
  },
  companyLogoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfoContainer: {
    flex: 1,
    gap: Spacing.one,
  },
  companyNameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.one,
  },
  companyName: {
    minHeight: 34,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    flex: 1,
  },
  companySubname: {
    fontSize: 10,
  },
  ratingRow: {
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
  },
  reviewCountText: {
    fontSize: 10,
  },
  compareButton: {
    minHeight: 44,
    marginTop: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  compareLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
});
