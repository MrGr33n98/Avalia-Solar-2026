"use client";

import { Phone, Mail, Globe, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Company } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { trackCTAClick } from "@/lib/analytics/track-cta";
import { useCopyIntent, useHoverIntent } from "@/lib/analytics/hooks/useIntentTracking";
import { openSignupGate } from "@/lib/signup-gate";
import { cn } from "@/lib/utils";

interface CompanyContactCardProps {
  company: Company;
  className?: string;
  hideHeader?: boolean;
}

export default function CompanyContactCard({
  company,
  className,
  hideHeader = false,
}: CompanyContactCardProps) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const intentCompanyId = String(company.id);

  const currentReturnTo = typeof window !== "undefined"
    ? `${window.location.pathname}${window.location.search}`
    : `/companies/${company.slug || company.id}`;

  // Telemetria de intenção (hover e copy) mantida intacta
  const phoneHoverIntent = useHoverIntent(intentCompanyId, "phone", 800, {
    signalCategory: "contact_intent",
    elementSelector: "company-sidebar-phone",
    metadata: {
      source: "company_profile_sidebar",
    },
  });

  const phoneCopyIntent = useCopyIntent(intentCompanyId, "phone", {
    signalCategory: "contact_intent",
    elementSelector: "company-sidebar-phone",
    metadata: {
      source: "company_profile_sidebar",
    },
  });

  const emailHoverIntent = useHoverIntent(intentCompanyId, "email", 800, {
    signalCategory: "contact_intent",
    elementSelector: "company-sidebar-email",
    metadata: {
      source: "company_profile_sidebar",
    },
  });

  const emailCopyIntent = useCopyIntent(intentCompanyId, "email", {
    signalCategory: "contact_intent",
    elementSelector: "company-sidebar-email",
    metadata: {
      source: "company_profile_sidebar",
    },
  });

  const formatUrl = (url?: string) => {
    if (!url) return "";
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  };

  const phoneValue = company.phone || company.whatsapp || "";
  const isWhatsappFallback = !company.phone && Boolean(company.whatsapp);
  const emailValue = company.email || company.email_public || "";
  const locationCityState = [company.city, company.state].filter(Boolean).join(", ");
  const locationValue = locationCityState || company.address || "";
  const locationTitle = company.address
    ? locationCityState
      ? `${company.address} - ${locationCityState}`
      : company.address
    : locationValue;

  const hasAnyContact = Boolean(phoneValue || emailValue || company.website || locationValue);
  if (!hasAnyContact) return null;

  return (
    <Card className={cn("overflow-hidden border border-slate-100 bg-white p-5 shadow-sm rounded-2xl", className)}>
      {!hideHeader && (
        <CardHeader className="p-0 border-b border-slate-100 pb-3 mb-4">
          <CardTitle className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
            Informações de Contato
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="grid grid-cols-2 gap-x-3 sm:gap-x-5 gap-y-4 min-w-0">
          
          {/* 1. TELEFONE COMERCIAL (Linha 1, Coluna 1) */}
          {phoneValue && (
            <div className="flex items-start gap-2 sm:gap-2.5 min-w-0">
              <div className="pt-0.5 text-slate-800 shrink-0" aria-hidden="true">
                <Phone className="h-[18px] w-[18px]" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <a
                  href={!isAuthenticated ? "#" : `tel:${phoneValue.replace(/\D/g, "")}`}
                  className="text-xs sm:text-[13px] font-bold text-slate-900 hover:text-blue-700 transition-colors inline-flex items-center truncate max-w-full"
                  title={isAuthenticated ? phoneValue : "Clique para ver o telefone completo"}
                  onMouseEnter={phoneHoverIntent.onMouseEnter}
                  onMouseLeave={phoneHoverIntent.onMouseLeave}
                  onCopy={phoneCopyIntent.onCopy}
                  onClick={async (e) => {
                    if (!authLoading && !isAuthenticated) {
                      e.preventDefault();
                      openSignupGate({
                        source: "contact_reveal",
                        returnTo: currentReturnTo,
                        title: "Crie sua conta para ver os contatos",
                        description: "Libere telefone, e-mail e outros canais de contato desta empresa.",
                      });
                      return;
                    }

                    await trackCTAClick({
                      ctaType: "phone",
                      ctaLocation: "sidebar",
                      companyId: String(company.id),
                      companyName: company.name,
                    });
                  }}
                >
                  {!isAuthenticated && !authLoading ? (
                    <>
                      <span className="opacity-80 truncate">
                        {phoneValue.length > 6 ? `${phoneValue.substring(0, 6)}****` : phoneValue}
                      </span>
                      <span className="text-[8.5px] bg-blue-100/80 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-blue-200 ml-1.5 shrink-0 inline-flex items-center">
                        Ver
                      </span>
                    </>
                  ) : (
                    <span className="truncate">{phoneValue}</span>
                  )}
                </a>
                <span className="text-[11px] text-slate-500 font-normal leading-tight mt-0.5 truncate">
                  {isWhatsappFallback ? "WhatsApp comercial" : "Telefone comercial"}
                </span>
              </div>
            </div>
          )}

          {/* 2. E-MAIL CORPORATIVO (Linha 1, Coluna 2) */}
          {emailValue && (
            <div className="flex items-start gap-2 sm:gap-2.5 min-w-0">
              <div className="pt-0.5 text-slate-800 shrink-0" aria-hidden="true">
                <Mail className="h-[18px] w-[18px]" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <a
                  href={!isAuthenticated ? "#" : `mailto:${emailValue}`}
                  className="text-xs sm:text-[13px] font-bold text-slate-900 hover:text-blue-700 transition-colors inline-flex items-center truncate max-w-full"
                  title={isAuthenticated ? emailValue : "Clique para ver o e-mail completo"}
                  onMouseEnter={emailHoverIntent.onMouseEnter}
                  onMouseLeave={emailHoverIntent.onMouseLeave}
                  onCopy={emailCopyIntent.onCopy}
                  onClick={async (e) => {
                    if (!authLoading && !isAuthenticated) {
                      e.preventDefault();
                      openSignupGate({
                        source: "contact_reveal",
                        returnTo: currentReturnTo,
                        title: "Crie sua conta para ver os contatos",
                        description: "Libere telefone, e-mail e outros canais de contato desta empresa.",
                      });
                      return;
                    }

                    await trackCTAClick({
                      ctaType: "email",
                      ctaLocation: "sidebar",
                      companyId: String(company.id),
                      companyName: company.name,
                    });
                  }}
                >
                  {!isAuthenticated && !authLoading ? (
                    <>
                      <span className="opacity-80 truncate">
                        {emailValue.includes("@")
                          ? `${emailValue.split("@")[0].substring(0, 3)}****@${emailValue.split("@")[1]}`
                          : `${emailValue.substring(0, 3)}****`}
                      </span>
                      <span className="text-[8.5px] bg-blue-100/80 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-blue-200 ml-1.5 shrink-0 inline-flex items-center">
                        Ver
                      </span>
                    </>
                  ) : (
                    <span className="truncate">{emailValue}</span>
                  )}
                </a>
                <span className="text-[11px] text-slate-500 font-normal leading-tight mt-0.5 truncate">
                  E-mail corporativo
                </span>
              </div>
            </div>
          )}

          {/* 3. WEBSITE (Linha 2, Coluna 1) */}
          {company.website && (
            <div className="flex items-start gap-2 sm:gap-2.5 min-w-0">
              <div className="pt-0.5 text-slate-800 shrink-0" aria-hidden="true">
                <Globe className="h-[18px] w-[18px]" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <a
                  href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-[13px] font-bold text-slate-900 hover:text-blue-700 transition-colors inline-flex items-center truncate max-w-full"
                  title={company.website}
                  onClick={async () => {
                    await trackCTAClick({
                      ctaType: "website",
                      ctaLocation: "sidebar",
                      companyId: String(company.id),
                      companyName: company.name,
                    });
                  }}
                >
                  <span className="truncate">{formatUrl(company.website)}</span>
                </a>
                <span className="text-[11px] text-slate-500 font-normal leading-tight mt-0.5 truncate">
                  Website
                </span>
              </div>
            </div>
          )}

          {/* 4. LOCALIZAÇÃO (Linha 2, Coluna 2) */}
          {locationValue && (
            <div className="flex items-start gap-2 sm:gap-2.5 min-w-0">
              <div className="pt-0.5 text-slate-800 shrink-0" aria-hidden="true">
                <MapPin className="h-[18px] w-[18px]" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span
                  className="text-xs sm:text-[13px] font-bold text-slate-900 leading-tight truncate max-w-full cursor-default"
                  title={locationTitle}
                >
                  {locationValue}
                </span>
                <span className="text-[11px] text-slate-500 font-normal leading-tight mt-0.5 truncate">
                  Localização
                </span>
              </div>
            </div>
          )}

        </div>
      </CardContent>
    </Card>
  );
}
