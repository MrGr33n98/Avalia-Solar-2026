'use client';

import { useEffect } from 'react';
import { initClipboardTracking } from '@/lib/analytics/clipboard-tracker';

export default function ClipboardTracker() {
  useEffect(() => {
    initClipboardTracking();
  }, []);

  return null;
}
