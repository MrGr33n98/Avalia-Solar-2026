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

  return compactRecord({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${canonicalUrl}#localbusiness`,
    name: company.name,
    description: cleanString(company.description),
    url: canonicalUrl,
    telephone: cleanString(company.phone),
    logo: toCrawlableImageUrl(company.logo_url),
    image: toCrawlableImageUrl(company.banner_url) || toCrawlableImageUrl(company.logo_url),
    priceRange: '$$',
    address,
    geo,
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
