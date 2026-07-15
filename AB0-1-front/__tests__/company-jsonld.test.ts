import { buildCompanyLocalBusinessJsonLd } from '@/lib/seo/company-jsonld';
import type { Company, Review } from '@/lib/api';

const baseCompany = {
  id: 372,
  slug: 'weg',
  name: 'WEG',
  city: 'Florianópolis',
  state: 'SC',
  status: 'active',
  verified: true,
  category: 'Energia Solar',
  description: 'Fabricante nacional de equipamentos para energia solar.',
  website: 'https://www.weg.net',
  phone: '(11) 99999-9999',
  address: '',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  logo_url: '/images/weg-logo.png',
  banner_url: '/images/weg-banner.png',
  rating_avg: 4.6,
  rating_count: 12,
  working_hours: 'Segunda a sexta, 8h às 18h',
  latitude: -27.5949,
  longitude: -48.5482,
} as Company;

describe('company LocalBusiness JSON-LD', () => {
  it('builds canonical LocalBusiness schema with valid aggregate ratings and reviews', () => {
    const jsonLd = buildCompanyLocalBusinessJsonLd({
      company: baseCompany,
      canonicalUrl: 'https://www.avaliasolar.com.br/companies/weg-372',
      reviews: [
        {
          rating: 5,
          comment: 'Atendimento claro e documentação verificada.',
          created_at: '2026-07-01T00:00:00Z',
          user: { name: 'Cliente A' },
        } as Review,
        {
          rating: 0,
          comment: 'Este review não deve entrar no schema.',
          created_at: '2026-07-02T00:00:00Z',
        } as Review,
        {
          rating: 4,
          comment: '',
          body: '',
          created_at: '2026-07-03T00:00:00Z',
        } as Review,
      ],
    });

    expect(jsonLd).toMatchObject({
      '@type': 'LocalBusiness',
      '@id': 'https://www.avaliasolar.com.br/companies/weg-372#localbusiness',
      url: 'https://www.avaliasolar.com.br/companies/weg-372',
      logo: 'https://www.avaliasolar.com.br/images/weg-logo.png',
      image: 'https://www.avaliasolar.com.br/images/weg-banner.png',
      openingHours: 'Segunda a sexta, 8h às 18h',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: 4.6,
        reviewCount: 12,
      },
    });

    expect(jsonLd).not.toHaveProperty('openingHoursSpecification');
    expect(jsonLd.review).toHaveLength(1);
    expect(jsonLd.review).toEqual([
      expect.objectContaining({
        '@type': 'Review',
        reviewBody: 'Atendimento claro e documentação verificada.',
        reviewRating: expect.objectContaining({ ratingValue: 5 }),
      }),
    ]);
  });

  it('omits AggregateRating when rating value is outside schema bounds', () => {
    const jsonLd = buildCompanyLocalBusinessJsonLd({
      company: {
        ...baseCompany,
        rating_avg: 0,
        rating_count: 8,
      },
      canonicalUrl: 'https://www.avaliasolar.com.br/companies/weg-372',
      reviews: [],
    });

    expect(jsonLd).not.toHaveProperty('aggregateRating');
    expect(jsonLd).not.toHaveProperty('review');
  });
});
