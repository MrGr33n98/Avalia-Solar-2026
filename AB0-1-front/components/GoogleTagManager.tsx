/**
 * Google Tag Manager Component
 * 
 * Componente que injeta o GTM no <head> e <body> da aplicação
 * Container ID: GTM-5RV76ZKR
 * 
 * Uso:
 * - Importar no layout.tsx principal
 * - Carregar apenas no cliente (use client)
 */

'use client';

import { useEffect } from 'react';
import Script from 'next/script';

interface GTMProps {
  gtmId: string;
  gaId?: string;
}

export function GoogleTagManager({ gtmId, gaId }: GTMProps) {
  return (
    <>
      {/* Google Consent Mode v2 - Default state */}
      <Script
        id="google-consent-mode"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
              'ad_storage': 'denied',
              'analytics_storage': 'denied',
              'ad_user_data': 'denied',
              'ad_personalization': 'denied',
              'wait_for_update': 500
            });
            gtag('js', new Date());
          `,
        }}
      />

      {/* Google Tag (gtag.js) - GA4 */}
      {gaId && (
        <Script
          id="google-tag-ga4"
          strategy="lazyOnload"
          src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        />
      )}
      
      {gaId && (
        <Script
          id="ga4-config"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', {
                page_path: window.location.pathname,
                send_page_view: true,
                cookie_domain: 'auto'
              });
            `,
          }}
        />
      )}

      {/* Google Tag Manager */}
      <Script
        id="gtm-script"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `,
        }}
      />
    </>
  );
}

export function GoogleTagManagerNoScript({ gtmId }: GTMProps) {
  return (
    /* Google Tag Manager (noscript) */
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  );
}

// Exportações prontas para uso
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-5RV76ZKR';
export const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-9SD4S6S434';

export default GoogleTagManager;
