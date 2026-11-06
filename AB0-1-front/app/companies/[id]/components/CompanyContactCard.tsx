"use client";

import { Phone, Mail, Globe, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Company } from "@/lib/api";
import { trackCTAClick } from "@/lib/analytics/track-cta";
import { useHoverIntent } from "@/lib/analytics/hooks/useIntentTracking";
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
  const intentCompanyId = String(company.id);

  // Telemetria de intenção (hover e copy) mantida intacta
  const phoneHoverIntent = useHoverIntent(intentCompanyId, "phone", 800, {
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

  const formatUrl = (url?: string) => {
    if (!url) return "";
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  };

  const phoneValue = company.phone || "";
  // Only publish the designated public address (never the private company email).
  const emailValue = company.email_public || "";
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
    <Card data-testid="company-contact-card" className={cn("overflow-hidden border border-slate-100 bg-white p-5 shadow-sm rounded-2xl", className)}>
      {!hideHeader && (
        <CardHeader className="p-0 border-b border-slate-100 pb-3 mb-4">
          <CardTitle className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
            Informações de Contato
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2 sm:gap-x-5 min-w-0">
          
          {/* Contact information is informative only; the sole WhatsApp CTA is in the hero. */}
          {phoneValue && (
            <div className="flex min-w-0 items-start gap-2 sm:gap-2.5">
              <Phone className="mt-0.5 h-[18px] w-[18px] shrink-0 text-slate-800" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <a
                  href={"tel:" + phoneValue.replace(/\D/g, "")}
                  className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 sm:text-[13px]"
                  onMouseEnter={phoneHoverIntent.onMouseEnter}
                  onMouseLeave={phoneHoverIntent.onMouseLeave}
                  onClick={() => {
                    void trackCTAClick({
                      ctaType: "phone",
                      ctaLocation: "sidebar",
                      companyId: String(company.id),
                      companyName: company.name,
                    });
                  }}
                >
                  Ligar para empresa
                </a>
                <span className="mt-1 block text-[11px] text-slate-500">Telefone comercial</span>
              </div>
            </div>
          )}

          {/* E-mail público acessível sem criação de conta */}
          {emailValue && (
            <div className="flex min-w-0 items-start gap-2 sm:gap-2.5">
              <Mail className="mt-0.5 h-[18px] w-[18px] shrink-0 text-slate-800" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <a
                  href={"mailto:" + emailValue}
                  className="inline-flex max-w-full truncate text-xs font-bold text-slate-900 transition-colors hover:text-blue-700 sm:text-[13px]"
                  title={emailValue}
                  onMouseEnter={emailHoverIntent.onMouseEnter}
                  onMouseLeave={emailHoverIntent.onMouseLeave}
                  onClick={() => {
                    void trackCTAClick({
                      ctaType: "email",
                      ctaLocation: "sidebar",
                      companyId: String(company.id),
                      companyName: company.name,
                    });
                  }}
                >
                  <span className="truncate">{emailValue}</span>
                </a>
                <span className="mt-1 block text-[11px] text-slate-500">E-mail corporativo</span>
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
                  href={`/api/v1/outbound/redirect?company_id=${encodeURIComponent(String(company.id))}&source_context=profile`}
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
