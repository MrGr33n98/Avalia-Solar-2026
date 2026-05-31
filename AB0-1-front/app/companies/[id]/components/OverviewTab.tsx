"use client";

import { useState } from "react";
import { Info, MessageSquare, ShieldCheck, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Company, Review, Product } from "@/lib/api";
import { isFeatureEnabled } from "@/lib/feature-access";

import CompanyHighlightsGrid from "./CompanyHighlightsGrid";
import ReviewsPreview from "./ReviewsPreview";
import ProjectsPreview from "./ProjectsPreview";
import RelatedCompaniesCarousel from "./RelatedCompaniesCarousel";
import SocialProof from "./SocialProof";
import { BannerSlot } from "@/components/banners/BannerSlot";

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
  onTabChange: (tabId: string) => void;
}

export default function OverviewTab({
  company,
  companyStats,
  reviews,
  reviewsLoading,
  onTabChange,
}: OverviewTabProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const showSocialProof = isFeatureEnabled(company.feature_access, "social_proof");
  const showAlternatives = isFeatureEnabled(company.feature_access, "show_alternatives");

  const description = company.description || company.about || "";
  const isLongDescription = description.length > 300;
  const displayDescription = isLongDescription && !isExpanded
    ? `${description.substring(0, 300)}...`
    : description;

  return (
    <div className="space-y-6 focus-visible:outline-none">
      
      {/* 1. Diferenciais Rápidos (Highlights Grid) */}
      <CompanyHighlightsGrid company={company} companyStats={companyStats} />

      {/* 2. Sobre a Empresa */}
      <Card className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-950">Sobre a Empresa</h3>
              <p className="text-xs text-slate-500">História, atuação e valores institucionais.</p>
            </div>
          </div>
          
          <div className="prose prose-slate max-w-none text-slate-600 text-sm leading-relaxed whitespace-pre-line">
            {description ? (
              <p>{displayDescription}</p>
            ) : (
              <p className="italic text-slate-400">Nenhuma descrição disponível para esta empresa.</p>
            )}
          </div>

          {isLongDescription && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="self-start rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs shadow-sm h-8"
            >
              {isExpanded ? "Ver menos" : "Ver mais"}
            </Button>
          )}
        </div>
      </Card>

      {/* Banner Inline após Sobre a Empresa */}
      <div className="mt-6 mb-6">
        <BannerSlot 
          placement="company_profile_about_inline" 
          companyId={Number(company.id)}
          blockCompetitors={!showAlternatives}
        />
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

      {/* Banner de Carrossel antes de Empresas Relacionadas */}
      <div className="mt-6">
        <BannerSlot 
          placement="company_profile_related_carousel" 
          companyId={Number(company.id)}
          blockCompetitors={!showAlternatives}
        />
      </div>

      {/* 6. Empresas Similares / Proteção (Related Companies) */}
      <RelatedCompaniesCarousel company={company} showAlternatives={showAlternatives} />

    </div>
  );
}
