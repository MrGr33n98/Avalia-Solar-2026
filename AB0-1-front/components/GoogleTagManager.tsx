import Script from 'next/script';

interface GTMProps {
  gtmId: string;
}

const isAnalyticsEnabled = () =>
  process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== 'false' &&
  (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test');

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
  if (!isAnalyticsEnabled() || !gtmId) return null;

  return (
    <>
      <Script
        id="google-consent-mode"
        strategy="beforeInteractive"
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
        var h = window.location.hostname;
        var isLocal = h === 'localhost' || h === '127.0.0.1' || /^(\d{1,3}\.){3}\d{1,3}$/.test(h);
        var cd = isLocal ? 'none' : (h === 'avaliasolar.com.br' || /\.avaliasolar\.com\.br$/.test(h) ? 'avaliasolar.com.br' : 'none');
        gtag('set', {
          cookie_domain: cd,
          cookie_flags: window.location.protocol === 'https:' ? 'SameSite=Lax;Secure' : 'SameSite=Lax'
        });
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
        strategy="lazyOnload"
      />
    </>
  );
}

export function GoogleTagManagerNoScript({ gtmId }: GTMProps) {
  if (!isAnalyticsEnabled() || !gtmId) return null;

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
