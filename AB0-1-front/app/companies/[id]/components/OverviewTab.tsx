"use client";

import { useState, useEffect } from "react";
import { MessageSquare, ShieldCheck, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Company, Review, Product } from "@/lib/api";
import { companiesApiSafe } from "@/lib/api-client";

import ReviewsPreview from "./ReviewsPreview";
import ProjectsPreview from "./ProjectsPreview";
import RelatedCompaniesCarousel from "./RelatedCompaniesCarousel";
import RelatedCompaniesTable from "./RelatedCompaniesTable";
import SocialProof from "./SocialProof";
import FeaturedProductsSection from "./FeaturedProductsSection";
import { BannerSlot } from "@/components/banners/BannerSlot";
import { hasPaidPlan, isFeatureEnabled, canShowCompanyProfileAds } from "@/lib/feature-access";

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
  companyStats,
  reviews,
  reviewsLoading,
  onTabChange,
}: OverviewTabProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [relatedCompanies, setRelatedCompanies] = useState<Company[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(true);

  const showSocialProof = isFeatureEnabled(company.feature_access, "social_proof");
  const showAlternatives = isFeatureEnabled(company.feature_access, "show_alternatives");
  const paidPlan = hasPaidPlan(company);
  const shouldShowAlternatives = showAlternatives && !paidPlan;

  useEffect(() => {
    if (!shouldShowAlternatives) {
      setRelatedLoading(false);
      return;
    }

    const fetchRelated = async () => {
      try {
        setRelatedLoading(true);
        const response = await companiesApiSafe.getAllPaginated({
          category_id: company.category_info?.id || company.category_id,
          per_page: 21,
          status: 'active'
        });
        
        let filtered = (response.data || []).filter(c => c.id !== company.id);
        setRelatedCompanies(filtered);
      } catch (error) {
        console.error("Erro ao buscar empresas relacionadas:", error);
      } finally {
        setRelatedLoading(false);
      }
    };

    fetchRelated();
  }, [company.id, company.category_id, company.category_info?.id, shouldShowAlternatives]);

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
          />
        ) : showAds ? (
          <BannerSlot 
            placement="company_profile_about_inline" 
            companyId={Number(company.id)}
            blockCompetitors={!showAlternatives}
          />
        ) : null}
      </div>

      {/* 3. Provas Sociais Coletivas */}
      {showSocialProof && (
        <SocialProof companyId={Number(company.id)} companyName={company.name} />
      )}

      {/* 4. Mural Compacto de Depoimentos (Reviews Preview) */}
      <ReviewsPreview
        company={company}
        reviews={reviews}
        reviewsLoading={reviewsLoading}
        onTabChange={onTabChange}
      />

      {/* 5. Vitrine de Especialidades (Projects Preview) */}
      <ProjectsPreview company={company} onTabChange={onTabChange} />

      {/* Banner de Carrossel antes de Empresas Relacionadas (apenas para empresas sem plano pago) */}
      {showAds && (
        <div className="mt-3 md:mt-6">
          <BannerSlot 
            placement="company_profile_related_carousel" 
            companyId={Number(company.id)}
            blockCompetitors={!showAlternatives}
          />
        </div>
      )}

      {/* 6. Empresas Similares / Proteção (Related Companies) */}
      <RelatedCompaniesCarousel
        company={company}
        showAlternatives={showAlternatives && !paidPlan}
        relatedCompanies={relatedCompanies.slice(0, 5)}
        loading={relatedLoading}
      />

      {showAlternatives && !paidPlan && !relatedLoading && relatedCompanies.length > 0 && (
        <RelatedCompaniesTable companies={relatedCompanies} />
      )}

    </div>
  );
}
