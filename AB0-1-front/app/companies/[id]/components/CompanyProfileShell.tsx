'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';
import { Company, Product, Review } from '@/lib/api';
import { buildCompanyPath } from '@/lib/slug';

import CompanyPremiumHero from './CompanyPremiumHero';
import CompanyIdentityCard from './CompanyIdentityCard';
import CompanyCTAGroup from './CompanyCTAGroup';
import CompanyProfileTabs from './CompanyProfileTabs';

// Novos componentes da Fase 3
import OverviewTab from './OverviewTab';
import SidebarPremium from './SidebarPremium';
import CompanyContactCard from './CompanyContactCard';

// Importações dos subcomponentes legados de exibição para manter as abas funcionais
import CompanyProducts from './CompanyProducts';
import CompanyReviews from './CompanyReviews';
import CompanyFinancing from './CompanyFinancing';
import FaqSection from './FaqSection';
import ProjectsGallery from './ProjectsGallery';
import MaterialsLibrary from './MaterialsLibrary';

const MapProvider = dynamic(() => import('@/components/search/MapProvider'), { ssr: false });

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
  activeTab: string;
  onTabChange: (tabId: string) => void;
  showFinancing: boolean;
  showGallery: boolean;
  showFaq: boolean;
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
  activeTab,
  onTabChange,
  showFinancing,
  showGallery,
  showFaq,
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

  // Checagem de entitlements para abas e blocos (showFaq is passed via props)

  return (
    <div id="company-profile-shell" data-company-layout="premium-shell" className="min-h-screen bg-[#f7f9fc] text-slate-900 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-16">
      {/* Cabeçalho & Hero Premium */}
      <header className="bg-transparent border-none">
        <div className="mx-auto w-full max-w-[480px] px-3.5 min-[412px]:px-4 pt-2 sm:px-4 sm:pt-4 md:max-w-[1240px] md:px-6">
          <AppBreadcrumb items={breadcrumbItems} compact className="mb-3" />

          {/* Compound Hero Container estilo WEG */}
          <div
            id="company-profile-compound-hero"
            className="relative w-full overflow-hidden rounded-2xl md:rounded-3xl border border-slate-200/90 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]"
          >
            {/* Hero Banner */}
            <CompanyPremiumHero
              company={company}
              bannerUrl={bannerUrl}
              bannerError={bannerError}
              setBannerError={setBannerError}
            />

            {/* Identidade da Empresa e CTAs */}
            <div className="relative z-20 mt-0 px-0 pt-0 bg-white">
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
          </div>

          {/* Navegação por Abas Responsiva */}
          <CompanyProfileTabs
            activeTab={activeTab}
            onTabChange={onTabChange}
            categories={
              company.categories?.length
                ? company.categories
                : company.category_info
                  ? [company.category_info]
                  : []
            }
            companyPath={buildCompanyPath(company.slug, company.name, company.id)}
            companyName={company.name}
            companyId={company.id}
            showFinancing={showFinancing}
            showGallery={showGallery}
            showFaq={showFaq}
          />
        </div>
      </header>

      {/* Grid Principal responsivo de 12 colunas */}
      <main className="mx-auto w-full max-w-[480px] px-3.5 min-[412px]:px-4 py-3 md:max-w-[1240px] md:px-6 md:py-8">
        <Tabs value={activeTab} className="w-full">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
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

              {/* ABA 4: FINANCIAMENTO */}
              {showFinancing && (
                <TabsContent value="financing" className="mt-0 focus-visible:outline-none">
                  <CompanyFinancing company={company} />
                </TabsContent>
              )}

              {/* ABA 5: PROJETOS (Apenas se a empresa tiver direito à galeria de mídia) */}
              {showGallery && (
                <TabsContent value="projects" className="mt-0 focus-visible:outline-none">
                  <ProjectsGallery companyId={company.id} companyName={company.name} />
                  <MaterialsLibrary companyId={company.id} />
                </TabsContent>
              )}

              {/* ABA 6: CONTATO */}
              <TabsContent value="contact" className="mt-0 space-y-6 focus-visible:outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <CompanyContactCard company={company} />
                  <ContactCoverageMap company={company} />
                </div>

                <FaqSection companyId={Number(company.id)} companyName={company.name} company={company} />
              </TabsContent>

              {/* ABA 7: PERGUNTAS FREQUENTES (FAQ) */}
              <TabsContent value="faq" className="mt-0 space-y-6 focus-visible:outline-none">
                <FaqSection companyId={Number(company.id)} companyName={company.name} company={company} />
              </TabsContent>
            </div>

            {/* Coluna da Direita (4 Colunas) — Sidebar Premium */}
            <aside className="lg:col-span-4 space-y-6">
              <SidebarPremium company={company} />
            </aside>
          </div>
        </Tabs>
      </main>
    </div>
  );
}

function ContactCoverageMap({ company }: { company: Company }) {
  const latitude = Number(company.latitude);
  const longitude = Number(company.longitude);
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
  const serviceAreas = company.service_areas || [];
  const radiusKm = serviceAreas.find((area) => area.coverage_type === 'radius')?.radius_km || undefined;
  const national = serviceAreas.some((area) => area.coverage_type === 'national');
  const states = serviceAreas.filter((area) => area.coverage_type === 'state').map((area) => area.state_code).filter(Boolean);
  const cities = serviceAreas.filter((area) => area.coverage_type === 'city').map((area) => area.city_name).filter(Boolean);
  const coverageLabel = national
    ? 'Atendimento em todo o Brasil'
    : radiusKm
      ? `Atende em até ${radiusKm} km da sede`
      : cities.length || states.length
        ? `Atende ${[...cities, ...states].join(', ')}`
        : 'Atendimento na localidade da empresa';

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
      {hasCoordinates ? (
        <MapProvider
          companies={[{ id: String(company.id), name: company.name, slug: company.slug, latitude, longitude, city: company.city, state: company.state, logo_url: company.logo_url || undefined }]}
          center={{ lat: latitude, lng: longitude }}
          zoom={radiusKm ? 11 : 13}
          radiusKm={radiusKm}
          className="h-52 w-full"
        />
      ) : (
        <div className="flex h-52 flex-col items-center justify-center p-6 text-center text-xs text-slate-400"><MapPin className="mb-2 h-6 w-6 text-slate-300" />Localização ainda não geocodificada</div>
      )}
      <div className="border-t border-slate-100 bg-white px-4 py-3 text-sm font-medium text-slate-700">{coverageLabel}</div>
    </div>
  );
}
