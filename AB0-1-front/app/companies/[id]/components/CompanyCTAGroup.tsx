"use client";

import { useState } from "react";
import { MessageCircle, Share2, Star } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ComparisonToggleButton from "@/components/ComparisonToggleButton";
import { Company } from "@/lib/api";
import { isFeatureEnabled } from "@/lib/feature-access";
import { openLeadModal, resolveWizardCategoryId } from "@/lib/lead-engine";
import { trackCTAClick } from "@/lib/analytics/track-cta";
import { track } from "@/lib/analytics/lazy";
import { buildCompanySubPath } from "@/lib/slug";

interface CompanyCTAGroupProps {
  company: Company;
  canRequestQuote: boolean;
  ctaEnabled: boolean;
  ctaUrl: string | null;
}

export default function CompanyCTAGroup({
  company,
  canRequestQuote,
  ctaEnabled,
  ctaUrl,
}: CompanyCTAGroupProps) {
  const [isSharing, setIsSharing] = useState(false);
  const wizardCategoryId = resolveWizardCategoryId(company);
  const reviewPath = buildCompanySubPath(company.slug, company.name, "review", company.id);

  // Entitlement Check for CTAs
  const isCustomCtasEnabled = isFeatureEnabled(company.feature_access, "custom_ctas");
  const isProOrEnterprise = ["pro", "enterprise"].includes((company as any).plan_tier || "");
  const canShowQuoteButton = canRequestQuote && (isCustomCtasEnabled || isProOrEnterprise || (company as any).active_admin === true);

  const handleShare = async () => {
    track("company_share_click", {
      company_id: company.id,
      company_name: company.name,
      element_type: "button",
      action_type: "click",
    });
    setIsSharing(true);
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: company.name,
          text: company.description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copiado para a área de transferência!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div id="company-cta-group" className="flex flex-col gap-3 w-full sm:flex-row sm:items-center sm:w-auto">
      {/* Compartilhar */}
      <Button
        variant="ghost"
        size="sm"
        disabled={isSharing}
        onClick={handleShare}
        className="h-10 rounded-xl hover:bg-slate-100 text-xs font-semibold text-slate-600 transition-all flex items-center justify-center gap-1.5"
      >
        <Share2 className="h-4 w-4" />
        Compartilhar
      </Button>

      {/* Comparar */}
      <ComparisonToggleButton 
        company={company}
        variant="default"
        size="default"
        animated={true}
        className="h-11 rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center shadow-none sm:min-w-[140px]"
      />

      {/* Solicitar Orçamento ou Avaliar */}
      {canShowQuoteButton ? (
        <Button
          size="default"
          onClick={async () => {
            await trackCTAClick({
              ctaType: "quote",
              ctaLocation: "hero",
              companyId: String(company.id),
              companyName: company.name,
            });
            openLeadModal({
              preferredCompanyId: company.id,
              categoryId: wizardCategoryId,
              source: "company-hero",
              type: "wizard",
            });
          }}
          className="h-11 rounded-xl bg-blue-700 font-bold text-white hover:bg-blue-800 transition-all flex items-center justify-center gap-2 shadow-[0_16px_32px_-16px_rgba(29,78,216,0.55)] hover:shadow-[0_16px_32px_-12px_rgba(29,78,216,0.65)] active:scale-[0.98] sm:min-w-[190px]"
        >
          <MessageCircle className="h-4 w-4" />
          Solicitar Orçamento
        </Button>
      ) : (
        <Button
          size="default"
          variant="outline"
          className="h-11 rounded-xl border-blue-200 bg-white font-bold text-blue-700 hover:bg-blue-50 shadow-none sm:min-w-[190px] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          asChild
        >
          <Link href={reviewPath}>
            <Star className="h-4 w-4 fill-blue-700 text-blue-700" strokeWidth={0} />
            Avaliar Empresa
          </Link>
        </Button>
      )}
    </div>
  );
}
