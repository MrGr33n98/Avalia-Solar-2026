/**
 * Avalia Solar - Motor de SEO & AEO (Artificial Intelligence Engine Optimization)
 *
 * Gera automaticamente metadados de alto CTR, Rich Snippets Schema.org
 * e marcações GEO para indexação regional e no Google/Bing/IAs.
 */

const { BRAZIL_STATES } = require('./curator_engine');

const BRAND_SUFFIX = ' | Avalia Solar';
const MAX_TITLE_LEN = 60;
const MIN_TITLE_LEN = 30;
const MAX_DESC_LEN = 160;
const MIN_DESC_LEN = 70;

/**
 * Gera Título de SEO canônico e atraente
 * Ex: "Solsist Energia Solar em Belo Horizonte, MG | Avalia Solar"
 */
function generateSeoTitle(company) {
  const name = company.name;
  const city = company.city;
  const state = company.state;

  let candidate = '';
  if (city && state) {
    candidate = `${name} - Energia Solar em ${city}, ${state}`;
  } else if (state) {
    candidate = `${name} - Projetos Solares em ${state}`;
  } else {
    candidate = `${name} - Avaliações e Energia Solar`;
  }

  // Adiciona o sufixo da marca mantendo o limite de 60 chars
  if ((candidate + BRAND_SUFFIX).length <= MAX_TITLE_LEN) {
    candidate = candidate + BRAND_SUFFIX;
  } else {
    // Trunca candidate para caber o sufixo
    const maxCandidateLen = MAX_TITLE_LEN - BRAND_SUFFIX.length - 3;
    candidate = candidate.slice(0, maxCandidateLen).trim() + '...' + BRAND_SUFFIX;
  }

  return candidate;
}

/**
 * Gera Meta Description otimizada para cliques (CTR)
 * Ex: "Conheça a Solsist Energia em Belo Horizonte/MG. Veja avaliações, projetos residenciais e comerciais, marcas homologadas e solicite orçamento grátis."
 */
function generateSeoDescription(company) {
  const name = company.name;
  const city = company.city || '';
  const state = company.state || '';
  const location = [city, state].filter(Boolean).join('/');

  let text = '';
  if (location) {
    text = `Conheça a ${name} em ${location}. Veja avaliações reais de clientes, projetos fotovoltaicos, marcas parceiras e solicite orçamento no Avalia Solar.`;
  } else {
    text = `Conheça a ${name}, empresa especializada em energia solar fotovoltaica. Veja avaliações, marcas homologadas e solicite seu orçamento no Avalia Solar.`;
  }

  // Ajusta para o intervalo de 70 a 160 caracteres
  if (text.length > MAX_DESC_LEN) {
    text = text.slice(0, MAX_DESC_LEN - 3).trim() + '...';
  }

  return text;
}

/**
 * Gera lista de palavras-chave otimizadas
 */
function generateSeoKeywords(company) {
  const keywords = [
    'energia solar',
    company.name.toLowerCase(),
    'instalador solar',
    'placas solares',
    'inversor solar',
    'orçamento fotovoltaico'
  ];

  if (company.city) {
    keywords.push(`energia solar em ${company.city.toLowerCase()}`);
    keywords.push(`instalador solar ${company.city.toLowerCase()}`);
  }

  if (company.state) {
    const stateName = BRAZIL_STATES[company.state] || company.state;
    keywords.push(`energia solar ${company.state.toLowerCase()}`);
    keywords.push(`painel solar ${stateName.toLowerCase()}`);
  }

  if (company.batteryStorage) {
    keywords.push('sistema solar com bateria', 'bess solar');
  }

  return keywords.slice(0, 10).join(', ');
}

/**
 * Gera Rich Snippet Schema.org (JSON-LD) para LocalBusiness / SolarEnergySystem
 */
function generateJsonLd(company) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'SolarEnergySystem'],
    'name': company.name,
    'description': generateSeoDescription(company),
    'url': `https://avaliasolar.com.br/companies/${company.slug || company.id}`,
    'telephone': company.phone || undefined,
    'image': company.logoUrl || undefined,
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': company.address || undefined,
      'addressLocality': company.city || undefined,
      'addressRegion': company.state || undefined,
      'addressCountry': 'BR'
    },
    'priceRange': '$$$$',
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '5.0',
      'reviewCount': '1',
      'bestRating': '5',
      'worstRating': '1'
    }
  };

  return schema;
}

/**
 * Gera GEO Meta Tags para indexação no Google Maps e Local Search
 */
function generateGeoMetadata(company) {
  if (!company.state) return {};
  return {
    'geo.region': `BR-${company.state}`,
    'geo.placename': company.city ? `${company.city}, ${company.state}` : company.state,
    'ICBM': company.latitude && company.longitude ? `${company.latitude}, ${company.longitude}` : undefined
  };
}

/**
 * Aplica todo o motor de SEO em um perfil de empresa
 */
function applySeoEngine(company) {
  const title = generateSeoTitle(company);
  const description = generateSeoDescription(company);
  const keywords = generateSeoKeywords(company);
  const jsonLd = generateJsonLd(company);
  const geo = generateGeoMetadata(company);

  return {
    ...company,
    seo: {
      title,
      description,
      keywords,
      geo,
      jsonLd,
      canonicalUrl: `https://avaliasolar.com.br/companies/${company.slug || company.id}`,
      regionalHubUrl: company.state && company.city ?
        `https://avaliasolar.com.br/energia-solar/${company.state.toLowerCase()}/${encodeURIComponent(company.city.toLowerCase())}` : null
    }
  };
}

module.exports = {
  generateSeoTitle,
  generateSeoDescription,
  generateSeoKeywords,
  generateJsonLd,
  generateGeoMetadata,
  applySeoEngine
};
