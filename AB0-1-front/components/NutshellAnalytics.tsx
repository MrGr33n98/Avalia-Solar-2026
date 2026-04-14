'use client';

import Script from 'next/script';
import { useEffect } from 'react';

export const NUTSHELL_INSTANCE = process.env.NEXT_PUBLIC_NUTSHELL_INSTANCE || '385068';
export const NUTSHELL_AUTH_TOKEN = process.env.NEXT_PUBLIC_NUTSHELL_AUTH_TOKEN || 'KTE-7awqaTLwXH6lG6jbzAyKyC6DbZ8vNQBtAACppQg.2';

/**
 * NutshellAnalytics — Tracking & Widget
 * 
 * Este componente implementa o Nutsheller para rastreamento de visitantes
 * e integração com o CRM Nutshell.
 */
export default function NutshellAnalytics() {
  const analyticsEnabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== 'false';
  
  if (!analyticsEnabled) return null;

  return (
    <>
      {/* Container para o Boot do Nutshell */}
      <div id={`nutshell-boot-${NUTSHELL_INSTANCE}`} />

      {/* Inicialização do Nutsheller */}
      <Script id="nutshell-init" strategy="afterInteractive">
        {`
          (function(n,u,t){n[u]=n[u]||function(){(n[u].q=n[u].q||[]).push(arguments)}}(window,'Nutsheller'));
          Nutsheller('boot', {
            instance: '${NUTSHELL_INSTANCE}',
            authToken: '${NUTSHELL_AUTH_TOKEN}',
            target: 'nutshell-boot-${NUTSHELL_INSTANCE}'
          });
        `}
      </Script>

      {/* Script Principal do Nutsheller */}
      <Script 
        id="nutshell-script"
        src="https://growth.avaliasolar.com.br/nutsheller-esm.js"
        type="module"
        strategy="afterInteractive"
      />
    </>
  );
}
