import React from 'react';
import { render } from '@testing-library/react';
import FAQSection from '@/components/seo/FAQSection';

describe('Structured Data (JSON-LD) Validation', () => {
  describe('FAQPage Schema (T-P1-05)', () => {
    it('renders valid Schema.org FAQPage JSON-LD script', () => {
      const items = [
        {
          question: 'Como funciona o Avalia Solar?',
          answer: 'Plataforma para comparar empresas de energia solar.',
        },
        {
          question: 'Quanto custa energia solar residencial?',
          answer: 'Depende do consumo e equipamentos.',
        },
      ];

      const { container } = render(<FAQSection items={items} />);
      const script = container.querySelector('script[type="application/ld+json"]');

      expect(script).not.toBeNull();
      const json = JSON.parse(script?.textContent || '{}');

      expect(json['@context']).toBe('https://schema.org');
      expect(json['@type']).toBe('FAQPage');
      expect(json.mainEntity).toHaveLength(2);
      expect(json.mainEntity[0]).toEqual({
        '@type': 'Question',
        name: 'Como funciona o Avalia Solar?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Plataforma para comparar empresas de energia solar.',
        },
      });
      expect(json.mainEntity[1]).toEqual({
        '@type': 'Question',
        name: 'Quanto custa energia solar residencial?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Depende do consumo e equipamentos.',
        },
      });
    });

    it('returns null and does not inject schema when items array is empty', () => {
      const { container } = render(<FAQSection items={[]} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Product Schema Specifications (T-P1-04)', () => {
    it('generates valid Product schema with Brand object and conditional AggregateRating and Offer', () => {
      // Simulates the schema builder in product detail
      function buildProductSchema(params: {
        canonicalUrl: string;
        product: { name: string; description?: string; sku?: string; image_url?: string; price?: number };
        brandName?: string;
        reviewsData?: { summary?: { average_rating: number; total_reviews: number } };
      }) {
        return {
          '@context': 'https://schema.org',
          '@type': 'Product',
          '@id': params.canonicalUrl,
          name: params.product.name,
          description: params.product.description || undefined,
          image: params.product.image_url || undefined,
          sku: params.product.sku || undefined,
          brand: {
            '@type': 'Brand',
            name: params.brandName || 'Avalia Solar',
          },
          ...(params.product.price ? {
            offers: {
              '@type': 'Offer',
              price: params.product.price,
              priceCurrency: 'BRL',
              availability: 'https://schema.org/InStock',
              url: params.canonicalUrl,
            },
          } : {}),
          ...(params.reviewsData?.summary?.total_reviews && params.reviewsData.summary.total_reviews > 0 ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: params.reviewsData.summary.average_rating,
              reviewCount: params.reviewsData.summary.total_reviews,
              bestRating: '5',
              worstRating: '1',
            },
          } : {}),
        };
      }

      // Case 1: Full product with reviews and price
      const fullSchema = buildProductSchema({
        canonicalUrl: 'https://www.avaliasolar.com.br/products/123-painel-canadian',
        product: {
          name: 'Painel Solar 550W',
          description: 'Módulo monocristalino de alta eficiência',
          sku: 'CS3W-550',
          price: 850.0,
        },
        brandName: 'Canadian Solar',
        reviewsData: {
          summary: {
            average_rating: 4.8,
            total_reviews: 15,
          },
        },
      });

      expect(fullSchema.brand).toEqual({
        '@type': 'Brand',
        name: 'Canadian Solar',
      });
      expect(fullSchema.offers).toEqual({
        '@type': 'Offer',
        price: 850.0,
        priceCurrency: 'BRL',
        availability: 'https://schema.org/InStock',
        url: 'https://www.avaliasolar.com.br/products/123-painel-canadian',
      });
      expect(fullSchema.aggregateRating).toEqual({
        '@type': 'AggregateRating',
        ratingValue: 4.8,
        reviewCount: 15,
        bestRating: '5',
        worstRating: '1',
      });

      // Case 2: Product with 0 reviews - aggregateRating must NOT be emitted
      const noReviewsSchema = buildProductSchema({
        canonicalUrl: 'https://www.avaliasolar.com.br/products/456-inversor-growatt',
        product: {
          name: 'Inversor 5kW',
        },
        reviewsData: {
          summary: {
            average_rating: 0,
            total_reviews: 0,
          },
        },
      });

      expect(noReviewsSchema.brand).toEqual({
        '@type': 'Brand',
        name: 'Avalia Solar',
      });
      expect(noReviewsSchema.offers).toBeUndefined();
      expect(noReviewsSchema.aggregateRating).toBeUndefined();
    });
  });
});

