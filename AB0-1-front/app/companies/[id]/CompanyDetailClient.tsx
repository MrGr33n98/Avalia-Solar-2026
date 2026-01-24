"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { Company, Product, Review } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { productsApiSafe, reviewsApiSafe } from "@/lib/api-client";

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
import CompanyProducts from "./components/CompanyProducts";
import CompanyReviews from "./components/CompanyReviews";
import CompanyFinancing from "./components/CompanyFinancing";
import MediaGallery from "@/app/dashboard/components/MediaGallery";
import FaqSection from "./components/FaqSection";

interface CompanyDetailClientProps {
  company: Company;
}

interface ExtendedCompany extends Company {
  cta_whatsapp_enabled?: boolean;
  whatsapp_enabled?: boolean;
  cta_whatsapp_url?: string;
  whatsapp_url?: string;
}

export default function CompanyDetailClient({ company }: CompanyDetailClientProps): JSX.Element {
  const { user, isAuthenticated } = useAuth();

  // Estados (mantidos)
  const [currentCompany, setCurrentCompany] = useState<Company>(company);

  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(true);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [reviewAnalytics, setReviewAnalytics] = useState<ReviewAnalytics | null>(null);
  const [trafficSources, setTrafficSources] = useState<TrafficSource[] | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[] | null>(null);
  // mantido para compatibilidade
  const [analyticsSettings, setAnalyticsSettings] = useState<CompanyAnalyticsSettings | null>(null);

  const [bannerError, setBannerError] = useState<boolean>(false);
  const [logoError, setLogoError] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<string>("overview");
  const [timeRange, setTimeRange] = useState<string>("30d");

  const analyticsEnabled = Boolean(process.env.NEXT_PUBLIC_ENABLE_ANALYTICS);

  const companyId = useMemo(() => {
    const id = currentCompany?.id || company?.id;
    return Number(id);
  }, [currentCompany?.id, company?.id]);

  const canEdit = useMemo(() => {
    return isAuthenticated && user?.role === "company" && user?.company_id === companyId;
  }, [isAuthenticated, user?.role, user?.company_id, companyId]);

  const extendedCompany = currentCompany as ExtendedCompany;
  const enabledRawInit = extendedCompany.cta_whatsapp_enabled ?? extendedCompany.whatsapp_enabled;

  const [ctaEnabled, setCtaEnabled] = useState<boolean>(() => {
    return enabledRawInit === undefined || enabledRawInit === null ? true : Boolean(enabledRawInit);
  });

  const [ctaUrl, setCtaUrl] = useState<string | null>(() => {
    return (
      extendedCompany.cta_whatsapp_url ||
      extendedCompany.whatsapp_url ||
      (currentCompany as any)?.whatsapp ||
      null
    );
  });

  const tabs = useMemo(() => {
    const baseTabs = [
      { id: "overview", label: "Visão Geral", icon: LayoutDashboard, iconColor: "text-slate-900" },
      { id: "products", label: "Produtos", icon: Package, iconColor: "text-slate-900" },
      { id: "reviews", label: "Avaliações", icon: MessageCircle, iconColor: "text-slate-900" },
      { id: "financing", label: "Financiamento", icon: Banknote, iconColor: "text-slate-900" },
      { id: "gallery", label: "Galeria", icon: ImageIcon, iconColor: "text-slate-900" },
      { id: "faq", label: "FAQ", icon: HelpCircle, iconColor: "text-slate-900" },
      { id: "stats", label: "Estatísticas", icon: BarChart3, iconColor: "text-slate-900" },
    ];
    if (canEdit) baseTabs.push({ id: "edit", label: "Editar", icon: Edit, iconColor: "text-slate-900" });
    return baseTabs;
  }, [canEdit]);

  const companyStats = useMemo(() => {
    const avgRating =
      reviews.length > 0 ? reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length : 0;

    const createdYear = company.created_at
      ? new Date(company.created_at).getFullYear()
      : new Date().getFullYear();

    const yearsInBusiness = Math.max(0, new Date().getFullYear() - createdYear);

    return {
      rating: reviewAnalytics?.average_rating ?? avgRating,
      reviewCount: reviewAnalytics?.total_reviews ?? reviews.length,
      productCount: products.length,
      completedProjects: products.length * 10,
      yearsInBusiness,
      responseRate: "92%",
      satisfaction: "95%",
    };
  }, [reviews, reviewAnalytics, products, company.created_at]);

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
          reviewsApiSafe.getByCompany(companyId),
        ]);

        setProducts(pData || []);
        setReviews(rData || []);

        if (analyticsEnabled) {
          try {
            const [rAnalytics, tSources, hData] = await Promise.all([
              analyticsApi.getReviewAnalytics(companyId),
              analyticsApi.getTrafficSources(companyId),
              analyticsApi.getHistoricalData(companyId, timeRange),
            ]);
            setReviewAnalytics(rAnalytics);
            setTrafficSources(tSources);
            setHistoricalData(hData);
          } catch (analyticsError) {
            console.error("Erro ao carregar analytics:", analyticsError);
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
  }, [companyId, analyticsEnabled, timeRange]);

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

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* HERO (ALINHADO COM AS ABAS) */}
      <div className="w-full bg-white border-b">
        <div className="container mx-auto px-4 py-2 md:py-4">
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                  <TabsContent value="overview" className="mt-0 focus-visible:outline-none">
                    <CompanyOverview company={currentCompany} />
                  </TabsContent>

                  <TabsContent value="products" className="mt-0 focus-visible:outline-none">
                    <CompanyProducts products={products} loading={productsLoading} />
                  </TabsContent>

                  <TabsContent value="reviews" className="mt-0 focus-visible:outline-none">
                    <CompanyReviews
                      reviews={reviews}
                      loading={reviewsLoading}
                      companyId={companyId}
                      companyName={currentCompany?.name}
                    />
                  </TabsContent>

                  <TabsContent value="financing" className="mt-0 focus-visible:outline-none">
                    <CompanyFinancing company={currentCompany} companyId={companyId} />
                  </TabsContent>

                  <TabsContent value="gallery" className="mt-0 focus-visible:outline-none">
                    <MediaGallery companyId={companyId.toString()} />
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

            <Card className="rounded-2xl shadow-sm border-none bg-blue-50/50">
              <CardHeader>
                <CardTitle className="text-md flex items-center gap-2 text-blue-800">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  Verificação AB0-1
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-700/80 leading-relaxed">
                Empresa auditada e certificada pela plataforma AB0-1 para serviços de energia solar.
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
