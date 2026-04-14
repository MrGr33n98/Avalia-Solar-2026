'use client';

import { usePageTracking } from '@/hooks/usePageTracking';
import type { PageData } from '@/lib/analytics/consolidated';

type PageViewTrackerProps = {
  type: PageData['type'];
  title: string;
  sections?: string[];
  additionalData?: Record<string, unknown>;
};

export default function PageViewTracker({
  type,
  title,
  sections,
  additionalData,
}: PageViewTrackerProps) {
  usePageTracking({
    type,
    title,
    sections,
    additionalData,
  });

  return null;
}
