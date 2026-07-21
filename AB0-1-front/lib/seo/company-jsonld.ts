import type { Company, Review } from '@/lib/api';
import { toCrawlableImageUrl } from '@/lib/seo/crawlable-image';
import { absoluteUrl, SITE } from '@/lib/site';

type ReviewJsonLdSource = Pick<Review, 'created_at' | 'comment' | 'body' | 'rating'> & {
  user?: {
    name?: string | null;
  } | null;
};

type JsonLdRecord = Record<string, unknown>;

const cleanString = (value: unknown) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const toFiniteNumber = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const isValidRating = (value: unknown) => {
  const rating = toFiniteNumber(value);
  return rating !== null && rating >= 1 && rating <= 5;
};

const normalizeUrl = (value: unknown) => {
  const url = cleanString(value);
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
    return absoluteUrl(url);
  }
  return undefined;
};

const compactRecord = (record: JsonLdRecord) =>
  Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));

const buildAggregateRating = (company: Company) => {
  const ratingValue = toFiniteNumber(company.rating_avg ?? company.average_rating ?? company.rating);
  const reviewCount = toFiniteNumber(
    company.rating_count ?? company.total_reviews ?? company.reviews_count
  );

  if (!ratingValue || !reviewCount || ratingValue < 1 || ratingValue > 5 || reviewCount < 1) {
    return undefined;
  }

  return {
    '@type': 'AggregateRating',
    ratingValue,
    reviewCount,
    bestRating: '5',
    worstRating: '1',
  };
};

const buildReviews = (reviews: ReviewJsonLdSource[] = []) => {
  const reviewItems = reviews
    .map((review) => {
      if (!isValidRating(review.rating)) return null;

      const reviewBody = cleanString(review.comment) || cleanString(review.body);
      if (!reviewBody) return null;

      return compactRecord({
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: cleanString(review.user?.name) || 'Cliente verificado',
        },
        datePublished: cleanString(review.created_at),
        reviewBody,
        reviewRating: {
          '@type': 'Rating',
          ratingValue: Number(review.rating),
          bestRating: '5',
          worstRating: '1',
        },
      });
    })
    .filter((review): review is JsonLdRecord => Boolean(review));

  return reviewItems.length > 0 ? reviewItems : undefined;
};

export function buildCompanyLocalBusinessJsonLd({
  company,
  reviews,
  canonicalUrl,
}: {
  company: Company;
  reviews?: ReviewJsonLdSource[];
  canonicalUrl: string;
}) {
  const address =
    company.address || company.city || company.state
      ? compactRecord({
          '@type': 'PostalAddress',
          streetAddress: cleanString(company.address),
          addressLocality: cleanString(company.city),
          addressRegion: cleanString(company.state),
          addressCountry: 'BR',
        })
      : undefined;

  const latitude = toFiniteNumber(company.latitude);
  const longitude = toFiniteNumber(company.longitude);
  const geo =
    latitude !== null && longitude !== null
      ? {
          '@type': 'GeoCoordinates',
          latitude,
          longitude,
        }
      : undefined;

  const sameAs = [
    normalizeUrl(company.website),
    normalizeUrl(company.instagram_url),
    normalizeUrl(company.facebook_url),
    normalizeUrl(company.linkedin_url),
    normalizeUrl(company.youtube_url),
  ].filter((url): url is string => Boolean(url && url !== canonicalUrl));

  const areaServed = Array.isArray(company.coverage_cities) && company.coverage_cities.length > 0
    ? company.coverage_cities.map((cityName) => ({
        '@type': 'City',
        name: cityName,
      }))
    : company.city
    ? [{ '@type': 'City', name: company.city }]
    : undefined;

  const contactPoint = company.phone || company.email
    ? compactRecord({
        '@type': 'ContactPoint',
        telephone: cleanString(company.phone),
        email: cleanString(company.email),
        contactType: 'customer service',
        availableLanguage: ['Portuguese'],
      })
    : undefined;

  const knowsAbout = [
    'Energia Solar Fotovoltaica',
    'Inversores Solares',
    'Painéis Solares',
    'Mobilidade Elétrica e Carregadores EV',
    company.category_name,
  ].filter(Boolean);

  return compactRecord({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${canonicalUrl}#localbusiness`,
    name: company.name,
    description: cleanString(company.description),
    url: canonicalUrl,
    telephone: cleanString(company.phone),
    email: cleanString(company.email),
    logo: toCrawlableImageUrl(company.logo_url),
    image: toCrawlableImageUrl(company.banner_url) || toCrawlableImageUrl(company.logo_url),
    priceRange: '$$',
    address,
    geo,
    areaServed,
    contactPoint,
    knowsAbout: knowsAbout.length > 0 ? knowsAbout : undefined,
    aggregateRating: buildAggregateRating(company),
    review: buildReviews(reviews),
    openingHours: cleanString(company.working_hours) || cleanString(company.business_hours),
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${SITE.url}/#website`,
      name: SITE.name,
      url: SITE.url,
    },
  });
}

export function buildCompanyFaqJsonLd({
  company,
  canonicalUrl,
}: {
  company: Company;
  canonicalUrl: string;
}) {
  const ratingAvg = Number(company.rating_avg ?? company.average_rating ?? company.rating ?? 0).toFixed(1);
  const ratingCount = Number(company.rating_count ?? company.total_reviews ?? company.reviews_count ?? 0);
  const locationLabel = [company.city, company.state].filter(Boolean).join(' - ');

  const mainQuestions = [
    {
      question: `A empresa ${company.name} é confiável e verificada no Avalia Solar?`,
      answer: `Sim. A empresa ${company.name} possui perfil no Avalia Solar${locationLabel ? ` em ${locationLabel}` : ''}, contando com uma nota média de ${ratingAvg}/5.0 baseada em ${ratingCount} avaliações reais de clientes auditados.`,
    },
    {
      question: `Quais serviços e produtos a ${company.name} oferece?`,
      answer: `${company.name} atua com ${company.description || 'soluções em energia solar fotovoltaica, mobilidade elétrica, inversores e instalação de projetos solares'}.`,
    },
    {
      question: `Como solicitar orçamento com a ${company.name}?`,
      answer: `Você pode solicitar um orçamento diretamente através do perfil da ${company.name} no portal Avalia Solar (${canonicalUrl}), garantindo atendimento rápido e comparativo de preços sem compromisso.`,
    },
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${canonicalUrl}#faqpage`,
    mainEntity: mainQuestions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}
