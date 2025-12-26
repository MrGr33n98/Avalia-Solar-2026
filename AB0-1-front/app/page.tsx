'use client';

import Hero from '@/components/Hero';
import CategoryCard from '@/components/CategoryCard';
import CompanyCard from '@/components/CompanyCard';
import { categoriesApiSafe, companiesApiSafe, reviewsApiSafe } from '@/lib/api-client';
import { Category, Company, Review } from '@/lib/api';
import { useEffect, useState } from 'react';
import { ArrowRight, Star, MapPin, MessageCircle } from 'lucide-react'; // Adicionado ArrowRight aqui
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

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
        console.log('[Home] Fetching categories...');
        const response = await categoriesApiSafe.getAll({ 
          featured: true, 
          status: 'active', 
          limit: 8 
        });
        console.log('[Home] Categories response:', response);
        setFeaturedCategories(response);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setErrorCategories('Erro ao carregar categorias.');
      } finally {
        setLoadingCategories(false);
      }
    };

    const fetchCompanies = async () => {
      try {
        const response = await companiesApiSafe.getAll({ status: 'active', featured: true, limit: 12, include: 'logo_url' }); // Garantir que logo_url seja incluído nos dados
        setCompanies(response);
      } catch (error) {
        console.error('Error fetching companies:', error);
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
        console.error('Error fetching reviews:', error);
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

      {/* Seção de Categorias */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">Explore Nossas Categorias</h2>
            <p className="text-center text-gray-600 mb-10">
              Encontre o que você precisa, de painéis solares a consultoria especializada.
            </p>

            {loadingCategories ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full" />
                ))}
              </div>
            ) : errorCategories ? (
              <p className="text-center text-red-500">{errorCategories}</p>
            ) : featuredCategories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {featuredCategories.map((category) => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">
                Nenhuma categoria encontrada. ({featuredCategories.length} categorias carregadas)
              </p>
            )}

            <div className="text-center mt-10">
              <Button asChild>
                <Link href="/categories">
                  Ver Todas as Categorias <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Seção de Empresas Parceiras */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">Empresas Parceiras</h2>
            <p className="text-center text-gray-600 mb-10">
              Conheça as empresas mais bem avaliadas e verificadas pelos nossos usuários.
            </p>

            {loadingCompanies ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-60 w-full" />
                ))}
              </div>
            ) : errorCompanies ? (
              <p className="text-center text-red-500">{errorCompanies}</p>
            ) : (
              <div className="px-4 md:px-12">
                <Carousel
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                  className="w-full"
                >
                  <CarouselContent className="-ml-4">
                    {companies.map((company) => (
                      <CarouselItem key={company.id} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                        <CompanyCard company={company} compact={true} className="md:compact-false" // Ajustar props para não compact em desktop, melhorando visibilidade de logos
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </div>
            )}

            <div className="text-center mt-10">
              <Button asChild>
                <Link href="/companies">
                  Ver Todas as Empresas <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Seção de Avaliações Recentes (Exemplo) */}
        {/* Você pode adicionar uma seção de avaliações aqui, similar às categorias e empresas */}
        {/* {loadingReviews ? (
          <p>Carregando avaliações...</p>
        ) : errorReviews ? (
          <p className="text-center text-red-500">{errorReviews}</p>
        ) : (
          <section className="py-12 bg-gray-50">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-8">Avaliações Recentes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.slice(0, 3).map((review) => (
                  <div key={review.id} className="bg-white p-6 rounded-lg shadow">
                    <p className="text-gray-800 italic">"{review.comment}"</p>
                    <div className="flex items-center mt-4">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="font-semibold">{review.rating}.0</span>
                      <span className="ml-2 text-gray-600">- {review.user_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )} */}
    </main>
  );
}
