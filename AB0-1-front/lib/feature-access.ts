import type { FeatureAccessEntry } from '@/lib/api';

export type FeatureAccessMap = Record<string, FeatureAccessEntry> | null | undefined;

export const getFeatureAccessEntry = (
  featureAccess: FeatureAccessMap,
  key: string
): FeatureAccessEntry | null => {
  if (!featureAccess) return null;
  return featureAccess[key] || null;
};

export const isFeatureHiddenEntry = (entry: FeatureAccessEntry | null | undefined): boolean =>
  entry?.state === 'hidden';

export const isFeatureLockedEntry = (entry: FeatureAccessEntry | null | undefined): boolean =>
  entry?.state === 'locked';

export const isFeatureEnabledEntry = (entry: FeatureAccessEntry | null | undefined): boolean => {
  if (!entry || !['enabled', 'limited', 'trial'].includes(entry.state)) return false;

  if (entry.value === false || entry.value === null) return false;
  if (typeof entry.value === 'number') return entry.value > 0;
  if (typeof entry.value === 'string') return entry.value.trim().length > 0;

  return true;
};

export const isFeatureVisible = (featureAccess: FeatureAccessMap, key: string): boolean =>
  !isFeatureHiddenEntry(getFeatureAccessEntry(featureAccess, key));

export const isFeatureEnabled = (featureAccess: FeatureAccessMap, key: string): boolean =>
  isFeatureEnabledEntry(getFeatureAccessEntry(featureAccess, key));

export const isFeatureLocked = (featureAccess: FeatureAccessMap, key: string): boolean =>
  isFeatureLockedEntry(getFeatureAccessEntry(featureAccess, key));
