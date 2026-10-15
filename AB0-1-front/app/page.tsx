import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense, type ReactNode } from 'react';
import { ArrowRight, BadgeCheck, Info, ShieldCheck, Sparkles } from 'lucide-react';
import { unstable_cache } from 'next/cache';

import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';
import FAQSection from '@/components/seo/FAQSection';
import DeferredHomeSections from '@/components/home/DeferredHomeSections';
import HomeComparisonPreview from '@/components/home/HomeComparisonPreview';
import { HomeConversionCTA } from '@/components/home/HomeConversionCTA';
import { CategoryCardsErrorBoundary } from '@/components/landing/CategoryCardsErrorBoundary';
import LandingCategoryCard from '@/components/landing/LandingCategoryCard';
import PublicCompanyCard from '@/components/company/PublicCompanyCard';
import RecommendedCompaniesSection from '@/components/home/RecommendedCompaniesSection';
import HomeLocationBar from '@/components/home/HomeLocationBar';
import HomeCategoryRail from '@/components/home/HomeCategoryRail';
import HomeHeroBanner from '@/components/home/HomeHeroBanner';
import HomeBrandsRail from '@/components/home/HomeBrandsRail';
import HomeCompaniesRail from '@/components/home/HomeCompaniesRail';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { publicCompaniesApi } from '@/lib/api-public';
import type { Category, Company, Banner } from '@/lib/api';
import { getFallbackCategories } from '@/lib/constants/fallback-categories';
import {
  getCachedActiveCategories,
  getCachedFeaturedCategories,
  getCachedBanners,
} from '@/lib/server/home-fallback-cache';

const HomePageTracking = dynamic(() => import('@/components/home/HomePageTracking'), {
  ssr: false,
  loading: () => null,
});
const homeFaqs = [
  {
    question: 'Como funciona o Avalia Solar?',
    answer:
      'O Avalia Solar reúne empresas, avaliações públicas e informações de reputação para ajudar você a comparar opções e solicitar propostas. A plataforma não executa instalações e não substitui a análise técnica do imóvel.',
  },
  {
    question: 'Quanto custa instalar energia solar residencial no Brasil em 2026?',
    answer:
      'O valor depende do consumo, da tarifa local, do telhado e dos equipamentos escolhidos. O diagnóstico da página apresenta apenas uma faixa educativa; a proposta técnica de cada empresa confirma o investimento real.',
  },
  {
    question: 'Como uma empresa é verificada?',
    answer:
      'A verificação considera dados cadastrais e informações públicas disponíveis. Avaliações, cobertura e outros sinais permanecem visíveis separadamente para que você faça sua própria análise.',
  },
  {
    question: 'Posso comparar mais de uma empresa?',
    answer:
      'Sim. Você pode selecionar até três empresas e comparar reputação, avaliações, cobertura e outras informações antes de pedir propostas.',
  },
  {
    question: 'O Avalia Solar vende equipamentos ou faz a instalação?',
    answer:
      'Não. O Avalia Solar é uma plataforma independente de descoberta, reputação e comparação. A contratação e a execução do projeto são realizadas diretamente com a empresa escolhida.',
  },
];

export const revalidate = 300;
const FALLBACK_CATEGORY_MIN_ID = 9000;

function SectionShell({
  children,
  tone = 'soft',
}: {
  children: ReactNode;
  tone?: 'soft' | 'white';
}) {
  return (
    <section
      className={
        tone === 'soft' ? 'bg-slate-50/20 py-14 sm:py-20' : 'bg-transparent py-14 sm:py-20'
      }
    >
      <div className="mx-auto max-w-[1320px] px-5 sm:px-6 lg:px-8 xl:px-10">{children}</div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:mb-10 md:flex-row md:items-end">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-700">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
          {title}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          {subtitle}
        </p>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="flex items-center gap-3 rounded-2xl border-slate-200 bg-white p-5 shadow-none">
      <Info className="h-5 w-5 text-slate-400" aria-hidden="true" />
      <p className="text-sm text-slate-600">{message}</p>
    </Card>
  );
}

async function getHomeData(): Promise<{ featuredCategories: Category[] }> {
  const featuredCategoriesRaw = await getCachedFeaturedCategories();
  const featuredCategories = Array.isArray(featuredCategoriesRaw) ? featuredCategoriesRaw : [];
  const categoriesForHome =
    featuredCategories.length > 0
      ? featuredCategories
      : (await getCachedActiveCategories()).slice(0, 8);

  return { featuredCategories: categoriesForHome };
}

async function getCompaniesData(): Promise<{ companies: Company[] }> {
  const companies = await publicCompaniesApi.getAll({
    status: 'active',
    featured: true,
    limit: 12,
    include:
      'logo_url,badges,verified_badge_image_url,verified_badge_url,average_rating,rating_count,verified,city,state,coverage_cities,coverage_states,response_time_sla,delivered_projects_score,warranty_years',
  });

  return { companies: Array.isArray(companies) ? companies : [] };
}

const getHomeDataCached = unstable_cache(
  async () => getHomeData(),
  ['home-categories-section-v2'],
  {
    revalidate: 600,
    tags: ['home-data', 'home-categories'],
  }
);

const getCompaniesDataCached = unstable_cache(
  async () => getCompaniesData(),
  ['home-companies-section-v4'],
  { revalidate: 600, tags: ['home-data', 'home-companies'] }
);

const getHomeBannersCached = unstable_cache(
  async () => getCachedBanners('home_top'),
  ['home-hero-banners-top'],
  { revalidate: 300, tags: ['home-data', 'banners'] }
);

export default async function Home() {
  const categoriesDataPromise = getHomeDataCached();
  const companiesDataPromise = getCompaniesDataCached();
  const bannersDataPromise = getHomeBannersCached();

  return (
    <main className="flex-grow bg-transparent">
      <BreadcrumbSchema items={[{ name: 'Home', item: '/' }]} />
      <Suspense fallback={null}>
        <HomePageTracking />
      </Suspense>

      {/* 1. Barra de Localização Compacta */}
      <div className="mx-auto max-w-[1320px]">
        <Suspense fallback={<div className="h-8 animate-pulse bg-slate-50 rounded" />}>
          <HomeLocationBar defaultState="SC" />
        </Suspense>
      </div>

      {/* 2. Categorias: EXATAMENTE UMA LINHA com ícones 3D */}
      <div className="mx-auto max-w-[1320px]">
        <Suspense fallback={<div className="h-20 animate-pulse bg-slate-50 rounded" />}>
          <HomeCategoryRail />
        </Suspense>
      </div>

      {/* 3. Hero Banner Compacto com Foto, CTA e Banners do ActiveAdmin */}
      <div className="mx-auto max-w-[1320px]">
        <Suspense fallback={<div className="h-[240px] w-full animate-pulse rounded-2xl bg-slate-50 mx-4 my-2" />}>
          <HomeHeroBannerWrapper dataPromise={bannersDataPromise} />
        </Suspense>
      </div>

      {/* 4. Marcas em Destaque no Catálogo (Logos reais de empresas parceiras/fabricantes) */}
      <div className="mx-auto max-w-[1320px]">
        <Suspense fallback={<div className="h-16 w-full animate-pulse rounded-xl bg-slate-50 mx-4 my-2" />}>
          <HomeBrandsRailWrapper dataPromise={companiesDataPromise} />
        </Suspense>
      </div>

      {/* 5. Empresas em Destaque na Região (Trilha Horizontal de Cards) */}
      <div className="mx-auto max-w-[1320px]">
        <Suspense fallback={<div className="h-44 w-full animate-pulse rounded-2xl bg-slate-50 mx-4 my-2" />}>
          <HomeCompaniesRailWrapper dataPromise={companiesDataPromise} />
        </Suspense>
      </div>

      <DeferredHomeSections />

      <Suspense fallback={<div className="h-[520px] animate-pulse bg-slate-50" />}>
        <CategoriesSectionWrapper dataPromise={categoriesDataPromise} />
      </Suspense>

      <Suspense fallback={<div className="h-[720px] animate-pulse bg-white" />}>
        <CompaniesSectionWrapper dataPromise={companiesDataPromise} />
      </Suspense>

      <Suspense fallback={<div className="h-96 animate-pulse bg-white" />}>
        <ComparisonSectionWrapper dataPromise={companiesDataPromise} />
      </Suspense>

      <section className="border-t border-slate-200 bg-slate-50/20 py-14 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <FAQSection
            items={homeFaqs}
            subtitle="Respostas objetivas para comparar empresas e entender seu projeto antes de contratar."
          />
        </div>
      </section>

      <section className="bg-slate-50/20 py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative isolate overflow-hidden rounded-none border border-slate-800/80 bg-[#070B16] px-6 py-10 text-white sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-8 lg:px-12 lg:py-12">
            <div
              className="pointer-events-none absolute inset-0 -z-10 opacity-55"
              aria-hidden="true"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 18% 12%, rgba(37,99,235,0.15), transparent 34%), radial-gradient(circle at 90% 82%, rgba(255,200,44,0.07), transparent 28%), radial-gradient(rgba(255,255,255,0.1) 0.65px, transparent 0.65px)',
                backgroundSize: 'auto, auto, 20px 20px',
              }}
            />
            <div
              className="pointer-events-none absolute -left-14 -bottom-20 h-40 w-40 rotate-45 border border-blue-400/15"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -right-16 -top-24 h-48 w-48 rotate-45 border border-[#FFC82C]/10"
              aria-hidden="true"
            />

            <div className="max-w-[690px]">
              <div className="flex items-center gap-2 text-[#FFC82C]">
                <Sparkles className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                  Próximo passo seguro
                </span>
              </div>
              <h2 className="mt-4 max-w-2xl text-3xl font-medium tracking-tight sm:text-4xl">
                Faça a escolha certa para o seu{' '}
                <span className="font-semibold text-[#FFC82C]">projeto solar</span>
              </h2>
              <div className="mt-6 flex flex-col gap-4 text-sm font-normal text-slate-300 sm:flex-row sm:items-center sm:gap-6">
                <span className="inline-flex items-center gap-2.5">
                  <BadgeCheck
                    className="h-4 w-4 text-[#22C55E]"
                    strokeWidth={1.6}
                    aria-hidden="true"
                  />{' '}
                  Empresas verificadas
                </span>
                <span className="hidden h-6 border-l border-white/15 sm:block" aria-hidden="true" />
                <span className="inline-flex items-center gap-2.5">
                  <ShieldCheck
                    className="h-4 w-4 text-[#22C55E]"
                    strokeWidth={1.6}
                    aria-hidden="true"
                  />{' '}
                  Comparação sem compromisso
                </span>
              </div>
            </div>
            <div className="mt-8 shrink-0 lg:mt-0">
              <HomeConversionCTA />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

async function HomeHeroBannerWrapper({
  dataPromise,
}: {
  dataPromise: ReturnType<typeof getHomeBannersCached>;
}) {
  let banners: Banner[] = [];
  try {
    const data = await dataPromise;
    banners = Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[Home] HomeHeroBannerWrapper fallback triggered:', error);
  }

  return <HomeHeroBanner banners={banners} />;
}

async function HomeBrandsRailWrapper({
  dataPromise,
}: {
  dataPromise: ReturnType<typeof getCompaniesDataCached>;
}) {
  let companies: Company[] = [];
  try {
    const data = await dataPromise;
    companies = Array.isArray(data?.companies) ? data.companies : [];
  } catch (error) {
    console.error('[Home] HomeBrandsRailWrapper fallback triggered:', error);
  }

  if (companies.length === 0) return null;

  return <HomeBrandsRail companies={companies} />;
}

async function HomeCompaniesRailWrapper({
  dataPromise,
}: {
  dataPromise: ReturnType<typeof getCompaniesDataCached>;
}) {
  let companies: Company[] = [];
  try {
    const data = await dataPromise;
    companies = Array.isArray(data?.companies) ? data.companies : [];
  } catch (error) {
    console.error('[Home] HomeCompaniesRailWrapper fallback triggered:', error);
  }

  if (companies.length === 0) return null;

  return <HomeCompaniesRail companies={companies} />;
}

async function CategoriesSectionWrapper({
  dataPromise,
}: {
  dataPromise: ReturnType<typeof getHomeDataCached>;
}) {
  let featuredCategories: Category[] = [];
  try {
    const data = await dataPromise;
    featuredCategories = Array.isArray(data?.featuredCategories) ? data.featuredCategories : [];
  } catch (error) {
    console.error('[Home] CategoriesSectionWrapper fallback triggered:', error);
  }

  const safeCategories =
    featuredCategories.length > 0 ? featuredCategories : getFallbackCategories(8);
  const usingFallbackCategories =
    safeCategories.length > 0 &&
    safeCategories.every((category) => Number(category?.id) >= FALLBACK_CATEGORY_MIN_ID);

  return (
    <SectionShell tone="soft">
      <SectionHeader
        eyebrow="Encontre o especialista certo"
        title="Soluções por categoria"
        subtitle="Escolha uma necessidade para ver empresas especializadas, avaliações e áreas de atendimento."
        right={
          <Button asChild variant="outline" className="border-slate-300 bg-white text-slate-800">
            <Link href="/categories">
              Ver todas <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      {safeCategories.length > 0 ? (
        <CategoryCardsErrorBoundary>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {safeCategories.slice(0, 8).map((category) => (
              <LandingCategoryCard key={category.id} category={category} />
            ))}
          </div>
        </CategoryCardsErrorBoundary>
      ) : (
        <EmptyState message="Nenhuma categoria encontrada." />
      )}

      {usingFallbackCategories ? (
        <p className="mt-4 text-sm text-amber-700" role="status">
          Categorias de contingência exibidas devido à indisponibilidade temporária da API.
        </p>
      ) : null}
    </SectionShell>
  );
}

async function CompaniesSectionWrapper({
  dataPromise,
}: {
  dataPromise: ReturnType<typeof getCompaniesDataCached>;
}) {
  let companies: Company[] = [];
  try {
    const data = await dataPromise;
    companies = Array.isArray(data?.companies) ? data.companies : [];
  } catch (error) {
    console.error('[Home] CompaniesSectionWrapper fallback triggered:', error);
  }

  const isRecommendationsEngineEnabled =
    process.env.NEXT_PUBLIC_RECOMMENDATIONS_ENGINE_ENABLED !== 'false';

  if (!isRecommendationsEngineEnabled) {
    return (
      <SectionShell tone="white">
        <SectionHeader
          eyebrow="Dados reais da plataforma"
          title="Empresas recomendadas para você"
          subtitle="Perfis em destaque com sinais de reputação, verificação, localização e atendimento."
          right={
            <Button asChild variant="outline" className="border-slate-300 bg-white text-slate-800">
              <Link href="/companies">
                Ver todas <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          }
        />

        {companies.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {companies.slice(0, 8).map((company) => (
              <PublicCompanyCard key={company.id} company={company} />
            ))}
          </div>
        ) : (
          <EmptyState message="Nenhuma empresa em destaque encontrada." />
        )}
      </SectionShell>
    );
  }

  return <RecommendedCompaniesSection initialCompanies={companies} />;
}

async function ComparisonSectionWrapper({
  dataPromise,
}: {
  dataPromise: ReturnType<typeof getCompaniesDataCached>;
}) {
  try {
    const data = await dataPromise;
    return (
      <HomeComparisonPreview companies={Array.isArray(data?.companies) ? data.companies : []} />
    );
  } catch (error) {
    console.error('[Home] ComparisonSectionWrapper fallback triggered:', error);
    return null;
  }
}
