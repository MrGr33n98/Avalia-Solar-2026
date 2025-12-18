'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ImageIcon,
  BarChart3,
  Banknote,
  Edit,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Company, Product, Review } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import CompanyInfo from '@/app/dashboard/components/CompanyInfo';
import { productsApiSafe, reviewsApiSafe } from '@/lib/api-client';

// Import new components
import CompanyHero from './components/CompanyHero';
import CompanySidebar from './components/CompanySidebar';
import CompanyOverview from './components/CompanyOverview';
import CompanyProducts from './components/CompanyProducts';
import CompanyReviews from './components/CompanyReviews';
import CompanyFinancing from './components/CompanyFinancing';
import CompanyStats from './components/CompanyStats';

interface CompanyDetailClientProps {
  company: Company;
}

export default function CompanyDetailClient({ company }: CompanyDetailClientProps) {
  const [currentCompany, setCurrentCompany] = useState<Company>(company);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Hero Image States
  const [bannerError, setBannerError] = useState(false);
  const [logoError, setLogoError] = useState(false);
  
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const canEdit = isAuthenticated && user?.role === 'company' && user?.company_id === company.id;
  
  // CTA States
  const enabledRawInit = (currentCompany as any).cta_whatsapp_enabled ?? (currentCompany as any).whatsapp_enabled;
  const [ctaEnabled, setCtaEnabled] = useState<boolean>(enabledRawInit === undefined || enabledRawInit === null ? true : Boolean(enabledRawInit));
  const [ctaUrl, setCtaUrl] = useState<string | null>((currentCompany as any).cta_whatsapp_url || (currentCompany as any).whatsapp_url || currentCompany.whatsapp || null);

  // Helper for URLs
  const getFullImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/api.*$/, '');
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const bannerUrl = useMemo(() => getFullImageUrl(currentCompany?.banner_url), [currentCompany?.banner_url]);
  const logoUrl = useMemo(() => getFullImageUrl(currentCompany?.logo_url), [currentCompany?.logo_url]);

  // Fetch Data
  useEffect(() => {
    if (!company?.id) {
      setError('Dados da empresa não encontrados');
      setProductsLoading(false);
      setReviewsLoading(false);
      return;
    }

    const fetchCompanyData = async () => {
      try {
        const cachedProducts = sessionStorage.getItem(`products_${company.id}`);
        const cachedReviews = sessionStorage.getItem(`reviews_${company.id}`);

        if (cachedProducts) {
          setProducts(JSON.parse(cachedProducts));
          setProductsLoading(false);
        }
        if (cachedReviews) {
          setReviews(JSON.parse(cachedReviews));
          setReviewsLoading(false);
        }

        const [productsResponse, reviewsResponse] = await Promise.allSettled([
          productsApiSafe.getAll({ company_id: company.id }),
          reviewsApiSafe.getAll({ company_id: company.id }),
        ]);

        if (productsResponse.status === 'fulfilled') {
          setProducts(productsResponse.value || []);
          sessionStorage.setItem(`products_${company.id}`, JSON.stringify(productsResponse.value));
        }

        if (reviewsResponse.status === 'fulfilled') {
          const onlyThisCompany = (reviewsResponse.value || []).filter((r: any) => String((r as any).company_id) === String(company.id));
          setReviews(onlyThisCompany);
          sessionStorage.setItem(`reviews_${company.id}`, JSON.stringify(onlyThisCompany));
        }

        setError(null);
      } catch (error) {
        console.error('Erro ao buscar dados da empresa:', error);
        setError('Erro ao carregar dados da empresa');
      } finally {
        setProductsLoading(false);
        setReviewsLoading(false);
      }
    };

    fetchCompanyData();
  }, [company?.id]);

  // Real-time Updates (Polling & Visibility)
  useEffect(() => {
    const refreshCompany = async () => {
      try {
        const refreshed = await (await import('@/lib/api')).companiesApi.getById(company.id);
        if (refreshed) {
          setCurrentCompany(refreshed);
          
          // Update legacy CTA states as well for backward compatibility
          const enabledRaw = (refreshed as any).cta_whatsapp_enabled ?? (refreshed as any).whatsapp_enabled;
          setCtaEnabled(enabledRaw === undefined || enabledRaw === null ? true : Boolean(enabledRaw));
          setCtaUrl((refreshed as any).cta_whatsapp_url || (refreshed as any).whatsapp_url || refreshed.whatsapp || null);
        }
      } catch (err) {
        console.warn('Background refresh failed', err);
      }
    };

    // Refresh on mount
    refreshCompany();

    // Refresh on visibility change
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshCompany();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Poll every 30 seconds
    const interval = setInterval(refreshCompany, 30000);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(interval);
    };
  }, [company.id]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">{error}</h1>
          <Button onClick={() => router.push('/companies')}>Voltar para lista de empresas</Button>
        </div>
      </div>
    );
  }

  // Calculate Stats
  const avgRating = reviews.length > 0 ? reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length : 0;
  
  const companyStats = {
    rating: avgRating,
    reviewCount: reviews.length,
    productCount: products.length,
    completedProjects: products.length * 10, // Mock
    yearsInBusiness: new Date().getFullYear() - new Date(company.created_at).getFullYear(),
  };

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <section className="relative bg-card pb-12 shadow-sm rounded-b-3xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          
          <CompanyHero 
            company={currentCompany}
            companyStats={companyStats}
            bannerUrl={bannerUrl}
            bannerError={bannerError}
            setBannerError={setBannerError}
            logoUrl={logoUrl}
            logoError={logoError}
            setLogoError={setLogoError}
            ctaEnabled={ctaEnabled}
            ctaUrl={ctaUrl}
          />

          <div className="mt-12">
            <Tabs defaultValue="overview" className="space-y-8">
              {/* Sticky Tabs Navigation */}
              <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 -mx-4 px-4 sm:mx-0 sm:px-0 transition-all duration-300 border-b border-border/40">
                <TabsList className="w-full flex items-center justify-start overflow-x-auto bg-muted/40 p-1.5 rounded-2xl sm:rounded-full border border-border/50 no-scrollbar gap-1 md:justify-center">
                  <TabsTrigger 
                    value="overview" 
                    className="flex items-center gap-2 rounded-xl sm:rounded-full px-4 py-2.5 min-w-fit data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:font-semibold transition-all duration-300 hover:bg-muted/60"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Visão Geral</span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="products" 
                    className="flex items-center gap-2 rounded-xl sm:rounded-full px-4 py-2.5 min-w-fit data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:font-semibold transition-all duration-300 hover:bg-muted/60"
                  >
                    <Package className="w-4 h-4" />
                    <span>Produtos</span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="reviews" 
                    className="flex items-center gap-2 rounded-xl sm:rounded-full px-4 py-2.5 min-w-fit data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:font-semibold transition-all duration-300 hover:bg-muted/60"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Avaliações</span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="financing" 
                    className="flex items-center gap-2 rounded-xl sm:rounded-full px-4 py-2.5 min-w-fit data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:font-semibold transition-all duration-300 hover:bg-muted/60"
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Financiamento</span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="gallery" 
                    className="flex items-center gap-2 rounded-xl sm:rounded-full px-4 py-2.5 min-w-fit data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:font-semibold transition-all duration-300 hover:bg-muted/60"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Galeria</span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="stats" 
                    className="flex items-center gap-2 rounded-xl sm:rounded-full px-4 py-2.5 min-w-fit data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:font-semibold transition-all duration-300 hover:bg-muted/60"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Estatísticas</span>
                  </TabsTrigger>

                  {canEdit && (
                    <TabsTrigger 
                      value="edit" 
                      className="flex items-center gap-2 rounded-xl sm:rounded-full px-4 py-2.5 min-w-fit data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:font-semibold transition-all duration-300 hover:bg-muted/60"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Editar</span>
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pt-4">
                <div className="lg:col-span-2 space-y-8 min-h-[500px]">
                  
                  <TabsContent value="overview" className="mt-0">
                    <CompanyOverview company={currentCompany} />
                  </TabsContent>

                  <TabsContent value="products" className="mt-0">
                    <CompanyProducts products={products} loading={productsLoading} />
                  </TabsContent>

                  <TabsContent value="reviews" className="mt-0">
                    <CompanyReviews reviews={reviews} loading={reviewsLoading} companyId={currentCompany.id} />
                  </TabsContent>

                  <TabsContent value="financing" className="mt-0">
                    <CompanyFinancing companyId={currentCompany.id} />
                  </TabsContent>
                  
                  <TabsContent value="gallery" className="mt-0">
                    <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-2xl border border-dashed">
                       <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                       <p className="text-muted-foreground">Galeria de fotos em desenvolvimento.</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="stats" className="mt-0">
                    <CompanyStats company={currentCompany} companyStats={companyStats} />
                  </TabsContent>

                  {canEdit && (
                    <TabsContent value="edit" className="mt-0 space-y-8">
                      <Card className="border-none shadow-md">
                        <CardHeader>
                          <CardTitle>Editar Empresa</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CompanyInfo companyId={String(currentCompany.id)} />
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}
                </div>

                {/* Sticky Sidebar */}
                <aside className="hidden lg:block">
                   <CompanySidebar company={currentCompany} />
                </aside>
                
                {/* Mobile Contact Info (Visible only on small screens below tabs content) */}
                <div className="lg:hidden mt-8">
                  <CompanySidebar company={currentCompany} />
                </div>

              </div>
            </Tabs>
          </div>
        </div>
      </section>
    </div>
  );
}
