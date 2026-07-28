"use client";

import { HelpCircle, ShieldCheck, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Image from "next/image";
import { Company } from "@/lib/api";
import { isFeatureEnabled } from "@/lib/feature-access";
import { getFullImageUrl } from "@/utils/image";

import { trackFaqEngagement } from "@/lib/analytics/consolidated";
import { useFaqExpand } from "@/lib/analytics/hooks/useIntentTracking";

import CompanyContactCard from "./CompanyContactCard";
import ClaimProfileCard from "./ClaimProfileCard";
import PremiumSidebarAdSlot from "./PremiumSidebarAdSlot";

interface SidebarPremiumProps {
  company: Company;
}

export default function SidebarPremium({
  company,
}: SidebarPremiumProps) {
  const intentCompanyId = String(company.id);

  // Entitlements
  const showFaq = isFeatureEnabled(company.feature_access, "faq_block");
  const showCompetitorBanners = isFeatureEnabled(company.feature_access, "show_competitor_banners");
  const hasPaidPlan = company.featured || company.plan_status === 'active' || company.has_paid_plan || ["pro", "enterprise"].includes((company as any).plan_tier || "");

  // Hook legado de tracking de expansão de FAQ
  const { trackQuestion } = useFaqExpand(intentCompanyId);
  const visibleFaqs = company.faqs?.slice(0, 3) ?? [];

  return (
    <div className="space-y-6">
      {/* 1. Informações de Contato Protegidas */}
      <CompanyContactCard company={company} />

      {/* 2. Card "Trabalha nesta empresa?" (Claim Profile Card) */}
      <ClaimProfileCard company={company} />

      {/* 3. Trust/Safety Card (Selo de Confiança) */}
      <Card className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black text-slate-950 uppercase tracking-wider">
              Garantia de Segurança
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              O portal **Avalia Solar** valida e modera ativamente todas as avaliações deste perfil. Nossos especialistas asseguram orçamentos protegidos de ponta a ponta.
            </p>
          </div>
        </div>
      </Card>

      {/* 4. Slot Lateral de Anúncios Patrocinados ou Galeria de Selos */}
      {hasPaidPlan ? (
        company.badges && company.badges.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Selos e Reconhecimentos
              </span>
            </div>
            <Card className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="grid grid-cols-3 gap-y-5 gap-x-3">
                {company.badges.map((badge, idx) => {
                  const imageUrl = badge.image_url ? getFullImageUrl(badge.image_url) : null;
                  return (
                    <div key={badge.id || idx} className="flex flex-col items-center text-center space-y-1.5 group">
                      <div className="relative w-14 h-14 transition-transform duration-300 group-hover:scale-105">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={badge.name || "Selo"}
                            fill
                            sizes="56px"
                            className="object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-50 border border-slate-100 rounded-lg text-slate-400">
                            <Award className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-0.5 leading-tight">
                        <p className="text-[9.5px] font-black text-slate-800 line-clamp-2">
                          {badge.name}
                        </p>
                        {badge.year && (
                          <p className="text-[8.5px] font-bold text-slate-600">
                            {badge.year}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )
      ) : (
        <PremiumSidebarAdSlot company={company} showCompetitorBanners={showCompetitorBanners} />
      )}

      {/* 5. FAQ Resumida da Sidebar */}
      {showFaq && visibleFaqs.length > 0 && (
        <Card className="overflow-hidden border border-slate-100 bg-white p-5 shadow-sm rounded-2xl">
          <CardHeader className="p-0 border-b border-slate-100 pb-3 mb-3">
            <CardTitle className="text-sm font-black text-slate-950 uppercase tracking-wider flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-blue-600 shrink-0" />
              Dúvidas Frequentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Accordion
              type="single"
              collapsible
              className="w-full border-none"
              onValueChange={(value) => {
                if (!value) return;
                const faq = visibleFaqs.find((item, index) => `faq-${item.id ?? index}` === value);
                if (faq) {
                  trackQuestion(faq.id ?? value);
                  trackFaqEngagement("expand", faq.question);
                }
              }}
            >
              {visibleFaqs.map((faq, index) => (
                <AccordionItem
                  key={faq.id || index}
                  value={`faq-${faq.id ?? index}`}
                  className="border-b border-slate-100 py-1 last:border-none"
                >
                  <AccordionTrigger className="text-left text-xs font-bold text-slate-800 hover:text-blue-700 py-2 hover:no-underline leading-normal">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-slate-500 leading-relaxed pt-1 pb-3">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
