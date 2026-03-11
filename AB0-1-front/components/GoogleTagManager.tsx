'use client';

interface GTMProps {
  gtmId: string;
}

const analyticsEnabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== 'false';

export function GoogleTagManager({ gtmId }: GTMProps) {
  if (!analyticsEnabled || !gtmId) return null;

  return (
    <>
      <script
        id="google-consent-mode"
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

            // Rehydrate consent state immediately to avoid 0% consent rate issues globally
            try {
              var stored = localStorage.getItem('avaliasolar_consent');
              if (stored) {
                var consent = JSON.parse(stored);
                gtag('consent', 'update', {
                  'ad_storage': consent.marketing ? 'granted' : 'denied',
                  'analytics_storage': consent.analytics ? 'granted' : 'denied',
                  'ad_user_data': consent.marketing ? 'granted' : 'denied',
                  'ad_personalization': consent.marketing ? 'granted' : 'denied'
                });
              }
            } catch(e) {}
          `,
        }}
      />

      <script
        id="gtm-script"
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
