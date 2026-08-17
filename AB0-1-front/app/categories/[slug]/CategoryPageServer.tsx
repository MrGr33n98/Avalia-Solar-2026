import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import CategoryPageClientV2 from './CategoryPageClientV2';
import { Banner } from '@/lib/api';
import { publicBannersApi, publicCategoriesApi } from '@/lib/api-public';
import AnswerBlock from '@/components/seo/AnswerBlock';
import FAQSection from '@/components/seo/FAQSection';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CategorySlugPageProps {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

const REDIRECT_SLUGS = new Set([
  'register-user',
  'register',
  'cadastro-usuario',
  'signup',
]);

const isDev = process.env.NODE_ENV === 'development';

function timeStart(label: string) {
  if (isDev) console.time(label);
}
function timeEnd(label: string) {
  if (isDev) console.timeEnd(label);
}

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

function CategoryErrorState({
  slug,
  errorMessage,
  slugNotFound,
}: {
  slug: string;
  errorMessage: string;
  slugNotFound: boolean;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>

            <h1 className="text-2xl font-semibold tracking-tight">
              Categoria não encontrada
            </h1>

            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              {slugNotFound
                ? `A categoria "${slug}" não existe ou foi removida.`
                : 'Não foi possível carregar esta categoria no momento.'}
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <a href="/categories">Ver todas as categorias</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/">Ir para Home</a>
              </Button>
            </div>

            {!slugNotFound && (
              <p className="mt-5 text-xs text-destructive/80">
                Erro: {errorMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function CategoryPageServer({ params, searchParams }: CategorySlugPageProps) {
  if (REDIRECT_SLUGS.has(params.slug)) redirect('/signup');

  const totalLabel = `[CategoryPage] total ${params.slug}`;
  const fetchLabel = `[CategoryPage] fetch category ${params.slug}`;
  const parallelLabel = `[CategoryPage] parallel data ${params.slug}`;

  timeStart(totalLabel);

  try {
    timeStart(fetchLabel);
    const category = await publicCategoriesApi.getBySlug(params.slug, { revalidate: 3600 });
    timeEnd(fetchLabel);

    if (!category) {
      return <CategoryErrorState slug={params.slug} errorMessage="Categoria não encontrada" slugNotFound />;
    }

    timeStart(parallelLabel);

    // Normalize filters for the API
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
      // Always request paginated data (page/per_page) so the client can "load more" without SSR navigation.
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

    // Verifica se temos algum banner específico para o topo
    const hasTopBanner = banners.some(b => b.position === 'categories_top');

    // fallback: se não vier banner para o topo, busca os top banners globais
    if (!hasTopBanner) {
      const fallbackTopBanners = await fetchFallbackTopBanners(now);
      banners = [...banners, ...fallbackTopBanners];
    }

    timeEnd(parallelLabel);

    if (isDev) {
      console.log('[CategoryPage] banners raw:', raw.length);
      console.log(
        '[CategoryPage] banners filtered:',
        banners.map((b) => ({
          id: b.id,
          active: b.active,
          sponsored: b.sponsored,
          start_date: b.start_date,
          end_date: b.end_date,
          image_url: b.image_url,
        }))
      );
    }

    timeEnd(totalLabel);

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
              answer={`Para escolher empresas de ${category.name}, compare reputacao, cidade atendida, categorias de projeto, documentacao, tempo de resposta e historico de avaliacoes. O Avalia Solar organiza esses sinais para reduzir pesquisa manual e ajudar o usuario a separar fornecedores verificados, especialistas locais e opcoes que realmente atendem ao tipo de projeto buscado.`}
              facts={[
                `${companies.length} empresas nesta listagem`,
                `${category.name}`,
                'Comparacao por reputacao',
              ]}
              href="/help"
              linkLabel="Entenda como comparar empresas"
            />
          </div>
        </section>

        {/* FAQ Section específica da Categoria */}
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
  } catch (error) {
    const errorMessage = (error as Error)?.message || 'Erro ao carregar categoria';
    const slugNotFound =
      /category with slug/i.test(errorMessage) ||
      errorMessage.toLowerCase().includes('not found');

    if (isDev) {
      console.error(`[CategoryPage] error slug=${params.slug}`, error);
      timeEnd(totalLabel);
    }

    return (
      <CategoryErrorState
        slug={params.slug}
        errorMessage={errorMessage}
        slugNotFound={slugNotFound}
      />
    );
  }
}
