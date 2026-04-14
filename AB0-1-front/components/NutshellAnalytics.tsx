'use client';

import Script from 'next/script';
import { useEffect } from 'react';

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
      <div id="nutshell-boot-385068" />

      {/* Inicialização do Nutsheller */}
      <Script id="nutshell-init" strategy="afterInteractive">
        {`
          (function(n,u,t){n[u]=n[u]||function(){(n[u].q=n[u].q||[]).push(arguments)}}(window,'Nutsheller'));
          Nutsheller('boot', {
            instance: '385068',
            authToken: 'KTE-7awqaTLwXH6lG6jbzAyKyC6DbZ8vNQBtAACppQg.2',
            target: 'nutshell-boot-385068'
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
