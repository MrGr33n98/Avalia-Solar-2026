import Script from 'next/script';

export default function JsonLd() {
  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Avalia Solar',
    url: 'https://www.avaliasolar.com.br',
    logo: 'https://www.avaliasolar.com.br/images/logo.png',
    description: 'O maior marketplace de energia solar do Brasil. Conectamos você às melhores empresas de energia solar.',
    sameAs: [
      'https://www.instagram.com/avalia_solar',
      'https://www.facebook.com/avaliasolar',
      'https://twitter.com/avaliasolar',
      'https://www.linkedin.com/company/avalia-solar'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+55-65-9924-23309',
      contactType: 'customer service',
      areaServed: 'BR',
      availableLanguage: 'Portuguese'
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'BR'
    }
  };

  const websiteData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Avalia Solar',
    url: 'https://www.avaliasolar.com.br',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.avaliasolar.com.br/search?q={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  };

  const serviceData = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Marketplace de Energia Solar',
    provider: {
      '@type': 'Organization',
      name: 'Avalia Solar'
    },
    areaServed: {
      '@type': 'Country',
      name: 'Brasil'
    },
    description: 'Compare orçamentos de energia solar, encontre instaladores verificados e economize na sua conta de luz.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
      description: 'O uso da plataforma para comparação é gratuito para consumidores.'
    }
  };

  const faqData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'O que é o Avalia Solar?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'O Avalia Solar é o maior marketplace de energia solar do Brasil, conectando consumidores a empresas instaladoras verificadas para garantir a melhor economia e segurança na instalação.'
        }
      },
      {
        '@type': 'Question',
        name: 'Como funciona a comparação de orçamentos?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Você preenche algumas informações sobre seu consumo de energia e localização, e nossa plataforma conecta você com empresas qualificadas da sua região para fornecer orçamentos personalizados.'
        }
      },
      {
        '@type': 'Question',
        name: 'O serviço é gratuito?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sim, para consumidores que buscam orçamentos e desejam comparar empresas, o uso da plataforma Avalia Solar é totalmente gratuito.'
        }
      }
    ]
  };

  return (
    <>
      <Script
        id="organization-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
      />
      <Script
        id="website-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteData) }}
      />
      <Script
        id="service-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceData) }}
      />
      <Script
        id="faq-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />
    </>
  );
}
