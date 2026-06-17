import React from 'react';
import { StyleSheet, View, TouchableOpacity, useColorScheme, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Star, ShieldCheck, Heart, Sun } from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface Company {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  ratingAvg?: number;
  reviewsCount?: number;
  isVerified?: boolean;
  city?: string;
  state?: string;
}

interface FeaturedCompaniesProps {
  companies: Company[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onPress: (company: Company) => void;
}

export const FeaturedCompanies = ({ companies, favorites, onToggleFavorite, onPress }: FeaturedCompaniesProps) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  if (!companies || companies.length === 0) return null;

  return (
    <View style={styles.gridContainer}>
      {companies.map((company) => {
        const isFav = favorites.includes(company.id);
        return (
          <TouchableOpacity
            key={company.id}
            style={[styles.gridCard, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => onPress(company)}
          >
            <View style={styles.cardTopRow}>
              {company.logoUrl ? (
                <Image
                  source={{ uri: company.logoUrl }}
                  style={styles.companyLogo}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={[styles.companyLogoPlaceholder, { backgroundColor: colors.backgroundSelected }]}>
                  <Sun color={colors.brandDarkBlue} size={20} />
                </View>
              )}
              
              <TouchableOpacity onPress={() => onToggleFavorite(company.id)} style={styles.favoriteButton}>
                <Heart
                  size={18}
                  color={isFav ? '#E53E3E' : '#8E8E93'}
                  fill={isFav ? '#E53E3E' : 'transparent'}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.cardInfoContainer}>
              <View style={styles.companyNameRow}>
                <ThemedText style={styles.companyName} numberOfLines={1}>
                  {company.name}
                </ThemedText>
                {company.isVerified && (
                  <ShieldCheck size={14} color="#10B981" style={{ marginLeft: 2 }} />
                )}
              </View>
              
              <ThemedText style={styles.companySubname} numberOfLines={1}>
                {company.city} - {company.state}
              </ThemedText>

              <View style={styles.ratingRow}>
                <Star size={12} color="#F59E0B" fill="#F59E0B" style={{ marginRight: 2 }} />
                <ThemedText style={styles.ratingText}>
                  {company.ratingAvg ? company.ratingAvg.toFixed(1) : '0.0'}
                </ThemedText>
                <ThemedText style={styles.reviewCountText}>
                  ({company.reviewsCount || 0})
                </ThemedText>
              </View>
            </View>
          </TouchableOpacity>
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
    borderRadius: 16,
    borderWidth: 0,
    padding: Spacing.three,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
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
});
