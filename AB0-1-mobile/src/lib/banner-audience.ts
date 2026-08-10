import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@avalia_solar:banner_audience_id";
let memoryAudienceKey: string | null = null;

export async function getBannerAudienceKey(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    if (existing) {
      memoryAudienceKey = existing;
      return existing;
    }
    const generated =
      memoryAudienceKey ||
      `mobile-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    memoryAudienceKey = generated;
    await AsyncStorage.setItem(STORAGE_KEY, generated);
    return generated;
  } catch {
    memoryAudienceKey ||= `mobile-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return memoryAudienceKey;
  }
}
