import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { publicCategoriesApi } from '@/lib/api-public';
import { getCachedPublicCategory } from '@/lib/server/category-discovery/get-public-category';
import { resolveCategoryCanonicalSlug } from '@/lib/seo/category-metadata';
import MatchingResults from './MatchingResults';

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Empresas para seu projeto | Avalia Solar', robots: { index: false, follow: true } };
}

export default async function CategoryMatchingPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const result = await getCachedPublicCategory(params.slug, { revalidate: 600 });
  if (result.status === 'not_found') {
    notFound();
  }
  if (result.status === 'redirect') {
    permanentRedirect(`${result.destinationPath}/matching`);
  }
  const { category } = result;
  const canonicalSlug = resolveCategoryCanonicalSlug(category, params.slug);

  const solutionTypes = category.solution_types?.length
    ? category.solution_types
    : await publicCategoriesApi.getSolutionTypes(category.id, { revalidate: 600 });
  const context = {
    solution: value(searchParams.solution),
    application: value(searchParams.application),
    state: value(searchParams.state),
    city: value(searchParams.city),
  };

  return (
    <MatchingResults
      categoryId={category.id}
      categoryName={category.name}
      slug={canonicalSlug}
      solutionTypes={solutionTypes}
      initialContext={{
        solution: context.solution,
        application: context.application,
        state: context.state,
        city: context.city,
      }}
    />
  );
}

function value(input: string | string[] | undefined) {
  return Array.isArray(input) ? input[0] || '' : input || '';
}
