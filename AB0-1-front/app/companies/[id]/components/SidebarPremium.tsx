"use client";

import { HelpCircle, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Company } from "@/lib/api";
import { isFeatureEnabled } from "@/lib/feature-access";

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

      {/* 4. Slot Lateral de Anúncios Patrocinados */}
      <PremiumSidebarAdSlot company={company} showCompetitorBanners={showCompetitorBanners} />

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
