'use client';

import { useState, useEffect } from 'react';
import CategoryBanner from '@/components/CategoryBanner';
import CompanyCard from '@/components/CompanyCard';
import SidebarFilter from '@/components/SidebarFilter';
import { fetchCategoryBySlug, Category, Company, companiesApi, categoriesApi, Banner } from '@/lib/api';
import { AlertCircle, Building2, Package, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface CategoryClientProps {
  initialCategory: Category;
  initialCompanies: Company[];
  initialBanners?: Banner[];
}

export default function CategoryClientComponent({ initialCategory, initialCompanies, initialBanners = [] }: CategoryClientProps) {
  const [category] = useState<Category>(initialCategory);
  const [companies] = useState<Company[]>(initialCompanies);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>(initialCompanies);
  const [loadingCompanies] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [banners] = useState<Banner[]>(initialBanners);
  const [filters, setFilters] = useState({
    state: '',
    city: '',
    rating: 0,
    verified: false
  });

  // Apply filters
  useEffect(() => {
    let filtered = [...companies];

    if (filters.state) {
      filtered = filtered.filter(company => 
        company.state?.toLowerCase().includes(filters.state.toLowerCase()) ||
        company.address?.toLowerCase().includes(filters.state.toLowerCase())
      );
    }

    if (filters.city) {
      filtered = filtered.filter(company => 
        company.city?.toLowerCase().includes(filters.city.toLowerCase()) ||
        company.address?.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    if (filters.rating > 0) {
      filtered = filtered.filter(company => 
        (company.rating_avg || 0) >= filters.rating
      );
    }

    if (filters.verified) {
      filtered = filtered.filter(company => company.status === 'active');
    }

    setFilteredCompanies(filtered);
  }, [filters, companies]);

  // Handle filter changes from SidebarFilter
  const handleFilterChange = (filterType: string, value: any) => {
    if (filterType === 'clearAll') {
      setFilters({
        state: '',
        city: '',
        rating: 0,
        verified: false
      });
      return;
    }
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
      ...(filterType === 'state' && { city: '' })
    }));
  };

  // Error state - this would be handled on the server side now
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 py-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Categoria não encontrada
            </h1>
            <p className="text-gray-600 mb-6">
              A categoria não existe ou foi removida.
            </p>
            <div className="space-x-4">
              <Button 
                onClick={() => window.history.back()}
              >
                Voltar
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/categories'}
              >
                Ver todas as categorias
              </Button>
            </div>
            <p className="mt-4 text-sm text-red-600">Erro: {error}</p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Success state - show the category with banner and companies
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Category Banner - smaller height */}
      <div className="mb-8">
        <CategoryBanner 
          category={category}
          companiesCount={companies.length}
          productsCount={category.products?.length || 0}
          height="h-48" // Reduced height
        />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="lg:hidden mb-4">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
            
            <div className={`lg:block ${showFilters ? 'block' : 'hidden'}`}>
              <SidebarFilter
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {banners.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Patrocínios</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {banners.map((banner) => (
                    <a key={banner.id} href={banner.link || '#'} target={banner.link ? '_blank' : undefined} rel={banner.link ? 'noopener noreferrer' : undefined} className="block">
                      <img src={banner.image_url || ''} alt={banner.title} className="w-full h-40 object-cover rounded-lg" />
                    </a>
                  ))}
                </div>
              </div>
            )}
            {/* Category Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-6 mb-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Sobre {category.name}
              </h2>
              
              {category.description && (
                <div className="prose max-w-none text-gray-600 mb-6">
                  <p>{category.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <Building2 className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-xl font-bold text-blue-600">
                    {companies.length}
                  </div>
                  <div className="text-sm text-blue-800">
                    {companies.length === 1 ? 'Empresa' : 'Empresas'}
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <Package className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <div className="text-xl font-bold text-green-600">
                    {category.products?.length || 0}
                  </div>
                  <div className="text-sm text-green-800">
                    {(category.products?.length || 0) === 1 ? 'Produto' : 'Produtos'}
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4 text-center col-span-2 md:col-span-1">
                  <div className="text-xl font-bold text-purple-600 mb-2">
                    {category.featured ? '★' : '—'}
                  </div>
                  <div className="text-sm text-purple-800">
                    {category.featured ? 'Em Destaque' : 'Categoria'}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Companies Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Empresas em {category.name}
                </h3>
                <div className="text-sm text-gray-600">
                  {filteredCompanies.length} de {companies.length} empresas
                </div>
              </div>

              {loadingCompanies ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <Skeleton className="h-4 w-1/2 mb-2" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                  ))}
                </div>
              ) : filteredCompanies.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredCompanies.map((company, index) => (
                    <motion.div
                      key={company.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <CompanyCard company={company} />
                    </motion.div>
                  ))}
                </div>
              ) : companies.length > 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Filter className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhuma empresa encontrada
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Tente ajustar os filtros para ver mais resultados.
                  </p>
                  <Button
                    onClick={() => setFilters({ state: '', city: '', rating: 0, verified: false })}
                    variant="outline"
                  >
                    Limpar filtros
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhuma empresa cadastrada
                  </h3>
                  <p className="text-gray-600">
                    Ainda não há empresas cadastradas nesta categoria.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
