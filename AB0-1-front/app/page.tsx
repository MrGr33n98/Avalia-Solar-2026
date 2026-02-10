import dynamic from 'next/dynamic';
import { Suspense, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, Info } from 'lucide-react';
import { unstable_cache } from 'next/cache';

import LandingHero from '@/components/landing/LandingHero';

const HowItWorks = dynamic(() => import('@/components/landing/HowItWorks'), {
  loading: () => <div className="h-96 animate-pulse bg-gray-100 rounded-xl" />
});
const SavingsCalculator = dynamic(() => import('@/components/landing/SavingsCalculator'), {
  ssr: false,
  loading: () => <div className="h-96 animate-pulse bg-gray-100 rounded-xl" />
});

import { CTAPrimaryButton } from '@/components/ui/CTAPrimaryButton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { companiesApiSafe } from '@/lib/api-client';
import type { Banner, Category, Company } from '@/lib/api';
import {
  getCachedActiveCategories,
  getCachedBanners,
  getCachedFeaturedCategories,
} from '@/lib/server/home-fallback-cache';

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
  loading: () => <div className="h-20 animate-pulse bg-gray-50 rounded-xl" />,
});
const FloatingWhatsApp = dynamic(() => import('@/components/FloatingWhatsApp'), {
  ssr: false,
  loading: () => null,
});

export const revalidate = 300;

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
    <section className={[zebra ? 'bg-gray-50' : '', 'py-10 md:py-14'].join(' ')}>
      <div className={['container mx-auto', 'px-4 md:px-6', className].filter(Boolean).join(' ')}>{children}</div>
    </section>
  );
}

function SectionHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="mb-8 md:mb-10">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h2>
          {subtitle ? <p className="text-gray-600 max-w-2xl leading-relaxed">{subtitle}</p> : null}
        </div>
        {right ? <div className="hidden md:block">{right}</div> : null}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="flex items-center gap-3 p-4 border-gray-200">
      <Info className="h-5 w-5 text-gray-500" />
      <p className="text-sm text-gray-600">{message}</p>
    </Card>
  );
}

async function getHomeData(): Promise<{
  featuredCategories: Category[];
  categoriesBanners: Banner[];
}> {
  const [featuredCategoriesRaw, categoriesBanners] = await Promise.all([
    getCachedFeaturedCategories(),
    getCachedBanners('categories_top'),
  ]);

  const featuredCategories = Array.isArray(featuredCategoriesRaw) ? featuredCategoriesRaw : [];
  const categoriesForHome =
    featuredCategories.length > 0
      ? featuredCategories
      : (await getCachedActiveCategories()).slice(0, 8);

  return {
    featuredCategories: categoriesForHome,
    categoriesBanners: Array.isArray(categoriesBanners) ? categoriesBanners : [],
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
    const allCategories = await getCachedActiveCategories();
    return { allCategories };
  },
  ['home-hero-data-v1'],
  { revalidate: 600, tags: ['home-data', 'home-hero'] }
);

const getHomeDataCached = unstable_cache(
  async () => getHomeData(),
  ['home-categories-section-v1'],
  { revalidate: 600, tags: ['home-data', 'home-categories'] }
);

const getCompaniesDataCached = unstable_cache(
  async () => getCompaniesData(),
  ['home-companies-section-v1'],
  { revalidate: 600, tags: ['home-data', 'home-companies'] }
);

export default async function Home() {
  const heroDataPromise = getHeroDataCached();
  const categoriesDataPromise = getHomeDataCached();
  const companiesDataPromise = getCompaniesDataCached();

  return (
    <main className="flex-grow">
      <Suspense fallback={null}>
        <HomePageTracking />
      </Suspense>

      <Suspense fallback={<div className="min-h-[600px] animate-pulse bg-gray-100" />}>
        <LandingHeroWrapper dataPromise={heroDataPromise} />
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
      <section className="py-20 bg-slate-900 text-white overflow-hidden relative">
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
              <CTAPrimaryButton label="Fazer Orçamento Grátis" className="h-14 px-10 text-lg" />
              <CTAPrimaryButton 
                label="Ler nosso blog" 
                variant="outline"
                href="/blog"
                ctaType="blog_view"
                className="h-14 px-10 text-lg border-white text-white hover:bg-white hover:text-slate-900 transition-all" 
              />
            </div>
          </div>
        </div>
      </section>

      <FloatingWhatsApp />
    </main>
  );
}

// ==============================
// WRAPPERS FOR STREAMING
// ==============================

async function LandingHeroWrapper({
  dataPromise,
}: {
  dataPromise: ReturnType<typeof getHeroDataCached>;
}) {
  const { allCategories } = await dataPromise;
  return <LandingHero categories={allCategories} />;
}

async function LandingCategoryChipsWrapper({
  dataPromise,
}: {
  dataPromise: ReturnType<typeof getHomeDataCached>;
}) {
  const { featuredCategories } = await dataPromise;
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
  const { featuredCategories, categoriesBanners } = await dataPromise;
  return (
    <SectionShell zebra>
      <BannerByLocationLazy location="categories_top" className="mb-8" initialBanners={categoriesBanners} />

      <SectionHeader
        title="Soluções por Categoria"
        subtitle="Encontre o que você precisa, de painéis solares a consultoria especializada."
      />

      {featuredCategories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {featuredCategories.map((category) => (
            <LandingCategoryCard key={category.id} category={category} />
          ))}
        </div>
      ) : (
        <EmptyState message="Nenhuma categoria encontrada." />
      )}

      <div className="mt-8 md:mt-10 text-center">
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/categories" className="group">
            Ver Todas as Categorias <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Button>
      </div>
    </SectionShell>
  );
}

async function CompaniesSectionWrapper({
  dataPromise,
}: {
  dataPromise: ReturnType<typeof getCompaniesDataCached>;
}) {
  const { companies, companiesBanners } = await dataPromise;
  return (
    <SectionShell>
      <BannerByLocationLazy location="companies_top" className="mb-8" initialBanners={companiesBanners} />

      <SectionHeader
        title="Empresas em Destaque"
        subtitle="Os instaladores mais bem avaliados e confiáveis da plataforma."
        right={
          <Button asChild variant="ghost" className="text-brand-blue font-bold">
            <Link href="/companies" className="group">
              Ver Todas as Empresas <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        }
      />

      {companies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6">
          {companies.slice(0, 8).map((company) => (
            <CompanyCard key={company.id} company={company} compact={true} />
          ))}
        </div>
      ) : (
        <EmptyState message="Nenhuma empresa em destaque encontrada." />
      )}

      <div className="mt-12 text-center">
        <Link href="/companies">
          <CTAPrimaryButton label="Explorar todas as empresas" className="md:w-auto w-full" />
        </Link>
      </div>
    </SectionShell>
  );
}
