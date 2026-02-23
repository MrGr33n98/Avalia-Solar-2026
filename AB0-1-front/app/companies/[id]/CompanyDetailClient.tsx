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
  ShieldCheck,
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
import { openLeadModal } from "@/lib/lead-engine";

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

// Dynamic Components for Performance (TBT Reduction)
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

export default function CompanyDetailClient({
  company,
  initialReviews = [],
  initialReviewsLoaded = false,
}: CompanyDetailClientProps): JSX.Element {
  const { user, isAuthenticated } = useAuth();
  const { isInComparison, addToComparison, removeFromComparison } = useComparison();
  const inComp = isInComparison(company.id);

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

  // Estados (mantidos)
  const [currentCompany, setCurrentCompany] = useState<Company>(company);

  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [productsLoading, setProductsLoading] = useState<boolean>(true);
  const reviewsLoaded = initialReviewsLoaded || initialReviews.length > 0;
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(!reviewsLoaded);
  const [error, setError] = useState<string | null>(null);

  const [reviewAnalytics, setReviewAnalytics] = useState<ReviewAnalytics | null>(null);
  const [trafficSources, setTrafficSources] = useState<TrafficSource[] | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[] | null>(null);
  // mantido para compatibilidade
  const [analyticsSettings, setAnalyticsSettings] = useState<CompanyAnalyticsSettings | null>(null);

  const [bannerError, setBannerError] = useState<boolean>(false);
  const [logoError, setLogoError] = useState<boolean>(false);
  const coverLogRef = useRef<string | null>(null);

  const [activeTab, setActiveTab] = useState<string>("overview");

  // Breadcrumb
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

  const [timeRange, setTimeRange] = useState<number>(30);

  const analyticsEnabled = Boolean(process.env.NEXT_PUBLIC_ENABLE_ANALYTICS);

  const companyId = useMemo(() => {
    const id = currentCompany?.id || company?.id;
    return Number(id);
  }, [currentCompany?.id, company?.id]);

  const isAdmin = user?.role === 'admin';
  const isReviewer = user?.role === 'review';

  const canEdit = useMemo(() => {
    return isAuthenticated && user?.role === "company" && user?.company_id === companyId;
  }, [isAuthenticated, user?.role, user?.company_id, companyId]);

  const mediaUploadAllowed = useMemo(() => {
    return Boolean(
      (currentCompany as any)?.media_upload_allowed ||
      currentCompany?.featured ||
      currentCompany?.verified
    );
  }, [currentCompany?.featured, currentCompany?.verified, currentCompany]);

  const canViewAnalytics = useMemo(() => {
    const companyIsActive = currentCompany?.status === 'active';
    if (isAdmin || isReviewer) return true;
    return isAuthenticated && user?.role === 'company' && user?.company_id === companyId && companyIsActive;
  }, [companyId, currentCompany?.status, isAdmin, isReviewer, isAuthenticated, user?.company_id, user?.role]);

  const canManageMedia = useMemo(() => {
    if (!isAuthenticated) return false;
    if (user?.role === 'admin') return true;
    return user?.role === 'company' && user?.company_id === companyId && mediaUploadAllowed;
  }, [companyId, isAuthenticated, mediaUploadAllowed, user?.company_id, user?.role]);

  const extendedCompany = currentCompany as ExtendedCompany;
  const canRequestQuote = extendedCompany.active_admin === true;
  const enabledRawInit = extendedCompany.cta_whatsapp_enabled ?? extendedCompany.whatsapp_enabled;

  const ctaEnabled = canRequestQuote
    ? (enabledRawInit === undefined || enabledRawInit === null ? true : Boolean(enabledRawInit))
    : false;

  const ctaUrl = canRequestQuote
    ? (
        extendedCompany.cta_whatsapp_url ||
        extendedCompany.whatsapp_url ||
        (currentCompany as any)?.whatsapp ||
        null
      )
    : null;

  const tabs = useMemo(() => {
    const baseTabs = [
      { id: "overview", label: "Visão Geral", icon: LayoutDashboard, iconColor: "text-slate-900" },
      { id: "products", label: "Produtos", icon: Package, iconColor: "text-slate-900" },
      { id: "reviews", label: "Avaliações", icon: MessageCircle, iconColor: "text-slate-900" },
      { id: "financing", label: "Financiamento", icon: Banknote, iconColor: "text-slate-900" },
      { id: "gallery", label: "Galeria", icon: ImageIcon, iconColor: "text-slate-900" },
      { id: "faq", label: "FAQ", icon: HelpCircle, iconColor: "text-slate-900" },
      { id: "stats", label: "Estatísticas", icon: BarChart3, iconColor: "text-slate-900" },
    ].filter(tab => {
      if (tab.id === "financing") return !!currentCompany?.financing_tab_visible;
      return true;
    });
    if (canEdit) baseTabs.push({ id: "edit", label: "Editar", icon: Edit, iconColor: "text-slate-900" });
    return baseTabs;
  }, [canEdit, currentCompany?.financing_tab_visible]);

  const companyStats = useMemo(() => {
    const avgRating =
      reviews.length > 0 ? reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length : (company.average_rating || 0);

    const createdYear = company.created_at
      ? new Date(company.created_at).getFullYear()
      : new Date().getFullYear();

    const yearsInBusiness = Math.max(0, new Date().getFullYear() - createdYear);

    return {
      rating: reviewAnalytics?.average_rating ?? avgRating,
      reviewCount: reviewAnalytics?.total_reviews ?? (company.rating_count || reviews.length),
      productCount: products.length,
      completedProjects: products.length * 10,
      yearsInBusiness,
      responseRate: "92%",
      satisfaction: "95%",
    };
  }, [reviews, reviewAnalytics, products, company.created_at, company.average_rating, company.rating_count]);

  const shouldFetchReviews = !reviewsLoaded;

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      if (!companyId) {
        setError("ID da empresa inválido");
        setProductsLoading(false);
        setReviewsLoading(false);
        return;
      }

      try {
        setError(null);

        const [pData, rData] = await Promise.all([
          productsApiSafe.getByCompany(companyId),
          shouldFetchReviews
            ? reviewsApiSafe.getAll({ company_id: companyId, limit: 6 })
            : Promise.resolve(initialReviews),
        ]);

        setProducts(pData || []);
        if (shouldFetchReviews) {
          setReviews(rData || []);
        }

        if (analyticsEnabled && canViewAnalytics) {
          try {
            const routesAvailable = await analyticsApi.validateRoutes(companyId);
            if (!routesAvailable) {
              console.warn('[CompanyDetail] Analytics routes unavailable, skipping analytics fetch', {
                company_id: companyId,
              });
              setReviewAnalytics({
                total_reviews: 0,
                average_rating: 0,
                rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
                recent_reviews: [],
              });
              setTrafficSources([]);
              setHistoricalData([]);
            } else {
              const [rAnalytics, tSources, hData] = await Promise.all([
                analyticsApi.getReviewAnalytics(companyId),
                analyticsApi.getTrafficSources(companyId),
                analyticsApi.getHistoricalData(companyId, timeRange),
              ]);
              setReviewAnalytics(rAnalytics);
              setTrafficSources(tSources);
              setHistoricalData(hData);
            }
          } catch (analyticsError) {
            console.error("Erro ao carregar analytics:", analyticsError);
            setReviewAnalytics(null);
            setTrafficSources(null);
            setHistoricalData(null);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setError("Erro ao carregar dados da empresa. Por favor, tente novamente.");
      } finally {
        setProductsLoading(false);
        setReviewsLoading(false);
      }
    };

    fetchData();
  }, [companyId, analyticsEnabled, canViewAnalytics, timeRange, shouldFetchReviews, initialReviews]);

  const bannerUrl = useMemo(() => {
    if (!currentCompany?.banner_url) return null;
    if (currentCompany.banner_url.startsWith("http")) return currentCompany.banner_url;

    const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/api.*$/, "");
    return `${base}${currentCompany.banner_url.startsWith("/") ? "" : "/"}${currentCompany.banner_url}`;
  }, [currentCompany?.banner_url]);

  const logoUrl = useMemo(() => {
    if (!currentCompany?.logo_url) return null;
    if (currentCompany.logo_url.startsWith("http")) return currentCompany.logo_url;

    const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/api.*$/, "");
    return `${base}${currentCompany.logo_url.startsWith("/") ? "" : "/"}${currentCompany.logo_url}`;
  }, [currentCompany?.logo_url]);

  useEffect(() => {
    const key = `${companyId}|${bannerUrl || 'no-banner'}|${logoUrl || 'no-logo'}`;
    if (coverLogRef.current === key) return;
    coverLogRef.current = key;
    console.info('[CompanyDetail] Cover assets resolved', {
      company_id: companyId,
      bannerUrl,
      logoUrl,
      bannerError,
      logoError,
    });
  }, [companyId, bannerUrl, logoUrl, bannerError, logoError]);

  if (error && !products.length && !reviews.length) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleTabChange = (value: string) => {
    const tab = tabs.find(t => t.id === value);
    track('company_tab_change', {
      company_id: companyId,
      company_name: company.name,
      tab_id: value,
      tab_label: tab?.label || value,
      element_type: 'tab',
      action_type: 'click'
    });
    setActiveTab(value);
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <BreadcrumbJsonLd items={jsonLdItems} />
      
      {/* HERO (ALINHADO COM AS ABAS) */}
      <div className="w-full bg-white border-b">
        <div className="container mx-auto px-4 py-2 md:py-4">
          {/* Breadcrumb Desktop */}
          <div className="hidden md:block mb-4">
            <AppBreadcrumb items={breadcrumbItems} />
          </div>

          {/* Breadcrumb Mobile */}
          <div className="md:hidden mb-2">
            <AppBreadcrumb items={breadcrumbItems} />
          </div>

          {/* Mantém dimensões do banner; o CompanyCard (logo+infos) foi reduzido no CompanyHero.tsx */}
          <div className="relative rounded-2xl overflow-visible">
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
          </div>
        </div>
      </div>

      {/* CONTEÚDO */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ESQUERDA */}
          <div className="lg:col-span-8 space-y-8">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              {/* Abas */}
              <div className="sticky top-4 z-30 mb-6">
                <ScrollArea className="w-full rounded-xl border bg-white/80 backdrop-blur-md shadow-sm p-1">
                  <TabsList className="inline-flex w-full items-center justify-start gap-1 bg-transparent border-none">
                    {tabs.map((tab) => (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className={cn(
                          "h-10 px-4 rounded-lg text-sm font-medium transition-all",
                          "text-slate-900 hover:bg-slate-100",
                          "data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md"
                        )}
                        aria-label={`Aba ${tab.label}`}
                      >
                        <tab.icon className={cn("mr-2 h-4 w-4", tab.iconColor)} aria-hidden="true" />
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>

              {/* Conteúdo */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <TabsContent value="overview" className="mt-0 focus-visible:outline-none space-y-8">
                    <CompanyOverview company={currentCompany} />
                    <SocialProof companyId={companyId} companyName={currentCompany.name} />
                  </TabsContent>

                  <TabsContent value="products" className="mt-0 focus-visible:outline-none">
                    <CompanyProducts products={products} loading={productsLoading} />
                  </TabsContent>

                  <TabsContent value="reviews" className="mt-0 focus-visible:outline-none">
                    <CompanyReviews
                      reviews={reviews}
                      loading={reviewsLoading}
                      companyId={companyId}
                      companySlug={currentCompany?.slug}
                      companyName={currentCompany?.name}
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
                    <Card className="rounded-2xl shadow-sm border-none bg-white">
                      <CardHeader>
                        <CardTitle>Métricas de Desempenho</CardTitle>
                        <CardDescription>Dados consolidados da empresa</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(companyStats).map(([key, value]) => (
                            <div key={key} className="rounded-xl border bg-slate-50 p-4">
                              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                {key}
                              </p>
                              <p className="mt-1 text-xl font-bold text-slate-900">{String(value)}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {canEdit && (
                    <TabsContent value="edit" className="mt-0 focus-visible:outline-none">
                      <Card className="rounded-2xl shadow-sm">
                        <CardHeader>
                          <CardTitle>Editar Empresa</CardTitle>
                          <CardDescription>Painel de configuração</CardDescription>
                        </CardHeader>
                      </Card>
                    </TabsContent>
                  )}
                </motion.div>
              </AnimatePresence>
            </Tabs>
          </div>

          {/* DIREITA */}
          <aside className="lg:col-span-4 space-y-6">
            <CompanySidebar company={currentCompany} />

            <Card className="rounded-2xl shadow-sm border-none bg-blue-50/50 overflow-hidden">
              <div className="bg-blue-600 h-1 w-full" />
              <CardHeader>
                <CardTitle className="text-md flex items-center gap-2 text-blue-800">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  Selo de Confiança AB0-1
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-blue-700/80 leading-relaxed">
                  Esta empresa passou pelo nosso rigoroso processo de curadoria técnica e documental.
                </p>
                
                <ul className="space-y-2">
                  {[
                    "Documentação em dia",
                    "Histórico de instalações",
                    "Qualidade técnica validada",
                    "Suporte pós-venda garantido"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-blue-800/70 font-medium">
                      <div className="h-1 w-1 rounded-full bg-blue-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {canRequestQuote && (
              <Card className="rounded-2xl shadow-sm border-dashed border-2 border-slate-200 bg-transparent">
                <CardContent className="p-6 text-center">
                  <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <h4 className="font-bold text-slate-900 mb-1">Precisa de ajuda?</h4>
                  <p className="text-xs text-slate-500 mb-4">Nossos especialistas podem te ajudar a escolher a melhor empresa.</p>
                  <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => openLeadModal({ source: 'company-sidebar-help', type: 'quick' })}>
                    Falar com especialista
                  </Button>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </main>

      <StickyCTA 
        company={currentCompany} 
        ctaEnabled={ctaEnabled} 
        ctaUrl={ctaUrl} 
      />
    </div>
  );
}
