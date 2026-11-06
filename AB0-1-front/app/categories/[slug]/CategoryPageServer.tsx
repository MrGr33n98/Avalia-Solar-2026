import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import CategoryPageClientV2 from './CategoryPageClientV2';
import type { Banner, Category } from '@/lib/api';
import { publicBannersApi, publicCategoriesApi } from '@/lib/api-public';
import { getCachedPublicCategory } from '@/lib/server/category-discovery/get-public-category';
import AnswerBlock from '@/components/seo/AnswerBlock';
import FAQSection from '@/components/seo/FAQSection';

interface CategorySlugPageProps {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
  initialCategory?: Category;
}

const REDIRECT_SLUGS = new Set([
  'register-user',
  'register',
  'cadastro-usuario',
  'signup',
]);

function isBannerActiveForNow(b: Banner, now: Date) {
  const active = b.active !== false;
  const hasImage = typeof b.image_url === 'string' && b.image_url.trim().length > 0;

  const start = b.start_date ? new Date(b.start_date) : null;
  const end = b.end_date ? new Date(b.end_date) : null;
  const okStart = !start || now >= start;
  const okEnd = !end || now <= end;

  return active && hasImage && okStart && okEnd;
}

function filterBannersForCategory(raw: Banner[], categoryId: number, now: Date) {
  return raw.filter((b) => {
    const inCategory =
      !b.category_ids ||
      b.category_ids.length === 0 ||
      b.category_ids.includes(categoryId);

    return isBannerActiveForNow(b, now) && inCategory;
  });
}

async function fetchFallbackTopBanners(now: Date): Promise<Banner[]> {
  try {
    const raw = await publicBannersApi.getByPosition('categories_top', { revalidate: 600 });
    return raw.filter((b) => isBannerActiveForNow(b, now));
  } catch {
    return [];
  }
}

export default async function CategoryPageServer({
  params,
  searchParams,
  initialCategory,
}: CategorySlugPageProps) {
  if (REDIRECT_SLUGS.has(params.slug)) redirect('/signup');

  let category = initialCategory;

  if (!category) {
    const result = await getCachedPublicCategory(params.slug, { revalidate: 3600 });

    if (result.status === 'not_found') {
      notFound();
    }

    category = result.category;
  }

  const filters = {
    status: 'active',
    searchTerm: (searchParams.search as string) || (searchParams.searchTerm as string) || undefined,
    state: (searchParams.state as string) || undefined,
    city: (searchParams.city as string) || undefined,
    rating: (searchParams.min_rating as string) || (searchParams.rating as string) || undefined,
    verified: searchParams.verified === 'true' ? true : undefined,
    niche_tag: (searchParams.niche_tag as string) || undefined,
    sort: (searchParams.sort as string) || undefined,
    project_type: (searchParams.project_type as string) || undefined,
    page: Number((searchParams.page as string) || 1),
    per_page: 20,
  };

  const [companiesResponse, rawBanners] = await Promise.all([
    publicCategoriesApi.getCompaniesPaginated(category.id, filters, { revalidate: 600 }),
    publicCategoriesApi.getBanners(category.id, { limit: 10 }, { revalidate: 600 }).catch(() => []),
  ]);

  const companies = companiesResponse?.companies || [];
  const paginationMeta = companiesResponse?.meta || null;

  const now = new Date();

  const raw = Array.isArray(rawBanners) ? rawBanners : [];
  let banners = filterBannersForCategory(raw, category.id, now);

  const hasTopBanner = banners.some((b) => b.position === 'categories_top');

  if (!hasTopBanner) {
    const fallbackTopBanners = await fetchFallbackTopBanners(now);
    banners = [...banners, ...fallbackTopBanners];
  }

  return (
    <div className="relative">
      <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center">Carregando categoria...</div>}>
        <CategoryPageClientV2
          initialCategory={category}
          initialCompanies={companies || []}
          initialBanners={banners || []}
          paginationMeta={paginationMeta}
        />
      </Suspense>

      <section className="bg-white py-10">
        <div className="container mx-auto max-w-5xl px-4 md:px-6">
          <AnswerBlock
            question={`Como escolher empresas de ${category.name}?`}
            answer={`Para escolher empresas de ${category.name}, compare reputação, cidade atendida, categorias de projeto, documentação, tempo de resposta e histórico de avaliações. O Avalia Solar organiza esses sinais para reduzir pesquisa manual e ajudar o usuário a separar fornecedores verificados, especialistas locais e opções que realmente atendem ao tipo de projeto buscado.`}
            facts={[
              `${companies.length} empresas nesta listagem`,
              `${category.name}`,
              'Comparação por reputação',
            ]}
            href="/help"
            linkLabel="Entenda como comparar empresas"
          />
        </div>
      </section>

      <section className="bg-slate-50 border-t border-slate-200/60 py-16 md:py-24">
        <div className="container mx-auto max-w-4xl px-4 md:px-6">
          <FAQSection
            title={`Dúvidas Frequentes sobre ${category.name}`}
            subtitle={`Veja respostas rápidas para as principais dúvidas sobre ${category.name.toLowerCase()} e compare com segurança.`}
            items={category.faqs || []}
          />
        </div>
      </section>
    </div>
  );
}
