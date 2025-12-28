'use client';

import Hero from '@/components/Hero';
import CategoryCard from '@/components/CategoryCard';
import CompanyCard from '@/components/CompanyCard';
import { categoriesApiSafe, companiesApiSafe, reviewsApiSafe } from '@/lib/api-client';
import { Category, Company, Review } from '@/lib/api';
import { useEffect, useState, ReactNode } from 'react';
import { ArrowRight, MessageCircle, ShieldCheck, Clock, Info, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

function SectionShell({ children, zebra, className }: { children: ReactNode; zebra?: boolean; className?: string }) {
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

function TrustRow() {
  return (
    <div className="px-4 md:px-6">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <span className="text-sm text-gray-700">Empresas verificadas</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-gray-700">Avaliações reais</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3">
            <Clock className="h-5 w-5 text-indigo-600" />
            <span className="text-sm text-gray-700">Orçamento rápido</span>
          </div>
        </div>
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
      <div className="relative h-28 bg-gray-100">
        <Skeleton className="w-full h-full" />
      </div>
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
    </Card>
  );
}

function SkeletonCompanyCard() {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-32 bg-gray-100">
        <Skeleton className="w-full h-full" />
      </div>
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </Card>
  );
}

export default function Home() {
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
        const response = await categoriesApiSafe.getAll({ featured: true, status: 'active', limit: 8 });
        if (process.env.NODE_ENV !== 'production') console.log('[Home] Categories response:', response);
        setFeaturedCategories(response);
      } catch (error) {
        setErrorCategories('Erro ao carregar categorias.');
      } finally {
        setLoadingCategories(false);
      }
    };

    const fetchCompanies = async () => {
      try {
        const response = await companiesApiSafe.getAll({ status: 'active', featured: true, limit: 12, include: 'logo_url' });
        setCompanies(response);
      } catch (error) {
        setErrorCompanies('Erro ao carregar empresas.');
      } finally {
        setLoadingCompanies(false);
      }
    };

    const fetchReviews = async () => {
      try {
        const response = await reviewsApiSafe.getAll();
        setReviews(response);
      } catch (error) {
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
      <Hero />
      <TrustRow />

      {featuredCategories.length > 0 && (
        <div className="container mx-auto px-4 md:px-6 max-w-[1000px]">
          <CategoryCard category={featuredCategories[0]} layout="top" />
        </div>
      )}

      <SectionShell zebra>
        <SectionHeader
          title="Explore Nossas Categorias"
          subtitle="Encontre o que você precisa, de painéis solares a consultoria especializada."
        />
        {loadingCategories ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCategoryCard key={i} />
            ))}
          </div>
        ) : errorCategories ? (
          <ErrorState message={errorCategories} />
        ) : featuredCategories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {featuredCategories.map((category) => (
              <CategoryCard key={category.id} category={category} layout="top" />
            ))}
          </div>
        ) : (
          <EmptyState message={`Nenhuma categoria encontrada. (${featuredCategories.length} categorias carregadas)`} />
        )}
        <div className="mt-8 md:mt-10 text-center">
          <Button asChild>
            <Link href="/categories" className="group">
              Ver Todas as Categorias <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </SectionShell>

      <SectionShell>
        <SectionHeader
          title="Empresas Parceiras"
          subtitle="Conheça as empresas mais bem avaliadas e verificadas pelos nossos usuários."
          right={
            <Button asChild>
              <Link href="/companies" className="group">
                Ver Todas as Empresas <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          }
        />
        {loadingCompanies ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCompanyCard key={i} />
            ))}
          </div>
        ) : errorCompanies ? (
          <ErrorState message={errorCompanies} />
        ) : (
          <div className="px-2 md:px-0">
            <Carousel opts={{ align: 'start', loop: true }} className="w-full">
              <CarouselContent className="-ml-4">
                {companies.map((company) => (
                  <CarouselItem key={company.id} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                    <CompanyCard company={company} compact={true} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex" />
              <CarouselNext className="hidden md:flex" />
            </Carousel>
            <div className="mt-3 md:hidden flex items-center justify-center text-xs text-gray-500">
              <span>Arraste para ver mais</span>
              <ArrowRight className="ml-1 h-4 w-4" />
            </div>
          </div>
        )}
        <div className="mt-8 md:mt-10 text-center md:hidden">
          <Button asChild>
            <Link href="/companies" className="group">
              Ver Todas as Empresas <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </SectionShell>

    </main>
  );
}
