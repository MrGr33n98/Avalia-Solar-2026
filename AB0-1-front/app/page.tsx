import dynamic from 'next/dynamic';
import { Suspense, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, Info } from 'lucide-react';
import { unstable_cache } from 'next/cache';
import { cookies } from 'next/headers';

import LandingHero from '@/components/landing/LandingHero';
import { CategoryCardsErrorBoundary } from '@/components/landing/CategoryCardsErrorBoundary';
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';

const HowItWorks = dynamic(() => import('@/components/landing/HowItWorks'), {
  ssr: false,
  loading: () => <div className="h-96 animate-pulse bg-gray-100 rounded-xl" />
});
const SavingsCalculator = dynamic(() => import('@/components/landing/SavingsCalculator'), {
  ssr: false,
  loading: () => <div className="h-96 animate-pulse bg-gray-100 rounded-xl" />
});

import { HomeConversionCTA } from '@/components/home/HomeConversionCTA';
import { CTAPrimaryButton } from '@/components/ui/CTAPrimaryButton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { companiesApiSafe } from '@/lib/api-client';
import type { Banner, Category, Company } from '@/lib/api';
import { getFallbackCategories } from '@/lib/constants/fallback-categories';
import {
  getCachedActiveCategories,
  getCachedBanners,
  getCachedFeaturedCategories,
} from '@/lib/server/home-fallback-cache';
import {
  HOME_HERO_EXPERIMENT_ID,
  HOME_HERO_EXPERIMENT_COOKIE,
  isHomeHeroExperimentEnabled,
  type HomeHeroTrustMetrics,
  type HomeHeroVariant,
  resolveHomeHeroVariant,
} from '@/lib/experiments/homeHeroExperiment';

const HomePageTracking = dynamic(() => import('@/components/home/HomePageTracking'), {
  ssr: false,
  loading: () => null,
});
const LandingCategoryChips = dynamic(() => import('@/components/landing/LandingCategoryChips'), {
  loading: () => <div className="h-12 animate-pulse bg-slate-100 rounded-xl" />,
});
const LandingCategoryCard = dynamic(() => import('@/components/landing/LandingCategoryCard'), {
  loading: () => <div className="h-40 animate-pulse bg-white rounded-xl border border-gray-100" />,
});
const CompanyCard = dynamic(() => import('@/components/CompanyCard'), {
  loading: () => <div className="h-60 animate-pulse bg-white rounded-xl border border-gray-100" />,
});
const BannerByLocationLazy = dynamic(() => import('@/components/BannerByLocation'), {
  loading: () => <div className="h-20 animate-pulse bg-gray-100 rounded-xl" />,
});
const TrustRow = dynamic(() => import('@/components/ui/TrustRow').then((m) => m.TrustRow), {
  ssr: false,
  loading: () => <div className="h-20 animate-pulse bg-gray-50 rounded-xl" />,
});
const FloatingWhatsApp = dynamic(() => import('@/components/FloatingWhatsApp'), {
  ssr: false,
  loading: () => null,
});
const HomeIdentityModalTrigger = dynamic(() => import('@/components/home/HomeIdentityModalTrigger'), {
  ssr: false,
  loading: () => null,
});

export const revalidate = 3600;
const FALLBACK_CATEGORY_MIN_ID = 9000;

function SectionShell({
  children,
  zebra,
  className,
}: {
  children: ReactNode;
  zebra?: boolean;
  className?: string;
}) {
  return (
    <section className={[zebra ? 'bg-clay-bg' : '', 'py-8 md:py-12'].join(' ')}>
      <div className={['container mx-auto', 'px-4 md:px-6', className].filter(Boolean).join(' ')}>{children}</div>
    </section>
  );
}

function SectionHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="mb-6 md:mb-8">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">{title}</h2>
          {subtitle ? <p className="text-gray-600 max-w-2xl leading-relaxed">{subtitle}</p> : null}
        </div>
        {right ? <div className="hidden md:block">{right}</div> : null}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="flex items-center gap-3 p-4 clay-panel border-clay-shadow-light">
      <Info className="h-5 w-5 text-gray-500" />
      <p className="text-sm text-gray-600">{message}</p>
    </Card>
  );
}

async function getHomeData(): Promise<{
  featuredCategories: Category[];
  categoriesBanners: Banner[];
  homeBanners: Banner[];
}> {
  const [featuredCategoriesRaw, categoriesBanners, homeBanners] = await Promise.all([
    getCachedFeaturedCategories(),
    getCachedBanners('categories_top'),
    getCachedBanners('home_top'),
  ]);

  const featuredCategories = Array.isArray(featuredCategoriesRaw) ? featuredCategoriesRaw : [];
  const categoriesForHome =
    featuredCategories.length > 0
      ? featuredCategories
      : (await getCachedActiveCategories()).slice(0, 8);

  return {
    featuredCategories: categoriesForHome,
    categoriesBanners: Array.isArray(categoriesBanners) ? categoriesBanners : [],
    homeBanners: Array.isArray(homeBanners) ? homeBanners : [],
  };
}

async function getCompaniesData(): Promise<{
  companies: Company[];
  companiesBanners: Banner[];
}> {
  const [companies, companiesBanners] = await Promise.all([
    companiesApiSafe.getAll({
      status: 'active',
      featured: true,
      limit: 12,
      include: 'logo_url,banner_url,average_rating,rating_count',
    }),
    getCachedBanners('companies_top'),
  ]);

  return {
    companies: Array.isArray(companies) ? companies : [],
    companiesBanners: Array.isArray(companiesBanners) ? companiesBanners : [],
  };
}

const getHeroDataCached = unstable_cache(
  async () => {
    const [allCategories, homeBanners, totalActiveCompanies, totalVerifiedCompanies] = await Promise.all([
      getCachedActiveCategories(),
      getCachedBanners('home_top'),
      companiesApiSafe.getTotalCount({
        status: 'active',
      }),
      companiesApiSafe.getTotalCount({
        status: 'active',
        verified: true,
      }),
    ]);
    const trustMetrics: HomeHeroTrustMetrics = {
      totalActiveCompanies:
        Number.isFinite(totalActiveCompanies) && (totalActiveCompanies || 0) > 0
          ? Number(totalActiveCompanies)
          : null,
      totalVerifiedCompanies:
        Number.isFinite(totalVerifiedCompanies) && (totalVerifiedCompanies || 0) > 0
          ? Number(totalVerifiedCompanies)
          : null,
    };

    return { 
      allCategories, 
      homeBanners: Array.isArray(homeBanners) ? homeBanners : [],
      trustMetrics,
    };
  },
  ['home-hero-data-v2'],
  { revalidate: 600, tags: ['home-data', 'home-hero'] }
);

const getHomeDataCached = unstable_cache(
  async () => getHomeData(),
  ['home-categories-section-v1'],
  { revalidate: 600, tags: ['home-data', 'home-categories'] }
);

const getCompaniesDataCached = unstable_cache(
  async () => getCompaniesData(),
  ['home-companies-section-v2'],
  { revalidate: 600, tags: ['home-data', 'home-companies'] }
);

export default async function Home() {
  const experimentEnabled = isHomeHeroExperimentEnabled();
  const heroVariantCookieValue = (() => {
    try {
      return cookies().get(HOME_HERO_EXPERIMENT_COOKIE)?.value;
    } catch {
      return undefined;
    }
  })();
  const heroVariant = resolveHomeHeroVariant({
    enabled: experimentEnabled,
    cookieValue: heroVariantCookieValue,
  });

  const heroDataPromise = getHeroDataCached();
  const categoriesDataPromise = getHomeDataCached();
  const companiesDataPromise = getCompaniesDataCached();

  return (
    <main className="flex-grow">
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: '/' }
        ]}
      />
      <Suspense fallback={null}>
        <HomePageTracking />
      </Suspense>

      <Suspense fallback={<div className="min-h-[600px] animate-pulse bg-gray-100" />}>
        <LandingHeroWrapper
          dataPromise={heroDataPromise}
          variant={heroVariant}
          experimentEnabled={experimentEnabled}
        />
      </Suspense>

      <Suspense fallback={<div className="h-20 animate-pulse bg-gray-50" />}>
        <LandingCategoryChipsWrapper dataPromise={categoriesDataPromise} />
      </Suspense>

      <HowItWorks />

      <SavingsCalculator />

      <Suspense fallback={<div className="h-20 animate-pulse bg-gray-50" />}>
        <TrustRow />
      </Suspense>

      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-50" />}>
        <CategoriesSectionWrapper dataPromise={categoriesDataPromise} />
      </Suspense>

      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-50" />}>
        <CompaniesSectionWrapper dataPromise={companiesDataPromise} />
      </Suspense>

      {/* Conversion Banner */}
      <section className="dark py-20 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-blue/10 skew-x-12 translate-x-1/2" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Pronto para economizar na conta de luz?
            </h2>
            <p className="text-xl text-slate-400 mb-10">
              Junte-se a milhares de brasileiros que já reduziram seus custos em até 95%. Peça seu orçamento gratuito hoje.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <HomeConversionCTA />
              <Button 
                asChild
                variant="outline"
                className="h-14 px-10 text-lg rounded-full border-2 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white smooth-transition"
              >
                <Link href="/blog">Ler nosso blog</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <HomeIdentityModalTrigger />
      {/* <FloatingWhatsApp /> */}
    </main>
  );
}

// ==============================
// WRAPPERS FOR STREAMING
// ==============================

async function LandingHeroWrapper({
  dataPromise,
  variant,
  experimentEnabled,
}: {
  dataPromise: ReturnType<typeof getHeroDataCached>;
  variant: HomeHeroVariant;
  experimentEnabled: boolean;
}) {
  try {
    const { allCategories, homeBanners, trustMetrics } = await dataPromise;
    const safeCategories =
      Array.isArray(allCategories) && allCategories.length > 0
        ? allCategories
        : getFallbackCategories(8);

    return (
      <LandingHero
        categories={safeCategories}
        banners={homeBanners}
        variant={variant}
        experimentEnabled={experimentEnabled}
        experimentId={HOME_HERO_EXPERIMENT_ID}
        trustMetrics={trustMetrics}
      />
    );
  } catch (error) {
    console.error('[Home] LandingHeroWrapper fallback triggered:', error);
    return (
      <LandingHero
        categories={getFallbackCategories(8)}
        banners={[]}
        variant={variant}
        experimentEnabled={experimentEnabled}
        experimentId={HOME_HERO_EXPERIMENT_ID}
        trustMetrics={{
          totalActiveCompanies: null,
          totalVerifiedCompanies: null,
        }}
      />
    );
  }
}

async function LandingCategoryChipsWrapper({
  dataPromise,
}: {
  dataPromise: ReturnType<typeof getHomeDataCached>;
}) {
  let featuredCategories: Category[] = [];
  try {
    const data = await dataPromise;
    featuredCategories = Array.isArray(data?.featuredCategories) ? data.featuredCategories : [];
  } catch (error) {
    console.error('[Home] LandingCategoryChipsWrapper fallback triggered:', error);
  }

  if (featuredCategories.length === 0) {
    featuredCategories = getFallbackCategories(8);
  }

  return (
    <div className="py-8 bg-slate-50 border-y border-slate-100">
      <LandingCategoryChips categories={featuredCategories} />
    </div>
  );
}

async function CategoriesSectionWrapper({
  dataPromise,
}: {
  dataPromise: ReturnType<typeof getHomeDataCached>;
}) {
  let featuredCategories: Category[] = [];
  let categoriesBanners: Banner[] = [];
  try {
    const data = await dataPromise;
    featuredCategories = Array.isArray(data?.featuredCategories) ? data.featuredCategories : [];
    categoriesBanners = Array.isArray(data?.categoriesBanners) ? data.categoriesBanners : [];
  } catch (error) {
    console.error('[Home] CategoriesSectionWrapper fallback triggered:', error);
  }

  const safeCategories = featuredCategories.length > 0 ? featuredCategories : getFallbackCategories(8);
  const usingFallbackCategories =
    safeCategories.length > 0 &&
    safeCategories.every((category) => Number(category?.id) >= FALLBACK_CATEGORY_MIN_ID);

  const homeCategoryCarouselEnabled = process.env.NEXT_PUBLIC_HOME_CATEGORY_CAROUSEL_ENABLED === 'true';

  return (
    <SectionShell zebra>
      <SectionHeader
        title="Soluções por Categoria"
        subtitle="Encontre o que você precisa, de painéis solares a consultoria especializada."
      />

      {safeCategories.length > 0 ? (
        <CategoryCardsErrorBoundary>
          {homeCategoryCarouselEnabled ? (
            <HomeCategoryCarousel categories={safeCategories} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {/* Editorial Banner Integrated in Grid */}
              {categoriesBanners.length > 0 && (
                <div className="sm:col-span-2 lg:col-span-4">
                  <BannerByLocationLazy 
                    location="categories_top" 
                    initialBanners={categoriesBanners} 
                    className="rounded-2xl overflow-hidden border border-slate-100 shadow-lg"
                  />
                </div>
              )}
              
              {safeCategories.map((category) => (
                <LandingCategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </CategoryCardsErrorBoundary>
      ) : (
        <EmptyState message="Nenhuma categoria encontrada." />
      )}

      {usingFallbackCategories ? (
        <p className="mt-4 text-sm text-amber-700">
          Categorias exibidas em modo de contingencia devido a indisponibilidade temporaria da API.
        </p>
      ) : null}

      {!homeCategoryCarouselEnabled && (
        <div className="mt-8 md:mt-10 text-center">
          <Button asChild variant="outline" className="clay-chip rounded-full">
            <Link href="/categories" className="group">
              Ver Todas as Categorias <ArrowRight className="ml-2 h-5 w-5 smooth-transition group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      )}
    </SectionShell>
  );
}

async function CompaniesSectionWrapper({
  dataPromise,
}: {
  dataPromise: ReturnType<typeof getCompaniesDataCached>;
}) {
  let companies: Company[] = [];
  let companiesBanners: Banner[] = [];
  try {
    const data = await dataPromise;
    companies = Array.isArray(data?.companies) ? data.companies : [];
    companiesBanners = Array.isArray(data?.companiesBanners) ? data.companiesBanners : [];
  } catch (error) {
    console.error('[Home] CompaniesSectionWrapper fallback triggered:', error);
  }

  return (
    <SectionShell>
      <SectionHeader
        title="Empresas em Destaque"
        subtitle="Os instaladores mais bem avaliados e confiáveis da plataforma."
        right={
          <Button asChild variant="ghost" className="text-brand-blue font-bold clay-chip">
            <Link href="/companies" className="group">
              Ver Todas as Empresas <ArrowRight className="ml-2 h-5 w-5 smooth-transition group-hover:translate-x-0.5" />
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-8">
        {/* Native Featured Banner linked to Section Header */}
        {companiesBanners.length > 0 && (
          <BannerByLocationLazy 
            location="companies_top" 
            initialBanners={companiesBanners.slice(0, 1)} 
            className="clay-panel rounded-clay-xl border border-clay-shadow-light overflow-hidden"
          />
        )}

        {companies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
            {companies.slice(0, 8).map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        ) : (
          <EmptyState message="Nenhuma empresa em destaque encontrada." />
        )}
      </div>

      <div className="mt-12 text-center">
        <CTAPrimaryButton 
          label="Explorar todas as empresas" 
          href="/companies"
          ctaType="external"
          ctaDestination="/companies"
          className="md:w-auto w-full clay-btn-primary" 
        />
      </div>
    </SectionShell>
  );
}
