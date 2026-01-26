import { redirect } from 'next/navigation';

import CategoryClientComponent from './CategoryClientComponent';
import { fetchCategoryBySlug, categoriesApi, api, Banner } from '@/lib/api';

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
    const resp = await api.request<Banner[] | { banners: Banner[] }>({
      url: `/banners?position=categories_top`,
      method: 'GET',
    });

    const dataAny = resp as any;
    const raw: Banner[] = Array.isArray(resp.data)
      ? (resp.data as Banner[])
      : Array.isArray(dataAny?.data?.banners)
      ? (dataAny.data.banners as Banner[])
      : [];

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
    const category = await fetchCategoryBySlug(params.slug);
    timeEnd(fetchLabel);

    timeStart(parallelLabel);

    // Normalize filters for the API
    const filters = {
      status: 'active',
      searchTerm: (searchParams.searchTerm as string) || undefined,
      state: (searchParams.state as string) || undefined,
      city: (searchParams.city as string) || undefined,
      rating: (searchParams.rating as string) || undefined,
      verified: searchParams.verified === 'true' ? true : undefined,
      page: (searchParams.page as string) || undefined,
    };

    const [companiesResponse, rawBanners] = await Promise.all([
      categoriesApi.getCompanies(category.id, filters),
      categoriesApi.getBanners(category.id, { limit: 10 }).catch(() => []),
    ]);

    // Handle different response formats (paginated vs non-paginated)
    let companies: any[] = [];
    let paginationMeta = null;

    if (Array.isArray(companiesResponse)) {
      companies = companiesResponse;
    } else if (companiesResponse && (companiesResponse as any).companies) {
      companies = (companiesResponse as any).companies;
      paginationMeta = (companiesResponse as any).meta;
    }

    const now = new Date();

    const raw = Array.isArray(rawBanners) ? rawBanners : [];
    let banners = filterBannersForCategory(raw, category.id, now);

    // fallback: se não vier banner por categoria, busca top banners globais
    if (banners.length === 0) {
      banners = await fetchFallbackTopBanners(now);
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
        <CategoryClientComponent
          initialCategory={category}
          initialCompanies={companies || []}
          initialBanners={banners || []}
          paginationMeta={paginationMeta}
        />
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
