'use client';





import { useMemo, useState, useEffect, useRef } from 'react';


import CategoryBanner from '@/components/CategoryBanner';


import CompanyCard from '@/components/CompanyCard';


import SidebarFilter from '@/components/SidebarFilter';


import { Category, Company, Banner } from '@/lib/api';


import { AlertCircle, Filter, Grid, Heart, Home, Search, Star, User, Zap } from 'lucide-react';


import { motion } from 'framer-motion';


import { Button } from '@/components/ui/button';


import { Skeleton } from '@/components/ui/skeleton';


import { openQuoteWizard } from '@/lib/quote-wizard';


import { Input } from '@/components/ui/input';


import Link from 'next/link';


import Image from 'next/image';


import { getFullImageUrl } from '@/utils/image';
import SponsorCarousel from '@/components/ui/sponsorcarousel';





const MotionDiv = motion.div;





interface CategoryClientProps {


  initialCategory: Category;


  initialCompanies: Company[];


  initialBanners?: Banner[];


}





function SponsorBanner({ banner }: { banner: Banner }) {


  const [imageError, setImageError] = useState(false);


  const [imageLoaded, setImageLoaded] = useState(false);


  const isMountedRef = useRef(true);





  useEffect(() => {


    isMountedRef.current = true;


    return () => {


      isMountedRef.current = false;


    };


  }, []);





  const imageUrl = getFullImageUrl(banner.image_url || '') || '';


  const hasImage = Boolean(imageUrl) && !imageError;


  return (


    <motion.div


      initial={{ opacity: 0, y: 14 }}


      animate={{ opacity: 1, y: 0 }}


      transition={{ duration: 0.45 }}


      className="w-full overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md"


    >


      <div


        className={[


          'relative w-full aspect-[8/1] overflow-hidden rounded-xl',


          hasImage && !imageLoaded ? 'animate-pulse bg-gradient-to-r from-slate-50 via-white to-slate-50' : 'bg-white',


        ].join(' ')}


      >


        {hasImage ? (


          <Image


            src={imageUrl}


            alt={banner.title || 'Patrocínio'}


            fill


            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"


            className={[


              'object-cover object-center',


              'transition-opacity duration-500',


              imageLoaded ? 'opacity-100' : 'opacity-0',


            ].join(' ')}


            onError={() => {


              if (!isMountedRef.current) return;


              setImageError(true);


            }}


            onLoad={() => {


              if (!isMountedRef.current) return;


              setImageLoaded(true);


            }}


          />


        ) : (


          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-primary/10 to-accent/10">


            <span className="text-xs font-medium text-gray-600">Banner de patrocnio indisponvel</span>


          </div>


        )}


      </div>


    </motion.div>


  );


}





function FeaturedCategorySection({ onQuoteClick }: { onQuoteClick: () => void }) {


  return (


    <motion.div


      initial={{ opacity: 0, y: 12 }}


      animate={{ opacity: 1, y: 0 }}


      transition={{ duration: 0.35 }}


      className="mt-3 w-full overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"


    >


      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-2 sm:px-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Categoria em Destaque</span>
      </div>
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">Painéis Solares</h3>
        <p className="text-xs sm:text-sm text-gray-700 leading-snug">
          Categoria destinada a todos os tipos de módulos fotovoltaicos, incluindo monocristalinos e policristalinos, cobrindo aplicações residenciais, comerciais e industriais. Encontre fabricantes e distribuidores com diferentes potências, eficiência e garantias.
        </p>
        <div className="pt-0.5 sm:pt-1">
          <Button onClick={onQuoteClick} size="sm" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">Fazer Orçamento</Button>
        </div>
      </div>
    </motion.div>


  );


}





export default function CategoryClientComponent({


  initialCategory,


  initialCompanies,


  initialBanners = [],


}: CategoryClientProps) {


  const [category] = useState<Category>(initialCategory);


  const [companies] = useState<Company[]>(initialCompanies);


  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>(initialCompanies);


  const [loadingCompanies] = useState(false);


  const [error] = useState<string | null>(null);


  const [showFilters, setShowFilters] = useState(false);


  const [banners] = useState<Banner[]>(initialBanners);





  const [filters, setFilters] = useState({


    searchTerm: '',


    state: '',


    city: '',


    rating: 0,


    verified: false,


  });





  useEffect(() => {


    let filtered = [...companies];





    if (filters.searchTerm) {


      const needle = filters.searchTerm.toLowerCase();


      filtered = filtered.filter(


        (company) =>


          (company.name || '').toLowerCase().includes(needle) ||


          (company.description || '').toLowerCase().includes(needle),


      );


    }





    if (filters.state) {


      filtered = filtered.filter(


        (company) =>


          company.state?.toLowerCase().includes(filters.state.toLowerCase()) ||


          company.address?.toLowerCase().includes(filters.state.toLowerCase()),


      );


    }





    if (filters.city) {


      filtered = filtered.filter(


        (company) =>


          company.city?.toLowerCase().includes(filters.city.toLowerCase()) ||


          company.address?.toLowerCase().includes(filters.city.toLowerCase()),


      );


    }





    if (filters.rating > 0) {


      filtered = filtered.filter((company) => (company.rating_avg || 0) >= filters.rating);


    }





    if (filters.verified) {


      filtered = filtered.filter((company) => company.status === 'active');


    }





    setFilteredCompanies(filtered);


  }, [filters, companies]);





  const handleFilterChange = (filterType: string, value: any) => {


    if (filterType === 'clearAll') {


      setFilters({


        searchTerm: '',


        state: '',


        city: '',


        rating: 0,


        verified: false,


      });


      return;


    }


    setFilters((prev) => ({


      ...prev,


      [filterType]: value,


      ...(filterType === 'state' && { city: '' }),


    }));


  };





  const mobileStates = useMemo(() => {


    const values = new Set<string>();


    companies.forEach((company) => {


      if (company.state) values.add(company.state);


    });


    return Array.from(values).sort().slice(0, 8);


  }, [companies]);





  const mobileCities = useMemo(() => {


    if (!filters.state) return [] as string[];


    const values = new Set<string>();


    companies.forEach((company) => {


      if (!company.city) return;


      if (company.state && company.state !== filters.state) return;


      values.add(company.city);


    });


    return Array.from(values).sort().slice(0, 8);


  }, [companies, filters.state]);





  const quickActions = [


    { label: 'Empresas', href: '/companies', icon: Home, styles: 'bg-yellow-100 text-yellow-700' },


    { label: 'Produtos', href: '/products', icon: Grid, styles: 'bg-green-100 text-green-700' },


    { label: 'Avaliar', href: '/reviews/my', icon: Star, styles: 'bg-orange-100 text-orange-700' },


    { label: 'Favoritos', href: '/profile?tab=favorites', icon: Heart, styles: 'bg-blue-100 text-blue-700' },


    { label: 'Blog', href: '/blog', icon: Zap, styles: 'bg-slate-100 text-slate-700' },


  ];





  const bannerUrl =


    getFullImageUrl((category as any)?.banner_url) || getFullImageUrl((category as any)?.image_url);





  const sponsorsCount = banners.length;





  if (error) {


    return (


      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">


        <div className="container mx-auto px-4 py-12">


          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">


            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-100">


              <AlertCircle className="h-12 w-12 text-red-500" />


            </div>


            <h1 className="mb-4 text-3xl font-bold text-gray-900">Categoria no encontrada</h1>


            <p className="mb-6 text-gray-600">A categoria no existe ou foi removida.</p>


            <div className="space-x-4">


              <Button onClick={() => window.history.back()}>Voltar</Button>


              <Button variant="outline" onClick={() => (window.location.href = '/categories')}>


                Ver todas as categorias


              </Button>


            </div>


            <p className="mt-4 text-sm text-red-600">Erro: {error}</p>


          </motion.div>


        </div>


      </div>


    );


  }





  return (


    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-white z-[800]">


      {/* =========================


          MOBILE


      ========================= */}


      <div className="md:hidden">


        <div className="z-40 bg-gradient-to-r from-primary to-accent shadow-sm">


          <div className="px-4 pt-3 pb-3">


            <div className="relative">


              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />


              <Input


                type="search"


                placeholder="Buscar empresas..."


                aria-label="Buscar empresas"


                value={filters.searchTerm}


                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}


                className="h-10 rounded-full bg-white pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-white/40"


              />


            </div>


          </div>


        </div>





        <div className="bg-[#f7f7f7] px-4 pb-24 pt-4 space-y-4">


          <section className="grid grid-cols-5 gap-3">


            {quickActions.map((action) => {


              const Icon = action.icon;


              return (


                <Link


                  key={action.label}


                  href={action.href}


                  className="flex flex-col items-center gap-1 text-center"


                  aria-label={action.label}


                >


                  <div className={`flex h-11 w-11 items-center justify-center rounded-full ${action.styles}`}>


                    <Icon className="h-5 w-5" />


                  </div>


                  <span className="text-[10px] font-medium text-gray-700">{action.label}</span>


                </Link>


              );


            })}


          </section>





          {/*  MOBILE BANNER */}


          <section className="relative h-24 overflow-hidden rounded-2xl bg-white shadow-sm">


            {bannerUrl ? (


              <Image


                src={bannerUrl}


                alt={`Banner ${category.name}`}


                fill


                sizes="100vw"


                className="object-cover object-center"


                priority


              />


            ) : (


              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20" />


            )}


            <div className="absolute inset-0 rounded-2xl ring-1 ring-black/5" />


            <div className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-gray-800">


              {category.name}


            </div>


          </section>





          {banners.length > 0 && (


            <>


              <section className="relative z-[950] space-y-2">


                <div className="flex items-center justify-between">


                  <h2 className="text-sm font-semibold text-gray-900">Patrocínios</h2>


                </div>





                <SponsorCarousel banners={banners} />


              </section>


              <FeaturedCategorySection onQuoteClick={() => openQuoteWizard({ source: 'category-page-featured-mobile' })} />


            </>


          )}





          {/* filtros mobile... */}


          <section className="space-y-3">


            <div>


              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">Estados</p>


              <div className="mt-2 flex gap-2 overflow-x-auto">


                <button


                  type="button"


                  onClick={() => handleFilterChange('state', '')}


                  className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${


                    !filters.state ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700'


                  }`}


                  aria-pressed={!filters.state}


                >


                  Todos


                </button>


                {mobileStates.map((state) => (


                  <button


                    key={state}


                    type="button"


                    onClick={() => handleFilterChange('state', state)}


                    className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${


                      filters.state === state


                        ? 'border-gray-900 bg-gray-900 text-white'


                        : 'border-gray-200 bg-white text-gray-700'


                    }`}


                    aria-pressed={filters.state === state}


                  >


                    {state}


                  </button>


                ))}


              </div>


            </div>





            {filters.state && mobileCities.length > 0 && (


              <div>


                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">Cidades</p>


                <div className="mt-2 flex gap-2 overflow-x-auto">


                  <button


                    type="button"


                    onClick={() => handleFilterChange('city', '')}


                    className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${


                      !filters.city ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700'


                    }`}


                    aria-pressed={!filters.city}


                  >


                    Todas


                  </button>


                  {mobileCities.map((city) => (


                    <button


                      key={city}


                      type="button"


                      onClick={() => handleFilterChange('city', city)}


                      className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${


                        filters.city === city


                          ? 'border-gray-900 bg-gray-900 text-white'


                          : 'border-gray-200 bg-white text-gray-700'


                      }`}


                      aria-pressed={filters.city === city}


                    >


                      {city}


                    </button>


                  ))}


                </div>


              </div>


            )}





            <div>


              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">Avaliaes</p>


              <div className="mt-2 flex gap-2 overflow-x-auto">


                {[5, 4, 3].map((rating) => (


                  <button


                    key={rating}


                    type="button"


                    onClick={() => handleFilterChange('rating', filters.rating === rating ? 0 : rating)}


                    className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${


                      filters.rating === rating


                        ? 'border-gray-900 bg-gray-900 text-white'


                        : 'border-gray-200 bg-white text-gray-700'


                    }`}


                    aria-pressed={filters.rating === rating}


                  >


                    {rating}+ estrelas


                  </button>


                ))}


                <button


                  type="button"


                  onClick={() => handleFilterChange('verified', !filters.verified)}


                  className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${


                    filters.verified


                      ? 'border-gray-900 bg-gray-900 text-white'


                      : 'border-gray-200 bg-white text-gray-700'


                  }`}


                  aria-pressed={filters.verified}


                >


                  Verificadas


                </button>


              </div>


            </div>


          </section>





          <section className="rounded-2xl bg-white p-5 shadow-sm space-y-4">


            <div>


              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">Sobre a categoria</p>


              <h2 className="mt-2 text-lg font-semibold text-gray-900">{category.name}</h2>


              {category.description && <p className="mt-2 text-xs text-gray-600">{category.description}</p>}


            </div>


          </section>





          <section className="space-y-3">


            <div className="flex items-center justify-between">


              <h2 className="text-base font-semibold text-gray-900">Empresas</h2>


              <span className="text-xs text-gray-600">{filteredCompanies.length} empresas</span>


            </div>





            {loadingCompanies ? (


              <div className="grid grid-cols-2 gap-3">


                {[...Array(6)].map((_, i) => (


                  <Skeleton key={i} className="h-40 rounded-xl bg-white" />


                ))}


              </div>


            ) : filteredCompanies.length > 0 ? (


              <div className="grid grid-cols-2 gap-3">


                {filteredCompanies.map((company) => (


                  <CompanyCard key={company.id} company={company} compact />


                ))}


              </div>


            ) : (


              <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">


                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">


                  <Filter className="h-5 w-5 text-yellow-700" />


                </div>


                <h3 className="text-sm font-semibold text-gray-900">Nenhuma empresa encontrada</h3>


                <p className="mt-1 text-xs text-gray-600">Ajuste os filtros ou termos de busca.</p>


              </div>


            )}


          </section>





          <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white">


            <div className="mx-auto flex max-w-md items-center justify-around py-2">


              <Link href="/" className="flex flex-col items-center gap-1 text-[10px] text-gray-600">


                <Home className="h-5 w-5" />


                Incio


              </Link>


              <Link href="/categories" className="flex flex-col items-center gap-1 text-[10px] text-gray-600">


                <Grid className="h-5 w-5" />


                Categorias


              </Link>


              <Link href="/profile?tab=favorites" className="flex flex-col items-center gap-1 text-[10px] text-gray-600">


                <Heart className="h-5 w-5" />


                Favoritos


              </Link>


              <Link href="/profile" className="flex flex-col items-center gap-1 text-[10px] text-gray-600">


                <User className="h-5 w-5" />


                Perfil


              </Link>


            </div>


          </nav>


        </div>


      </div>





      {/* =========================


          DESKTOP


      ========================= */}


      <div className="hidden md:block">


        <div className="container mx-auto px-4 py-6">


          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">


            <aside className="h-fit">


              <div className="lg:hidden mb-4">


                <Button onClick={() => setShowFilters(!showFilters)} variant="outline" className="w-full">


                  <Filter className="h-4 w-4 mr-2" />


                  Filtros


                </Button>


              </div>


              <div className={`lg:block ${showFilters ? 'block' : 'hidden'}`}>


                <SidebarFilter filters={filters} onFilterChange={handleFilterChange} />


              </div>


            </aside>





            <main>


              <div className="relative z-[1000]">


                <CategoryBanner


                  category={category}


                  companiesCount={companies.length}


                  onQuoteClick={() => openQuoteWizard({ source: 'category-page' })}


                />


              </div>





              {banners.length > 0 && (


                <>


                  <div className="relative z-[950] my-6">


                    <div className="mb-3 flex items-center justify-between">


                      <h2 className="text-lg font-semibold text-gray-900">Patrocínios</h2>


                    </div>


                    <SponsorCarousel banners={banners} />


                  </div>


                  <FeaturedCategorySection onQuoteClick={() => openQuoteWizard({ source: 'category-page-featured-desktop' })} />


                </>


              )}





              <div className="mt-6">


                <div className="flex items-center justify-between rounded-t-lg bg-white p-4 shadow-sm">


                  <h2 className="text-lg font-semibold text-gray-800">


                    Empresas de {category.name}


                  </h2>


                  <span className="text-sm text-gray-600">


                    {filteredCompanies.length} de {companies.length} empresas


                  </span>


                </div>





                {loadingCompanies ? (


                  <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">


                    {[...Array(6)].map((_, i) => (


                      <Skeleton key={i} className="h-64 rounded-lg" />


                    ))}


                  </div>


                ) : filteredCompanies.length > 0 ? (


                  <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">


                    {filteredCompanies.map((company) => (


                      <CompanyCard key={company.id} company={company} compact />


                    ))}


                  </div>


                ) : (


                  <div className="py-16 text-center">


                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">


                      <Search className="h-8 w-8 text-gray-500" />


                    </div>


                    <h3 className="text-xl font-semibold text-gray-800">Nenhuma empresa encontrada</h3>


                    <p className="mt-2 text-gray-600">


                      Tente ajustar seus filtros ou pesquisar por outro termo.


                    </p>


                  </div>


                )}


              </div>


            </main>


          </div>


        </div>


      </div>


    </div>


  );


}



























