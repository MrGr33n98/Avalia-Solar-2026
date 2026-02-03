'use client';

import React from 'react';
import { useUtm } from '@/hooks/useUtm';

/**
 * Wrapper para garantir que o hook de UTM rode globalmente.
 */
export default function UtmProvider({ children }: { children: React.ReactNode }) {
  useUtm();
  return <>{children}</>;
}
