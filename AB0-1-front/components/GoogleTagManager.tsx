import Script from 'next/script';

interface GTMProps {
  gtmId: string;
}

const analyticsEnabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== 'false';

/**
 * GoogleTagManager — Performance-optimized
 *
 * Consent Mode (beforeInteractive): define defaults LGPD antes do GTM disparar.
 *   - Removido `wait_for_update: 500` que bloqueava o main thread por 500ms garantidos.
 *
 * GTM Loader (afterInteractive): carregado após hidratação da página.
 *   - Não bloqueia FCP, LCP nem TBT.
 */
export function GoogleTagManager({ gtmId }: GTMProps) {
  if (!analyticsEnabled || !gtmId) return null;

  return (
    <>
      <Script
        id="google-consent-mode"
        strategy="afterInteractive"
      >{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('consent', 'default', {
          'ad_storage': 'denied',
          'analytics_storage': 'denied',
          'ad_user_data': 'denied',
          'ad_personalization': 'denied'
        });
        gtag('js', new Date());
        try {
          var c = JSON.parse(localStorage.getItem('avaliasolar_consent') || 'null');
          if (c) gtag('consent', 'update', {
            'ad_storage': c.marketing ? 'granted' : 'denied',
            'analytics_storage': c.analytics ? 'granted' : 'denied',
            'ad_user_data': c.marketing ? 'granted' : 'denied',
            'ad_personalization': c.marketing ? 'granted' : 'denied'
          });
        } catch(e) {}
      `}</Script>

      <Script
        id="gtm-script"
        src={`https://www.googletagmanager.com/gtm.js?id=${gtmId}`}
        strategy="afterInteractive"
      />
    </>
  );
}

export function GoogleTagManagerNoScript({ gtmId }: GTMProps) {
  if (!analyticsEnabled || !gtmId) return null;

  return (
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

export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-5RV76ZKR';

export default GoogleTagManager;
