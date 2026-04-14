import { CONTACT, SOCIAL_PROFILES, SITE, absoluteUrl } from '@/lib/site';

export default function JsonLd() {
  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE.url}/#organization`,
    name: SITE.name,
    url: SITE.url,
    logo: absoluteUrl('/images/logo.png'),
    description: SITE.description,
    sameAs: SOCIAL_PROFILES.map((profile) => profile.url),
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'founder / editorial',
        email: CONTACT.founder.email,
        telephone: CONTACT.phone.e164,
        areaServed: 'BR',
        availableLanguage: 'Portuguese',
      },
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: CONTACT.team.email,
        telephone: CONTACT.phone.e164,
        areaServed: 'BR',
        availableLanguage: 'Portuguese',
      },
    ],
  };

  const websiteData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE.url}/#website`,
    name: SITE.name,
    url: SITE.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: SITE.searchUrl,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script
        id="organization-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
      />
      <script
        id="website-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteData) }}
      />
    </>
  );
}
