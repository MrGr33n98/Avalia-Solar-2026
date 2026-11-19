import type { Company } from '@/lib/api';
import { publicReviewsApi } from '@/lib/api-public';
import { buildCompanyLocalBusinessJsonLd } from '@/lib/seo/company-jsonld';

/**
 * Server-side review schema is independent of the premium profile shell.
 * Failure here must never hide hero, identity or authorized CTAs.
 * The main profile's live reviews remain client-driven.
 */
export default async function CompanyReviewsSection({
  company,
  canonicalUrl,
}: {
  company: Company;
  canonicalUrl: string;
}) {
  let reviews: Awaited<ReturnType<typeof publicReviewsApi.getAll>> = [];
  try {
    reviews = await publicReviewsApi.getAll(
      { company_id: company.id, limit: 6 },
      { revalidate: 600, tags: ['company-reviews', `company-${company.id}`], timeoutMs: 5000 }
    );
  } catch {
    // Aggregate company rating still produces valid schema without reviews.
  }
  const jsonLd = buildCompanyLocalBusinessJsonLd({ company, reviews, canonicalUrl });
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
