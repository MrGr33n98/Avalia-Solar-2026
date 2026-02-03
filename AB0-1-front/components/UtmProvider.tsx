'use client';

import React, { Suspense } from 'react';
import { useUtm } from '@/hooks/useUtm';

/**
 * Componente interno que realmente consome o hook useUtm.
 * Separado para permitir o uso de Suspense.
 */
function UtmHandler() {
  useUtm();
  return null;
}

/**
 * Wrapper para garantir que o hook de UTM rode globalmente.
 * Usa Suspense para evitar erros de pré-renderização no Next.js 14+
 * causados pelo uso de useSearchParams fora de um boundary.
 */
export default function UtmProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <UtmHandler />
      </Suspense>
      {children}
    </>
  );
}
