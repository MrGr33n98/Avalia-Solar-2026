import React, { useEffect, useRef, useState } from "react";
import { Colors } from "@/constants/theme";
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { fetchApi, getApiBaseUrl } from "../lib/api";
import { useTracking } from "../hooks/useTracking";
import { Radius, Shadows, Spacing } from "../constants/theme";
import { ThemedText } from "./themed-text";
import { getBannerAudienceKey } from "../lib/banner-audience";

interface Banner {
  id: number;
  title: string;
  link: string;
  image_url: string;
  link_url: string;
  sponsored: boolean;
  position: string;
  delivery_id?: string | null;
}

interface BannerSlotProps {
  position: string;
  delivery_id?: string | null;
  state?: string;
  city?: string;
}

export function BannerSlot({ position, state, city }: BannerSlotProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" || !scheme ? "light" : scheme];

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const { trackBannerViewed, trackBannerClicked } = useTracking();
  const impressionTrackedRef = useRef<string | null>(null);
  const audienceKeyRef = useRef<string | null>(null);

  useEffect(() => {
    async function fetchBanners() {
      try {
        const audienceKey = await getBannerAudienceKey();
        audienceKeyRef.current = audienceKey;
        const response = await fetchApi<Banner[]>("banners", {
          params: {
            position,
            state: state || undefined,
            city: city || undefined,
            audience_key: audienceKey,
          },
        });
        setBanners(response || []);
      } catch (error) {
        console.warn(
          `[BannerSlot] Erro ao carregar banners para ${position}:`,
          error,
        );
        setBanners([]); // Contingência: sem banner se falhar
      } finally {
        setLoading(false);
      }
    }

    fetchBanners();
  }, [position, state, city]);

  const banner = banners[0];

  useEffect(() => {
    if (loading || !banner) return;
    const deliveryKey = banner.delivery_id || "legacy";
    const impressionInstanceId = `${banner.id}:${deliveryKey}:${position}`;
    const bannerAudienceKey = audienceKeyRef.current;
    if (impressionTrackedRef.current === impressionInstanceId) return;
    impressionTrackedRef.current = impressionInstanceId;
    void fetchApi("banner_events", {
      method: "POST",
      body: JSON.stringify({
        banner_event: {
          banner_id: banner.id,
          event_type: "impression",
          impression_instance_id: impressionInstanceId,
          delivery_id: banner.delivery_id || undefined,
          metadata: {
            position,
            platform: "mobile",
            audience_key: bannerAudienceKey,
          },
        },
      }),
    }).catch((error) =>
      console.warn("[BannerSlot] Falha ao registrar impressao:", error),
    );
    trackBannerViewed(banner.id, position, banner.sponsored);
  }, [banner, loading, position, trackBannerViewed]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.brandDarkBlue} />
      </View>
    );
  }

  if (!banner) {
    return null; // Oculta slot se não houver banner ativo
  }

  const handlePress = () => {
    trackBannerClicked(banner.id, position, banner.sponsored);
    if (banner.link_url) {
      Linking.openURL(`${getApiBaseUrl()}/banner_clicks/${banner.id}`).catch(
        (err) =>
          console.error("[BannerSlot] Erro ao abrir URL do banner:", err),
      );
    }
  };

  const themedStyles = createStyles(colors);

  return (
    <View style={themedStyles.container}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        <Image
          source={{ uri: banner.image_url }}
          style={themedStyles.image}
          resizeMode="cover"
        />
        {banner.sponsored && (
          <View style={themedStyles.sponsoredBadge}>
            <ThemedText style={themedStyles.sponsoredText}>Patrocinado</ThemedText>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: (typeof Colors)["light"]) => StyleSheet.create({
  container: {
    marginHorizontal: Spacing.four,
    marginVertical: Spacing.three,
    borderRadius: Radius.md,
    overflow: "hidden",
    backgroundColor: colors.surfaceSubtle,
    ...Shadows.md,
    position: "relative",
  },
  loadingContainer: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 120,
    borderRadius: Radius.md,
  },
  sponsoredBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  sponsoredText: {
    color: colors.backgroundElement,
    fontSize: 9,
    fontWeight: "bold",
  },
});
