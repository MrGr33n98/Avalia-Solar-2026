"use client";

import { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from 'next/dynamic';
import {
  LayoutDashboard,
  Package,
  ImageIcon,
  BarChart3,
  Banknote,
  Edit,
  MessageCircle,
  HelpCircle,
  AlertCircle,
  Scale,
} from "lucide-react";
import { useComparison } from "@/hooks/useComparison";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { Company, Product, Review } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { productsApiSafe, reviewsApiSafe } from "@/lib/api-client";
import { resolveWizardCategoryId } from "@/lib/lead-engine";
import { openQuoteWizard } from "@/lib/quote-wizard";

// GTM Tracking
import { usePageTracking } from "@/hooks/usePageTracking";

import analyticsApi, {
  ReviewAnalytics,
  TrafficSource,
  HistoricalData,
  CompanyAnalyticsSettings,
} from "@/lib/api-analytics";

import { cn } from "@/lib/utils";

// Components
import CompanyHero from "./components/CompanyHero";
import CompanySidebar from "./components/CompanySidebar";
import CompanyOverview from "./components/CompanyOverview";
import CompanyComparisonSection from "./components/CompanyComparisonSection";
import WinnerBadge from "@/components/company/WinnerBadge";
import Top1StickyCTA from "@/components/company/Top1StickyCTA";

// Dynamic Components for Performance
const CompanyProducts = dynamic(() => import("./components/CompanyProducts"), {
  loading: () => <div className="space-y-4"><Skeleton className="h-48 w-full" /><Skeleton className="h-48 w-full" /></div>
});
const CompanyReviews = dynamic(() => import("./components/CompanyReviews"), {
  loading: () => <div className="space-y-4"><Skeleton className="h-64 w-full" /></div>
});
const CompanyFinancing = dynamic(() => import("./components/CompanyFinancing"), {
  loading: () => <div className="space-y-4"><Skeleton className="h-48 w-full" /></div>
});
const MediaGallery = dynamic(() => import("@/app/dashboard/components/MediaGallery"), {
  loading: () => <div className="grid grid-cols-3 gap-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div>
});
const FaqSection = dynamic(() => import("./components/FaqSection"), {
  loading: () => <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
});
const SocialProof = dynamic(() => import("./components/SocialProof"), {
  loading: () => <Skeleton className="h-24 w-full" />
});
const StickyCTA = dynamic(() => import("./components/StickyCTA"), { ssr: false });

import { AppBreadcrumb, BreadcrumbItemData } from "@/components/AppBreadcrumb";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { track } from "@/lib/analytics/lazy";

interface CompanyDetailClientProps {
  company: Company;
  initialReviews?: Review[];
  initialReviewsLoaded?: boolean;
}

interface ExtendedCompany extends Company {
  cta_whatsapp_enabled?: boolean;
  whatsapp_enabled?: boolean;
  cta_whatsapp_url?: string;
  whatsapp_url?: string;
  active_admin?: boolean;
}

const toFiniteNumber = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toSafeRating = (value: unknown, fallback = 0): number => {
  const parsed = toFiniteNumber(value, fallback);
  return Math.min(5, Math.max(0, parsed));
};

const toSafeCount = (value: unknown, fallback = 0): number => {
  const parsed = toFiniteNumber(value, fallback);
  return parsed > 0 ? Math.floor(parsed) : 0;
};

export default function CompanyDetailClient({
  company,
  initialReviews = [],
  initialReviewsLoaded = false,
}: CompanyDetailClientProps): JSX.Element {
  const { user, isAuthenticated } = useAuth();
  const { isInComparison, addToComparison, removeFromComparison } = useComparison();
  
  // GTM Page Tracking
  usePageTracking({
    type: 'company',
    title: `${company.name} - Empresa de Energia Solar`,
    additionalData: {
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        category: company.category_name,
        city: company.city,
        state: company.state,
        rating: company.rating,
        verified: company.verified,
      },
    },
  });

  const [currentCompany] = useState<Company>(company);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [productsLoading, setProductsLoading] = useState<boolean>(true);
  const reviewsLoaded = initialReviewsLoaded || initialReviews.length > 0;
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(!reviewsLoaded);
  const [error, setError] = useState<string | null>(null);

  const [reviewAnalytics, setReviewAnalytics] = useState<ReviewAnalytics | null>(null);
  const [trafficSources, setTrafficSources] = useState<TrafficSource[] | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[] | null>(null);

  const [bannerError, setBannerError] = useState<boolean>(false);
  const [logoError, setLogoError] = useState<boolean>(false);
  const coverLogRef = useRef<string | null>(null);

  const [activeTab, setActiveTab] = useState<string>("overview");

  const breadcrumbItems: BreadcrumbItemData[] = useMemo(() => {
    const items: BreadcrumbItemData[] = [
      { label: 'Empresas', href: '/companies' }
    ];
    if (company.category_info) {
      items.push({ 
        label: company.category_info.name, 
        href: `/categories/${company.category_info.seo_url}` 
      });
    }
    items.push({ label: company.name, active: true });
    return items;
  }, [company]);

  const jsonLdItems = useMemo(() => {
    const items = [
      { name: 'Home', item: '/' },
      { name: 'Empresas', item: '/companies' }
    ];
    if (company.category_info) {
      items.push({ 
        name: company.category_info.name, 
        item: `/categories/${company.category_info.seo_url}` 
      });
    }
    items.push({ name: company.name, item: `/companies/${company.slug}` });
    return items;
  }, [company]);

  const timeRange = 30;
  const analyticsEnabled = Boolean(process.env.NEXT_PUBLIC_ENABLE_ANALYTICS);
  const companyId = Number(currentCompany?.id || company?.id);
  
  const isAdmin = user?.role === 'admin';
  const isReviewer = user?.role === 'review';

  const canEdit = useMemo(() => {
    return isAuthenticated && user?.role === "company" && user?.company_id === companyId;
  }, [isAuthenticated, user?.role, user?.company_id, companyId]);

  const canViewAnalytics = useMemo(() => {
    const companyIsActive = currentCompany?.status === 'active';
    if (isAdmin || isReviewer) return true;
    return isAuthenticated && user?.role === 'company' && user?.company_id === companyId && companyIsActive;
  }, [companyId, currentCompany?.status, isAdmin, isReviewer, isAuthenticated, user?.company_id, user?.role]);

  const canManageMedia = useMemo(() => {
    if (!isAuthenticated) return false;
    if (user?.role === 'admin') return true;
    return user?.role === 'company' && user?.company_id === companyId;
  }, [companyId, isAuthenticated, user?.company_id, user?.role]);

  const extendedCompany = currentCompany as ExtendedCompany;
  const canRequestQuote = extendedCompany.active_admin === true;
  const enabledRawInit = extendedCompany.cta_whatsapp_enabled ?? extendedCompany.whatsapp_enabled;

  const ctaEnabled = canRequestQuote
    ? (enabledRawInit === undefined || enabledRawInit === null ? true : Boolean(enabledRawInit))
    : false;

  const ctaUrl = canRequestQuote
    ? (extendedCompany.cta_whatsapp_url || extendedCompany.whatsapp_url || (currentCompany as any)?.whatsapp || null)
    : null;
  const wizardCategoryId = resolveWizardCategoryId(currentCompany);

  const tabs = useMemo(() => {
    const baseTabs = [
      { id: "overview", label: "Visão Geral", icon: LayoutDashboard },
      { id: "products", label: "Produtos", icon: Package },
      { id: "reviews", label: "Avaliações", icon: MessageCircle },
      { id: "financing", label: "Financiamento", icon: Banknote },
      { id: "gallery", label: "Galeria", icon: ImageIcon },
      { id: "faq", label: "FAQ", icon: HelpCircle },
      { id: "stats", label: "Estatísticas", icon: BarChart3 },
    ].filter(tab => {
      if (tab.id === "financing") return !!currentCompany?.financing_tab_visible;
      return true;
    });
    if (canEdit) baseTabs.push({ id: "edit", label: "Editar", icon: Edit });
    return baseTabs;
  }, [canEdit, currentCompany?.financing_tab_visible]);

  const companyStats = useMemo(() => {
    const normalizedRatings = reviews.map((rev) => toSafeRating((rev as any)?.rating, 0));
    const fallbackCompanyRating = toSafeRating((company as any).rating_avg || (company as any).rating, 0);
    const avgRating = normalizedRatings.length > 0
        ? normalizedRatings.reduce((acc, value) => acc + value, 0) / normalizedRatings.length
        : fallbackCompanyRating;
    const rating = reviewAnalytics?.average_rating != null ? toSafeRating(reviewAnalytics.average_rating, avgRating) : avgRating;
    const reviewCount = reviewAnalytics?.total_reviews != null ? toSafeCount(reviewAnalytics.total_reviews, 0) : toSafeCount(company.rating_count ?? reviews.length, reviews.length);
    const createdYear = company.created_at ? new Date(company.created_at).getFullYear() : new Date().getFullYear();
    return {
      rating: rating.toFixed(1),
      reviewCount,
      productCount: products.length,
      yearsInBusiness: Math.max(0, new Date().getFullYear() - createdYear),
    };
  }, [reviews, reviewAnalytics, products, company.created_at, company.rating_avg, company.rating, company.rating_count]);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      if (!companyId) return;
      try {
        const [pData, rData] = await Promise.all([
          productsApiSafe.getByCompany(companyId),
          !reviewsLoaded ? reviewsApiSafe.getAll({ company_id: companyId, limit: 6 }) : Promise.resolve(initialReviews),
        ]);
        setProducts(pData || []);
        if (!reviewsLoaded) setReviews(rData || []);
        if (analyticsEnabled && canViewAnalytics) {
          const routesAvailable = await analyticsApi.validateRoutes(companyId);
          if (routesAvailable) {
            const [rAnalytics, tSources, hData] = await Promise.all([
              analyticsApi.getReviewAnalytics(companyId),
              analyticsApi.getTrafficSources(companyId),
              analyticsApi.getHistoricalData(companyId, timeRange),
            ]);
            setReviewAnalytics(rAnalytics);
            setTrafficSources(tSources);
            setHistoricalData(hData);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setProductsLoading(false);
        setReviewsLoading(false);
      }
    };
    fetchData();
  }, [companyId, analyticsEnabled, canViewAnalytics, reviewsLoaded, initialReviews]);

  const bannerUrl = useMemo(() => {
    if (!currentCompany?.banner_url) return null;
    const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/api.*$/, "");
    return currentCompany.banner_url.startsWith("http") ? currentCompany.banner_url : `${base}${currentCompany.banner_url.startsWith("/") ? "" : "/"}${currentCompany.banner_url}`;
  }, [currentCompany?.banner_url]);

  const logoUrl = useMemo(() => {
    if (!currentCompany?.logo_url) return null;
    const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/api.*$/, "");
    return currentCompany.logo_url.startsWith("http") ? currentCompany.logo_url : `${base}${currentCompany.logo_url.startsWith("/") ? "" : "/"}${currentCompany.logo_url}`;
  }, [currentCompany?.logo_url]);

  const handleTabChange = (value: string) => {
    const tab = tabs.find(t => t.id === value);
    track('company_tab_change', { company_id: companyId, company_name: company.name, tab_id: value, tab_label: tab?.label || value });
    setActiveTab(value);
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <BreadcrumbJsonLd items={jsonLdItems} />
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <header className="border-b border-slate-200 bg-[#f3f4f6]">
          <div className="mx-auto max-w-[1280px] px-4 py-3 md:px-6 md:py-5">
            <AppBreadcrumb items={breadcrumbItems} compact className="mb-3" />

            <CompanyHero
              company={currentCompany}
              companyStats={companyStats as any}
              bannerUrl={bannerUrl}
              bannerError={bannerError}
              setBannerError={setBannerError}
              logoUrl={logoUrl}
              logoError={logoError}
              setLogoError={setLogoError}
              ctaEnabled={ctaEnabled}
              ctaUrl={ctaUrl}
            />

            <div className="mt-5 border-b border-slate-200">
              <ScrollArea className="w-full">
                <TabsList className="h-auto min-w-full justify-start gap-5 rounded-none bg-transparent p-0 text-slate-500">
                  {tabs.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={cn(
                        'h-auto rounded-none border-b-2 border-transparent px-0 pb-3 pt-1 text-sm font-medium shadow-none',
                        'text-slate-500 hover:bg-transparent hover:text-slate-900',
                        'data-[state=active]:border-blue-700 data-[state=active]:bg-transparent data-[state=active]:text-slate-950 data-[state=active]:shadow-none'
                      )}
                    >
                      <tab.icon className="mr-2 h-4 w-4" />
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1280px] px-4 py-8 md:px-6 md:py-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-10">
            <div className="space-y-6 lg:col-span-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <TabsContent value="overview" className="mt-0 space-y-6 focus-visible:outline-none">
                    {(currentCompany as any).priority_score >= 100 && (
                      <WinnerBadge
                        companyName={currentCompany.name}
                        rank={1}
                        city={currentCompany.city || 'Sua Região'}
                      />
                    )}
                    <CompanyOverview company={currentCompany} reviews={reviews} reviewsLoading={reviewsLoading} />
                    <SocialProof companyId={companyId} companyName={currentCompany.name} />
                  </TabsContent>

                  <TabsContent value="products" className="mt-0 focus-visible:outline-none">
                    <CompanyProducts products={products} loading={productsLoading} />
                  </TabsContent>

                  <TabsContent value="reviews" className="mt-0 space-y-6 focus-visible:outline-none">
                    <CompanyReviews
                      reviews={reviews}
                      loading={reviewsLoading}
                      companyId={companyId}
                      companySlug={currentCompany?.slug}
                      companyName={currentCompany?.name}
                      aggregates={currentCompany?.review_aggregates}
                    />
                  </TabsContent>

                  <TabsContent value="financing" className="mt-0 focus-visible:outline-none">
                    <CompanyFinancing company={currentCompany} companyId={companyId} />
                  </TabsContent>

                  <TabsContent value="gallery" className="mt-0 focus-visible:outline-none">
                    <MediaGallery
                      companyId={companyId.toString()}
                      showControls={canManageMedia}
                      planFeatures={(currentCompany as any)?.plan_features}
                    />
                  </TabsContent>

                  <TabsContent value="faq" className="mt-0 focus-visible:outline-none">
                    <FaqSection companyId={companyId} />
                  </TabsContent>

                  <TabsContent value="stats" className="mt-0 focus-visible:outline-none">
                    <Card className="rounded-2xl border-none bg-white shadow-sm">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl">Métricas de Desempenho</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                          {Object.entries(companyStats).map(([key, value]) => (
                            <div key={key} className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition-all hover:shadow-md">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {key.replace(/([A-Z])/g, ' $1')}
                              </p>
                              <p className="mt-1 text-2xl font-black text-slate-950">{String(value)}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </div>

            <aside className="space-y-6 lg:col-span-4">
              <CompanySidebar company={currentCompany} />

              {canRequestQuote && (
                <Card className="rounded-2xl border-2 border-dashed border-slate-200 bg-white shadow-sm">
                  <CardContent className="p-6 text-center">
                    <HelpCircle className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                    <h4 className="mb-1 font-bold text-slate-950">Precisa de ajuda?</h4>
                    <p className="mb-4 text-xs text-slate-500">
                      Fale com nossos especialistas para garantir a melhor escolha.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs font-bold"
                      onClick={() =>
                        openQuoteWizard({
                          source: 'company-sidebar-help',
                          preferredCompanyId: currentCompany.id,
                        })
                      }
                    >
                      Falar com especialista
                    </Button>
                  </CardContent>
                </Card>
              )}
            </aside>
          </div>

          <CompanyComparisonSection currentCompany={currentCompany} />
        </main>
      </Tabs>

      <Top1StickyCTA 
        company={currentCompany} 
        rank={(currentCompany as any).priority_score >= 100 ? 1 : 0} 
      />

      <StickyCTA 
        company={currentCompany} 
        ctaEnabled={ctaEnabled} 
        ctaUrl={ctaUrl} 
      />
    </div>
  );
}
