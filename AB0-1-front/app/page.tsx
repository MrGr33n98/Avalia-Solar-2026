'use client';

import { useEffect, useState, ReactNode, Suspense } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Info } from 'lucide-react';

import BannerByLocation from '@/components/BannerByLocation';
import CompanyCard from '@/components/CompanyCard';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import LandingCategoryCard from '@/components/landing/LandingCategoryCard';
import LandingCategoryChips from '@/components/landing/LandingCategoryChips';
import LandingHero from '@/components/landing/LandingHero';
import HowItWorks from '@/components/landing/HowItWorks';
import SavingsCalculator from '@/components/landing/SavingsCalculator';
import LandingTrustBanner from '@/components/landing/LandingTrustBanner';
import { CTAPrimaryButton } from '@/components/ui/CTAPrimaryButton';
import { TrustRow } from '@/components/ui/TrustRow';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import { categoriesApiSafe, companiesApiSafe, reviewsApiSafe } from '@/lib/api-client';
import type { Category, Company, Review } from '@/lib/api';
import { usePageTracking } from '@/hooks/usePageTracking';
import { trackCompanyClick, trackCategoryClick, trackCTAClick } from '@/lib/dataLayer';

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

function ErrorState({ message }: { message: string }) {
  return (
    <Card className="flex items-center gap-3 p-4 border-red-200 bg-red-50">
      <AlertCircle className="h-5 w-5 text-red-600" />
      <p className="text-sm text-red-700">{message}</p>
    </Card>
  );
}

function SkeletonCategoryCard() {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[3/1] bg-gray-100">
        <Skeleton className="w-full h-full" />
      </div>
      <div className="p-3 space-y-2">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-2.5 w-full" />
      </div>
    </Card>
  );
}

function SkeletonCompanyCard() {
  return (
    <Card className="overflow-hidden">
      <div className="relative bg-gray-100 aspect-[4/1]">
        <Skeleton className="w-full h-full" />
      </div>
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </Card>
  );
}

function HomePageContent() {
  // GTM Page Tracking
  usePageTracking({
    type: 'homepage',
    title: 'Avalia Solar - Encontre Empresas de Energia Solar',
    sections: ['hero', 'categories', 'companies', 'testimonials'],
  });

  const [featuredCategories, setFeaturedCategories] = useState<Category[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [errorCategories, setErrorCategories] = useState<string | null>(null);
  const [errorCompanies, setErrorCompanies] = useState<string | null>(null);
  const [errorReviews, setErrorReviews] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        if (process.env.NODE_ENV !== 'production') console.log('[Home] Fetching categories...');
        const response = await categoriesApiSafe.getAll({ 
          featured: true, 
          status: 'active', 
          limit: 8,
          include: 'average_rating,reviews_count'
        } as any);
        if (process.env.NODE_ENV !== 'production') console.log('[Home] Categories response:', response);
        setFeaturedCategories(response);
      } catch {
        setErrorCategories('Erro ao carregar categorias.');
      } finally {
        setLoadingCategories(false);
      }
    };

    const fetchCompanies = async () => {
      try {
        const response = await companiesApiSafe.getAll({
          status: 'active',
          featured: true,
          limit: 12,
          include: 'logo_url,banner_url,average_rating,rating_count',
        });
        if (process.env.NODE_ENV !== 'production') {
          const withBanner = (response || []).filter((c) => !!c.banner_url);
          console.log('[Home] Companies loaded:', response?.length || 0, 'with banner_url:', withBanner.length);
        }
        setCompanies(response);
      } catch {
        setErrorCompanies('Erro ao carregar empresas.');
      } finally {
        setLoadingCompanies(false);
      }
    };

    const fetchReviews = async () => {
      try {
        const response = await reviewsApiSafe.getAll();
        setReviews(response);
      } catch {
        setErrorReviews('Erro ao carregar avaliações.');
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchCategories();
    fetchCompanies();
    fetchReviews();
  }, []);

  return (
    <main className="flex-grow">
      <LandingHero />
      
      <div className="py-8 bg-slate-50 border-y border-slate-100">
        <LandingCategoryChips categories={featuredCategories} />
      </div>

      <HowItWorks />

      <SavingsCalculator />

      <TrustRow />

      <SectionShell zebra>
        <BannerByLocation location="categories_top" className="mb-8" />

        <SectionHeader
          title="Soluções por Categoria"
          subtitle="Encontre o que você precisa, de painéis solares a consultoria especializada."
        />

        {loadingCategories ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCategoryCard key={i} />
            ))}
          </div>
        ) : errorCategories ? (
          <ErrorState message={errorCategories} />
        ) : featuredCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {featuredCategories.map((category) => (
              <LandingCategoryCard key={category.id} category={category} />
            ))}
          </div>
        ) : (
          <EmptyState message={`Nenhuma categoria encontrada. (${featuredCategories.length} categorias carregadas)`} />
        )}

        <div className="mt-8 md:mt-10 text-center">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/categories" className="group">
              Ver Todas as Categorias <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </SectionShell>

      <SectionShell>
        <BannerByLocation location="companies_top" className="mb-8" />

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

        {loadingCompanies ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCompanyCard key={i} />
            ))}
          </div>
        ) : errorCompanies ? (
          <ErrorState message={errorCompanies} />
        ) : companies.length > 0 ? (
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

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  );
}
