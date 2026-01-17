'use client';

import { useState, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { api, Category } from '@/lib/api';
import CategoryCard from '@/components/CategoryCard';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getFullImageUrl } from '@/utils/image';
import { useCategoriesQuery, useFeaturedCategoriesQuery } from '@/hooks/useCategoriesQuery';

interface Banner {
  id: number;
  title: string;
  image_url: string;
  link_url: string;
  sponsored: boolean;
}

export default function CategoriesIndex() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Queries
  const { 
    data: featuredData, 
    isLoading: loadingFeatured 
  } = useFeaturedCategoriesQuery(8);

  const { 
    data: allData, 
    isLoading: loadingAll,
    error 
  } = useCategoriesQuery({ 
    view: 'cards',
    search: searchTerm 
  });

  const featuredCategories = featuredData?.data || [];
  const filteredCategories = allData?.data || [];
  const loading = loadingFeatured || loadingAll;

  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data } = await api.request<Banner[]>({ 
        url: '/banners?position=categories_top', 
        method: 'GET' 
      });
      setBanners(data);
    } catch (error) {
      console.error('Erro ao carregar banners:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Skeleton do carrossel */}
        <Skeleton className="w-full h-[300px] rounded-lg mb-12" />
        
        {/* Skeleton das categorias em destaque */}
        <h2 className="text-2xl font-bold mb-6">Categorias em Destaque</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-[280px] rounded-xl" />
          ))}
        </div>

        {/* Skeleton de todas as categorias */}
        <h2 className="text-2xl font-bold mb-6">Todas as Categorias</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="h-[280px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar categorias. Tente novamente.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Carrossel */}
      {banners.length > 0 && (
        <section className="mb-12">
          <div className="overflow-hidden rounded-lg" ref={emblaRef}>
            <div className="flex">
              {banners.map((banner) => (
                <div key={banner.id} className="flex-[0_0_100%] min-w-0">
                  {banner.link_url ? (
                    <a href={banner.link_url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={getFullImageUrl(banner.image_url) || ''}
                        alt={banner.title}
                        className="w-full h-[300px] object-cover rounded-lg"
                      />
                    </a>
                  ) : (
                    <img
                      src={getFullImageUrl(banner.image_url) || ''}
                      alt={banner.title}
                      className="w-full h-[300px] object-cover rounded-lg"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categorias em Destaque */}
      {featuredCategories.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Categorias em Destaque</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredCategories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>
      )}

      {/* Barra de Busca */}
      <section className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar categorias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </section>

      {/* Todas as Categorias */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Todas as Categorias</h2>
          <p className="text-sm text-gray-600">
            {filteredCategories.length} {filteredCategories.length === 1 ? 'categoria' : 'categorias'}
          </p>
        </div>
        
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Nenhuma categoria encontrada com o termo &quot;{searchTerm}&quot;
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredCategories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
