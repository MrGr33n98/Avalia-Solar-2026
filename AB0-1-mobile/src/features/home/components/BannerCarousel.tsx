import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  View,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useColorScheme,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { Colors, Spacing } from "@/constants/theme";
import { fetchApi, getApiBaseUrl } from "@/lib/api";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - Spacing.four * 2;

interface Banner {
  id: string;
  imageUrl: string;
  linkUrl?: string;
  deliveryId?: string | null;
}

interface BannerCarouselProps {
  banners: Banner[];
  onPress?: (banner: Banner) => void;
  audienceKey?: string | null;
}

export const BannerCarousel = ({
  banners,
  onPress,
  audienceKey,
}: BannerCarouselProps) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" || !scheme ? "light" : scheme];
  const [activeIndex, setActiveIndex] = useState(0);
  const impressionTrackedRef = useRef<Set<string>>(new Set());

  const trackImpression = (banner: Banner) => {
    const deliveryKey = banner.deliveryId || "legacy";
    const impressionInstanceId = `${banner.id}:${deliveryKey}:home_top`;
    if (impressionTrackedRef.current.has(impressionInstanceId)) return;
    impressionTrackedRef.current.add(impressionInstanceId);
    void fetchApi("banner_events", {
      method: "POST",
      body: JSON.stringify({
        banner_event: {
          banner_id: Number(banner.id),
          event_type: "impression",
          impression_instance_id: impressionInstanceId,
          delivery_id: banner.deliveryId || undefined,
          metadata: {
            position: "home_top",
            platform: "mobile",
            audience_key: audienceKey,
          },
        },
      }),
    }).catch((error) =>
      console.warn("[HomeBannerCarousel] Falha ao registrar impressao:", error),
    );
  };

  useEffect(() => {
    const banner = banners[0];
    if (banner) trackImpression(banner);
  }, [banners]);

  if (!banners || banners.length === 0) return null;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / CARD_WIDTH);
    if (index !== activeIndex && index >= 0 && index < banners.length) {
      setActiveIndex(index);
      const banner = banners[index];
      if (banner) trackImpression(banner);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        snapToInterval={CARD_WIDTH + Spacing.three}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {banners.map((banner) => (
          <TouchableOpacity
            key={banner.id}
            style={styles.bannerItem}
            onPress={() => {
              if (onPress) return onPress(banner);
              if (banner.linkUrl) {
                Linking.openURL(
                  `${getApiBaseUrl()}/banner_clicks/${banner.id}`,
                ).catch((error) =>
                  console.warn(
                    "[HomeBannerCarousel] Falha no redirect:",
                    error,
                  ),
                );
              }
            }}
            activeOpacity={0.85}
          >
            <Image
              source={{ uri: banner.imageUrl }}
              style={styles.bannerImage}
              contentFit="cover"
              transition={200}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Indicadores de página (bullets) */}
      <View style={styles.pagination}>
        {banners.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activeIndex === index ? styles.activeDot : styles.inactiveDot,
              {
                backgroundColor:
                  activeIndex === index ? colors.tint : colors.border,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    marginVertical: Spacing.two,
    alignItems: "center",
  },
  container: {
    width: width,
  },
  contentContainer: {
    paddingHorizontal: Spacing.four,
  },
  bannerItem: {
    marginRight: Spacing.three,
  },
  bannerImage: {
    width: CARD_WIDTH,
    height: 150,
    borderRadius: 14,
  },
  pagination: {
    flexDirection: "row",
    marginTop: 10,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 16,
  },
  inactiveDot: {
    width: 6,
  },
});
