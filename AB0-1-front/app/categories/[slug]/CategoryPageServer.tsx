import { redirect } from 'next/navigation';

import CategoryClientComponent from './CategoryClientComponent';
import { fetchCategoryBySlug, categoriesApi, api, Banner } from '@/lib/api';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CategorySlugPageProps {
  params: {
    slug: string;
  };
}

export default async function CategoryPageServer({ params }: CategorySlugPageProps) {
  const logTiming = process.env.NODE_ENV === 'development';
  const totalLabel = `[CategoryPage] Total load time for ${params.slug}`;
  const fetchLabel = `[CategoryPage] Fetch category ${params.slug}`;
  const parallelLabel = '[CategoryPage] Fetch parallel data';

  if (logTiming) {
    console.time(totalLabel);
  }

  const specialSlugs = new Set(['register-user', 'register', 'cadastro-usuario', 'signup']);
  if (specialSlugs.has(params.slug)) {
    redirect('/signup');
  }

  try {
    if (logTiming) {
      console.time(fetchLabel);
    }
    const category = await fetchCategoryBySlug(params.slug);
    if (logTiming) {
      console.timeEnd(fetchLabel);
    }

    if (logTiming) {
      console.time(parallelLabel);
    }
    const [companies, rawBanners] = await Promise.all([
      categoriesApi.getCompanies(category.id, { status: 'active' }),
      categoriesApi.getBanners(category.id, { limit: 10 }).catch(() => []),
    ]);

    const now = new Date();
    let banners = Array.isArray(rawBanners)
      ? rawBanners.filter((b) => {
          const active = b.active !== false;
          const hasImage = typeof b.image_url === 'string' && b.image_url.trim().length > 0;
          const inSchedule = (() => {
            const start = b.start_date ? new Date(b.start_date) : null;
            const end = b.end_date ? new Date(b.end_date) : null;
            const okStart = !start || now >= start;
            const okEnd = !end || now <= end;
            return okStart && okEnd;
          })();
          const inCategory = !b.category_ids || b.category_ids.length === 0 || b.category_ids.includes(category.id);
          return active && hasImage && inSchedule && inCategory;
        })
      : [];

    if (!Array.isArray(banners) || banners.length === 0) {
      try {
        const resp = await api.request<Banner[] | { banners: Banner[] }>({
          url: `/banners?position=categories_top`,
          method: 'GET',
        });
        const raw: Banner[] = Array.isArray(resp.data)
          ? (resp.data as Banner[])
          : Array.isArray((resp as any)?.data?.banners)
          ? (((resp as any).data.banners as Banner[]) || [])
          : [];
        banners = raw.filter((b: Banner) => {
          const active = b.active !== false;
          const hasImage = typeof b.image_url === 'string' && b.image_url.trim().length > 0;
          const inSchedule = (() => {
            const start = b.start_date ? new Date(b.start_date) : null;
            const end = b.end_date ? new Date(b.end_date) : null;
            const okStart = !start || now >= start;
            const okEnd = !end || now <= end;
            return okStart && okEnd;
          })();
          return active && hasImage && inSchedule;
        });
      } catch {
        // ignore fallback errors
      }
    }

    if (logTiming) {
      console.timeEnd(parallelLabel);
      console.log('[CategoryPage] Banners raw count:', Array.isArray(rawBanners) ? rawBanners.length : 0);
      console.log('[CategoryPage] Banners filtered:', banners.map((b) => ({ id: b.id, active: b.active, sponsored: b.sponsored, start_date: b.start_date, end_date: b.end_date, image_url: b.image_url })));
      console.timeEnd(totalLabel);
    }

    return (
      <div className="relative z-[800]">
        <CategoryClientComponent
          initialCategory={category}
          initialCompanies={companies || []}
          initialBanners={banners || []}
        />
      </div>
    );
  } catch (error) {
    const errorMessage = (error as Error)?.message || 'Erro ao carregar categoria';
    const slugNotFound =
      /category with slug/i.test(errorMessage) || errorMessage.toLowerCase().includes('not found');
    if (logTiming) {
      console.error(`[CategoryPage] Error for slug: ${params.slug}`, error);
      console.timeEnd(totalLabel);
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Categoria não encontrada</h1>
            <p className="text-gray-600 mb-6">
              {slugNotFound
                ? `A categoria &quot;${params.slug}&quot; não existe ou foi removida.`
                : 'Não foi possível carregar esta categoria no momento.'}
            </p>
            <div className="space-x-4">
              <Button asChild>
                <a href="/categories">Ver todas as categorias</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/">Ir para Home</a>
              </Button>
            </div>
            <p className="mt-4 text-sm text-red-600">
              {slugNotFound
                ? 'Slug inválido ou categoria removida. Tente outra categoria ou retorne à lista.'
                : `Erro: ${errorMessage}`}
            </p>
          </div>
        </div>
      </div>
    );
  }
}
