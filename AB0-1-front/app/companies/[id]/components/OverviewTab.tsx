"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Company, Review } from "@/lib/api";
import { publicCompaniesApi } from "@/lib/api-public";
import { companiesApiSafe } from "@/lib/api-client";
import { useLocation } from "@/contexts/LocationContext";

import ReviewsPreview from "./ReviewsPreview";
import ProjectsPreview from "./ProjectsPreview";
import RelatedCompaniesCarousel, { RelatedCompaniesDisplayMode } from "./RelatedCompaniesCarousel";
import RelatedCompaniesTable from "./RelatedCompaniesTable";
import SocialProof from "./SocialProof";
import FeaturedProductsSection from "./FeaturedProductsSection";
import { BannerSlot } from "@/components/banners/BannerSlot";
import {
  hasPaidPlan,
  isFeatureEnabled,
  canShowCompanyProfileAds,
  canShowMediaGallery,
} from "@/lib/feature-access";
import FinancingInlineCard from "./FinancingInlineCard";

interface OverviewTabProps {
  company: Company;
  companyStats: {
    rating: string;
    reviewCount: number;
    productCount: number;
    yearsInBusiness: number;
  };
  reviews: Review[];
  reviewsLoading: boolean;
  onTabChange: (value: string) => void;
}

export default function OverviewTab({
  company,
  companyStats: _companyStats,
  reviews,
  reviewsLoading,
  onTabChange,
}: OverviewTabProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [relatedCompanies, setRelatedCompanies] = useState<Company[]>([]);
  const userLocation = useLocation();

  const showSocialProof = isFeatureEnabled(company.feature_access, "social_proof");
  const paidPlan = hasPaidPlan(company);
  const showGallery = canShowMediaGallery(company);

  // Setup de financiamento da instituição / empresa (US-010 / PRD-FIN-001)
  const hasFinancingSetup = Boolean(
    company.financing_profile ||
    company.financing_enabled ||
    company.financing_tab_visible ||
    company.segment === 'finance' ||
    company.category_info?.seo_url?.includes('financ') ||
    company.categories?.some((c) => c.seo_url?.includes('financ'))
  );

  // Regra de Negócio:
  // - Empresas com plano PAGO comprovado: ativam o modo 'protected' (proteção comercial).
  // - Empresas no plano FREE ou sem configuração: DEVEM SEMPRE EXIBIR empresas similares/relacionadas!
  const [displayMode, setDisplayMode] = useState<RelatedCompaniesDisplayMode>(() => {
    if (paidPlan) return 'protected';
    return 'loading';
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const fetchRelated = useCallback(async () => {
    if (paidPlan) {
      setDisplayMode('protected');
      setRelatedCompanies([]);
      return;
    }

    // Cancelar requisição em voo se houver
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const currentRequestId = ++requestIdRef.current;

    setDisplayMode('loading');

    try {
      // Prioridade de localização geográfica:
      // 1. Contexto do comprador selecionado no LocationContext (selectedState / selectedCity)
      // 2. Local da empresa visitada como fallback territorial de comparação
      const buyerState = userLocation.selectedState;
      const buyerCity = userLocation.selectedCity;
      const targetState = buyerState || company.state || undefined;
      const targetCity = buyerState ? (buyerCity || undefined) : (buyerCity || company.city || undefined);
      const categoryId = company.category_info?.id || company.category_id || undefined;

      // UMA ÚNICA chamada à Engine de Recomendação (o backend orquestra contexto geográfico e expansão de categoria)
      const response = await publicCompaniesApi.getRecommendations(
        {
          context_company_id: company.id,
          exclude_company_id: company.id,
          category_id: categoryId ? Number(categoryId) : undefined,
          state: targetState,
          city: targetCity,
          limit: 6,
        },
        {
          signal: controller.signal,
          timeoutMs: 6000,
          silent: true,
        }
      );

      if (currentRequestId !== requestIdRef.current || controller.signal.aborted) {
        return;
      }

      const items = (response.data || []).filter((item) => item.id !== company.id);

      // Resiliência de emergência (apenas se a Engine retornar vazio por inexistência de concorrentes cadastrados)
      if (items.length === 0) {
        try {
          const catalogResponse = await companiesApiSafe.getAllPaginated({
            category_id: categoryId,
            per_page: 6,
            status: 'active',
          });
          const catalogItems = (catalogResponse.data || []).filter((c) => c.id !== company.id);
          if (catalogItems.length > 0) {
            setRelatedCompanies(catalogItems);
            setDisplayMode('results');
            return;
          }
        } catch {
          // Continua para o mapeamento
        }
      }

      if (currentRequestId !== requestIdRef.current || controller.signal.aborted) {
        return;
      }

      const mappedCompanies: Company[] = items.map((item) => {
        const ratingValue = item.rating?.average ?? item.rating_avg ?? 0;
        const reviewsCount = item.rating?.count ?? item.rating_count ?? 0;
        return {
          id: item.id,
          name: item.name,
          slug: item.slug || '',
          logo_url: item.logo_url || null,
          logo: item.logo_url || null,
          rating: Number(ratingValue),
          reviews_count: Number(reviewsCount),
          city: item.city || '',
          state: item.state || '',
          verified: Boolean(item.verified),
          featured: Boolean(item.featured),
          status: 'active',
          created_at: '',
          updated_at: '',
          category: item.segment || '',
          description: '',
          website: '',
          phone: '',
          address: '',
        } as unknown as Company;
      });

      setRelatedCompanies(mappedCompanies);
      if (mappedCompanies.length > 0) {
        setDisplayMode('results');
      } else {
        setDisplayMode('empty');
      }
    } catch (err: unknown) {
      if (controller.signal.aborted || currentRequestId !== requestIdRef.current) {
        return;
      }

      const isAbort =
        Boolean(controller.signal?.aborted) ||
        (err instanceof Error &&
          (err.name === 'AbortError' ||
            err.message.toLowerCase().includes('aborted') ||
            err.message.toLowerCase().includes('canceled')));

      if (isAbort) {
        return;
      }

      // Tentativa rápida de catálogo em caso de falha transitória da Engine
      try {
        const categoryId = company.category_info?.id || company.category_id || undefined;
        const catalogResponse = await companiesApiSafe.getAllPaginated({
          category_id: categoryId,
          per_page: 6,
          status: 'active',
        });
        const catalogItems = (catalogResponse.data || []).filter((c) => c.id !== company.id);
        if (catalogItems.length > 0) {
          setRelatedCompanies(catalogItems);
          setDisplayMode('results');
          return;
        }
      } catch {
        // Falha completa
      }

      setRelatedCompanies([]);
      setDisplayMode('error');
    }
  }, [
    paidPlan,
    company.id,
    company.state,
    company.city,
    company.category_info?.id,
    company.category_id,
    userLocation.selectedState,
    userLocation.selectedCity,
  ]);

  useEffect(() => {
    fetchRelated();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchRelated]);

  const handleRetryRelated = useCallback(() => {
    fetchRelated();
  }, [fetchRelated]);

  // Lógica para Featured Products e Ads
  const showAds = canShowCompanyProfileAds(company);
  const showFeaturedProducts = paidPlan && isFeatureEnabled(company.feature_access, "featured_products");

  const description = company.description || company.about || "";
  const isLongDescription = description.length > 300;
  const displayDescription = isLongDescription && !isExpanded
    ? `${description.substring(0, 300)}...`
    : description;

  return (
    <div className="space-y-6 focus-visible:outline-none">
      
      {/* 1. Diferenciais Rápidos (Highlights Grid) - Removido a pedido do usuário */}

      {/* 2. Sobre a Empresa */}
      <Card className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-950">Sobre a Empresa</h2>
            <p className="mt-1 text-[13px] text-slate-500">História, atuação e valores institucionais.</p>
          </div>

          <div className="max-w-none text-[15px] leading-7 text-slate-600 whitespace-pre-line">
            {description ? (
              <p>{displayDescription}</p>
            ) : (
              <p className="italic text-slate-400">Nenhuma descrição disponível para esta empresa.</p>
            )}
          </div>

          {isLongDescription && (
            <Button
              variant="link"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="self-start p-0 text-sm font-bold text-blue-700 hover:text-blue-800 h-auto"
            >
              {isExpanded ? "Ver menos" : "Ler mais"}
            </Button>
          )}
        </div>
      </Card>

      {/* Banner Inline ou Featured Products após Sobre a Empresa */}
      <div className="mb-3 mt-3 md:mb-6 md:mt-6">
        {showFeaturedProducts ? (
          <FeaturedProductsSection 
            company={company} 
            products={company.featured_products ?? []} 
            onTabChange={onTabChange}
          />
        ) : showAds ? (
          <BannerSlot 
            placement="company_profile_about_inline" 
            companyId={Number(company.id)}
            blockCompetitors={paidPlan}
          />
        ) : null}
      </div>

      {/* 3. Provas Sociais Coletivas */}
      {showSocialProof && (
        <SocialProof companyId={Number(company.id)} companyName={company.name} />
      )}

      {/* Bloco de Financiamento Solar na Visão Geral (US-010, US-011, US-012 / PRD-FIN-001) */}
      {hasFinancingSetup && (
        <div className="my-2">
          <FinancingInlineCard company={company} />
        </div>
      )}

      {/* 4. Mural Compacto de Depoimentos (Reviews Preview) */}
      <ReviewsPreview
        company={company}
        reviews={reviews}
        reviewsLoading={reviewsLoading}
        onTabChange={onTabChange}
      />

      {/* 5. Vitrine de Especialidades e Galeria de Mídia (apenas para planos com direito ao recurso) */}
      {showGallery && (
        <ProjectsPreview company={company} onTabChange={onTabChange} />
      )}

      {/* Banner de Carrossel antes de Empresas Relacionadas (apenas para empresas sem plano pago) */}
      {showAds && (
        <div className="mt-3 md:mt-6">
          <BannerSlot 
            placement="company_profile_related_carousel" 
            companyId={Number(company.id)}
            blockCompetitors={paidPlan}
          />
        </div>
      )}

      {/* 6. Empresas Similares / Proteção (Related Companies) */}
      <RelatedCompaniesCarousel
        company={company}
        mode={displayMode}
        relatedCompanies={relatedCompanies.slice(0, 5)}
        onRetry={handleRetryRelated}
      />

      {displayMode === 'results' && relatedCompanies.length > 0 && (
        <RelatedCompaniesTable companies={relatedCompanies} />
      )}

    </div>
  );
}
