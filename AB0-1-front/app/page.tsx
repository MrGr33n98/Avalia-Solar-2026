import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense, type ReactNode } from 'react';
import { ArrowRight, BadgeCheck, Info, ShieldCheck, Sparkles } from 'lucide-react';
import { unstable_cache } from 'next/cache';
import { cookies } from 'next/headers';

import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';
import FAQSection from '@/components/seo/FAQSection';
import HomeComparisonPreview from '@/components/home/HomeComparisonPreview';
import HomeCompanyCard from '@/components/home/HomeCompanyCard';
import { HomeConversionCTA } from '@/components/home/HomeConversionCTA';
import { CategoryCardsErrorBoundary } from '@/components/landing/CategoryCardsErrorBoundary';
import HowItWorks from '@/components/landing/HowItWorks';
import DecisionTransparency from '@/components/landing/DecisionTransparency';
import LandingCategoryCard from '@/components/landing/LandingCategoryCard';
import LandingHero from '@/components/landing/LandingHero';
import SavingsCalculator from '@/components/landing/SavingsCalculator';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { companiesApiSafe } from '@/lib/api-client';
import type { Category, Company } from '@/lib/api';
import { getFallbackCategories } from '@/lib/constants/fallback-categories';
import {
  HOME_HERO_EXPERIMENT_COOKIE,
  HOME_HERO_EXPERIMENT_ID,
  isHomeHeroExperimentEnabled,
  resolveHomeHeroVariant,
  type HomeHeroTrustMetrics,
  type HomeHeroVariant,
} from '@/lib/experiments/homeHeroExperiment';
import {
  getCachedActiveCategories,
  getCachedFeaturedCategories,
} from '@/lib/server/home-fallback-cache';

const HomePageTracking = dynamic(() => import('@/components/home/HomePageTracking'), {
  ssr: false,
  loading: () => null,
});
const HomeIdentityModalTrigger = dynamic(() => import('@/components/home/HomeIdentityModalTrigger'), {
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

export const revalidate = 3600;
const FALLBACK_CATEGORY_MIN_ID = 9000;

function SectionShell({
  children,
  tone = 'soft',
}: {
  children: ReactNode;
  tone?: 'soft' | 'white';
}) {
  return (
    <section className={tone === 'soft' ? 'bg-slate-50 py-14 sm:py-20' : 'bg-white py-14 sm:py-20'}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
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
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-700">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">{title}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">{subtitle}</p>
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
  const companies = await companiesApiSafe.getAll({
    status: 'active',
    featured: true,
    limit: 12,
    include:
      'logo_url,banner_url,average_rating,rating_count,verified,city,state,coverage_cities,coverage_states,response_time_sla,trust_score,active_admin,description,delivered_projects_score,warranty_years',
  });

  return { companies: Array.isArray(companies) ? companies : [] };
}

const getHeroDataCached = unstable_cache(
  async () => {
    const [allCategories, totalActiveCompanies, totalVerifiedCompanies] = await Promise.all([
      getCachedActiveCategories(),
      companiesApiSafe.getTotalCount({ status: 'active' }),
      companiesApiSafe.getTotalCount({ status: 'active', verified: true }),
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

    return { allCategories, trustMetrics };
  },
  ['home-hero-data-v3'],
  { revalidate: 600, tags: ['home-data', 'home-hero'] }
);

const getHomeDataCached = unstable_cache(async () => getHomeData(), ['home-categories-section-v2'], {
  revalidate: 600,
  tags: ['home-data', 'home-categories'],
});

const getCompaniesDataCached = unstable_cache(
  async () => getCompaniesData(),
  ['home-companies-section-v3'],
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
    <main className="flex-grow bg-white">
      <BreadcrumbSchema items={[{ name: 'Home', item: '/' }]} />
      <Suspense fallback={null}>
        <HomePageTracking />
      </Suspense>

      <Suspense fallback={<div className="min-h-[620px] animate-pulse bg-slate-100" />}>
        <LandingHeroWrapper
          dataPromise={heroDataPromise}
          variant={heroVariant}
          experimentEnabled={experimentEnabled}
        />
      </Suspense>

      <DecisionTransparency />
      <HowItWorks />
      <SavingsCalculator />

      <Suspense fallback={<div className="h-[520px] animate-pulse bg-slate-50" />}>
        <CategoriesSectionWrapper dataPromise={categoriesDataPromise} />
      </Suspense>

      <Suspense fallback={<div className="h-[720px] animate-pulse bg-white" />}>
        <CompaniesSectionWrapper dataPromise={companiesDataPromise} />
      </Suspense>

      <Suspense fallback={<div className="h-96 animate-pulse bg-white" />}>
        <ComparisonSectionWrapper dataPromise={companiesDataPromise} />
      </Suspense>

      <section className="border-t border-slate-200 bg-slate-50 py-14 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <FAQSection
            items={homeFaqs}
            subtitle="Respostas objetivas para comparar empresas e entender seu projeto antes de contratar."
          />
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1fr_auto] md:items-center lg:px-8">
          <div>
            <div className="flex items-center gap-2 text-amber-300">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs font-extrabold uppercase tracking-[0.15em]">Próximo passo seguro</span>
            </div>
            <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
              Faça a escolha certa para o seu projeto solar
            </h2>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-slate-300">
              <span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-emerald-400" /> Empresas verificadas</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Comparação sem compromisso</span>
            </div>
          </div>
          <HomeConversionCTA />
        </div>
      </section>

      <HomeIdentityModalTrigger />
    </main>
  );
}

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
    const { allCategories, trustMetrics } = await dataPromise;
    const safeCategories =
      Array.isArray(allCategories) && allCategories.length > 0
        ? allCategories
        : getFallbackCategories(8);

    return (
      <LandingHero
        categories={safeCategories}
        banners={[]}
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
        trustMetrics={{ totalActiveCompanies: null, totalVerifiedCompanies: null }}
      />
    );
  }
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

  const safeCategories = featuredCategories.length > 0 ? featuredCategories : getFallbackCategories(8);
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <HomeCompanyCard key={company.id} company={company} />
          ))}
        </div>
      ) : (
        <EmptyState message="Nenhuma empresa em destaque encontrada." />
      )}
    </SectionShell>
  );
}

async function ComparisonSectionWrapper({
  dataPromise,
}: {
  dataPromise: ReturnType<typeof getCompaniesDataCached>;
}) {
  try {
    const data = await dataPromise;
    return <HomeComparisonPreview companies={Array.isArray(data?.companies) ? data.companies : []} />;
  } catch (error) {
    console.error('[Home] ComparisonSectionWrapper fallback triggered:', error);
    return null;
  }
}
