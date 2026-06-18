'use client';

import { useMemo } from 'react';
import { Building2, MapPin, Phone, Mail, Globe, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';
import { Company, Product, Review } from '@/lib/api';
import { isFeatureEnabled } from '@/lib/feature-access';

import CompanyPremiumHero from './CompanyPremiumHero';
import CompanyIdentityCard from './CompanyIdentityCard';
import CompanyCTAGroup from './CompanyCTAGroup';
import CompanyProfileTabs from './CompanyProfileTabs';

// Novos componentes da Fase 3
import OverviewTab from './OverviewTab';
import SidebarPremium from './SidebarPremium';

// Importações dos subcomponentes legados de exibição para manter as abas funcionais
import CompanyProducts from './CompanyProducts';
import CompanyReviews from './CompanyReviews';
import FaqSection from './FaqSection';

interface CompanyProfileShellProps {
  company: Company;
  companyStats: {
    rating: string;
    reviewCount: number;
    productCount: number;
    yearsInBusiness: number;
  };
  products: Product[];
  reviews: Review[];
  productsLoading: boolean;
  reviewsLoading: boolean;
  bannerUrl: string | null;
  bannerError: boolean;
  setBannerError: (error: boolean) => void;
  logoUrl: string | null;
  logoError: boolean;
  setLogoError: (error: boolean) => void;
  canRequestQuote: boolean;
  ctaEnabled: boolean;
  ctaUrl: string | null;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function CompanyProfileShell({
  company,
  companyStats,
  products,
  reviews,
  productsLoading,
  reviewsLoading,
  bannerUrl,
  bannerError,
  setBannerError,
  logoUrl,
  logoError,
  setLogoError,
  canRequestQuote,
  ctaEnabled,
  ctaUrl,
  activeTab,
  onTabChange,
}: CompanyProfileShellProps) {
  const breadcrumbItems = useMemo(() => {
    const items: Array<{ label: string; href?: string; active?: boolean }> = [
      { label: 'Empresas', href: '/companies' },
    ];
    if (company.category_info) {
      items.push({
        label: company.category_info.name,
        href: `/categories/${company.category_info.seo_url}`,
      });
    }
    items.push({ label: company.name, active: true });
    return items;
  }, [company]);

  // Checagem de entitlements para abas e blocos
  const showFaq = isFeatureEnabled(company.feature_access, 'faq_block');

  return (
    <div id="company-profile-shell" className="min-h-screen bg-[#f8fafc] text-slate-900 pb-16">
      {/* Cabeçalho & Hero Premium */}
      <header className="bg-transparent border-none">
        <div className="mx-auto max-w-[1240px] px-4 pt-4 md:px-6">
          <AppBreadcrumb items={breadcrumbItems} compact className="mb-3" />

          <div className="flex flex-col gap-3">
            {/* Hero Banner */}
            <CompanyPremiumHero
              company={company}
              bannerUrl={bannerUrl}
              bannerError={bannerError}
              setBannerError={setBannerError}
            />

            {/* Identidade da Empresa e CTAs */}
            <div className="relative z-20 -mt-16 px-0 sm:-mt-20 md:-mt-24">
              <CompanyIdentityCard
                company={company}
                companyStats={companyStats}
                logoUrl={logoUrl}
                logoError={logoError}
                setLogoError={setLogoError}
              >
                <CompanyCTAGroup company={company} canRequestQuote={canRequestQuote} />
              </CompanyIdentityCard>
            </div>

            {/* Banners Estratégicos Placeholder */}
            <div className="h-px w-full bg-slate-200/50" />

            {/* Navegação por Abas Responsiva */}
            <CompanyProfileTabs
              activeTab={activeTab}
              onTabChange={onTabChange}
              showFinancing={false}
              showGallery={false}
              showFaq={showFaq}
            />
          </div>
        </div>
      </header>

      {/* Grid Principal responsivo de 12 colunas */}
      <main className="mx-auto max-w-[1240px] px-4 py-8 md:px-6">
        <Tabs value={activeTab} className="w-full">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Coluna da Esquerda (8 Colunas) — Aba Ativa */}
            <div className="lg:col-span-8 space-y-6">
              {/* ABA 1: VISÃO GERAL */}
              <TabsContent value="overview" className="mt-0 space-y-6 focus-visible:outline-none">
                <OverviewTab
                  company={company}
                  companyStats={companyStats}
                  reviews={reviews}
                  reviewsLoading={reviewsLoading}
                  onTabChange={onTabChange}
                />
              </TabsContent>

              {/* ABA 2: PRODUTOS E SERVIÇOS (Placeholder com visualização do legado) */}
              <TabsContent value="products" className="mt-0 focus-visible:outline-none">
                <CompanyProducts products={products} loading={productsLoading} />
              </TabsContent>

              {/* ABA 3: AVALIAÇÕES (Placeholder com mural de reviews legadas) */}
              <TabsContent value="reviews" className="mt-0 focus-visible:outline-none">
                <CompanyReviews
                  reviews={reviews}
                  loading={reviewsLoading}
                  companyId={Number(company.id)}
                  companySlug={company.slug}
                  companyName={company.name}
                  aggregates={company.review_aggregates}
                />
              </TabsContent>

              {/* ABA 4: PROJETOS (Placeholder elegante da Fase 2) */}
              <TabsContent value="projects" className="mt-0 focus-visible:outline-none">
                <Card className="rounded-2xl border-none bg-white p-6 shadow-sm">
                  <div className="text-center py-10 space-y-4">
                    <Building2 className="h-12 w-12 text-blue-500 mx-auto animate-bounce" />
                    <h3 className="text-lg font-bold text-slate-900">
                      Portfólio de Projetos Realizados
                    </h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto">
                      Estamos preparando a vitrine de obras e instalações desta empresa. Em breve
                      você verá fotos de cases e especificações técnicas reais.
                    </p>
                    <div className="flex justify-center gap-2 pt-2">
                      <Skeleton className="h-24 w-32 rounded-xl" />
                      <Skeleton className="h-24 w-32 rounded-xl" />
                      <Skeleton className="h-24 w-32 rounded-xl" />
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* ABA 6: CONTATO (Placeholder com detalhes de e-mail, telefone e FAQs expansíveis) */}
              <TabsContent value="contact" className="mt-0 space-y-6 focus-visible:outline-none">
                <Card className="rounded-2xl border-none bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-black tracking-tight text-slate-950 mb-4">
                    Informações de Contato
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {company.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-400">Telefone Comercial</p>
                            <p className="text-sm font-semibold text-slate-800">{company.phone}</p>
                          </div>
                        </div>
                      )}
                      {company.email_public && (
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-400">E-mail de Contato</p>
                            <p className="text-sm font-semibold text-slate-800">
                              {company.email_public}
                            </p>
                          </div>
                        </div>
                      )}
                      {company.website && (
                        <div className="flex items-center gap-3">
                          <Globe className="h-5 w-5 text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-400">Website Oficial</p>
                            <a
                              href={company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-semibold text-blue-700 hover:underline inline-flex items-center gap-1"
                            >
                              Visitar site
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Placeholder Mapa */}
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-center p-6 text-center text-xs text-slate-400 select-none">
                      <div>
                        <MapPin className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                        {company.address ? company.address : `${company.city}, ${company.state}`}
                      </div>
                    </div>
                  </div>
                </Card>

                {showFaq && <FaqSection companyId={Number(company.id)} />}
              </TabsContent>
            </div>

            {/* Coluna da Direita (4 Colunas) — Sidebar Premium */}
            <aside className="lg:col-span-4 space-y-6">
              <SidebarPremium
                company={company}
                canRequestQuote={canRequestQuote}
                ctaEnabled={ctaEnabled}
                ctaUrl={ctaUrl}
              />
            </aside>
          </div>
        </Tabs>
      </main>
    </div>
  );
}
