import React, { useEffect, useState } from 'react';
import { Colors } from '@/constants/theme';
import { StyleSheet, View, Image, TouchableOpacity, Linking, ActivityIndicator } , useColorScheme } from 'react-native';
import { fetchApi } from '../lib/api';
import { useTracking } from '../hooks/useTracking';
import { Spacing } from '../constants/theme';
import { ThemedText } from './themed-text';

interface Banner {
  id: number;
  title: string;
  link: string;
  image_url: string;
  link_url: string;
  sponsored: boolean;
  position: string;
}

interface BannerSlotProps {
  position: string;
  state?: string;
  city?: string;
}

export function BannerSlot({ position, state, city }: BannerSlotProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const { trackBannerViewed, trackBannerClicked } = useTracking();

  useEffect(() => {
    async function fetchBanners() {
      try {
        const response = await fetchApi<Banner[]>('banners', {
          params: {
            position,
            state: state || undefined,
            city: city || undefined,
          },
        });
        setBanners(response || []);
      } catch (error) {
        console.warn(`[BannerSlot] Erro ao carregar banners para ${position}:`, error);
        setBanners([]); // Contingência: sem banner se falhar
      } finally {
        setLoading(false);
      }
    }

    fetchBanners();
  }, [position, state, city]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.brandDarkBlue} />
      </View>
    );
  }

  if (banners.length === 0) {
    return null; // Oculta slot se não houver banner ativo
  }

  // Pega o primeiro banner da lista prioritária
  const banner = banners[0];

  // Dispara evento PostHog de exibição do banner
  trackBannerViewed(banner.id, position, banner.sponsored);

  const handlePress = () => {
    trackBannerClicked(banner.id, position, banner.sponsored);
    if (banner.link_url) {
      Linking.openURL(banner.link_url).catch((err) =>
        console.error('[BannerSlot] Erro ao abrir URL do banner:', err)
      );
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        <Image
          source={{ uri: banner.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
        {banner.sponsored && (
          <View style={styles.sponsoredBadge}>
            <ThemedText style={styles.sponsoredText}>Patrocinado</ThemedText>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.four,
    marginVertical: Spacing.three,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSubtle,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    position: 'relative',
  },
  loadingContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 12,
  },
  sponsoredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sponsoredText: {
    color: colors.backgroundElement,
    fontSize: 9,
    fontWeight: 'bold',
  },
});
