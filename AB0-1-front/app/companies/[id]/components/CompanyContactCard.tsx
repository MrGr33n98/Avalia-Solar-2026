"use client";

import { Phone, Mail, Globe, MapPin, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Company } from "@/lib/api";
import { trackCTAClick } from "@/lib/analytics/track-cta";
import { useHoverIntent } from "@/lib/analytics/hooks/useIntentTracking";
import { cn } from "@/lib/utils";
import { getCompanyWhatsAppHref } from "@/lib/whatsapp-contact";

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
  const whatsappHref = getCompanyWhatsAppHref(company);
  // Only publish the designated public address (never the private company email).
  const emailValue = company.email_public || "";
  const locationCityState = [company.city, company.state].filter(Boolean).join(", ");
  const locationValue = locationCityState || company.address || "";
  const locationTitle = company.address
    ? locationCityState
      ? `${company.address} - ${locationCityState}`
      : company.address
    : locationValue;

  const hasAnyContact = Boolean(whatsappHref || phoneValue || emailValue || company.website || locationValue);
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
          
          {/* Contato principal: WhatsApp direto, sem login. Nunca exponha número mascarado. */}
          {whatsappHref ? (
            <div className="min-w-0">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Falar com ${company.name} no WhatsApp`}
                className="inline-flex min-h-11 w-full min-w-0 items-center justify-center gap-1.5 rounded-[10px] bg-[#10B981] px-2.5 py-2.5 text-[12px] font-bold text-white shadow-sm transition-colors duration-150 hover:bg-[#047857] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 sm:text-[13px]"
                onClick={() => {
                  void trackCTAClick({
                    ctaType: "whatsapp",
                    ctaLocation: "sidebar",
                    companyId: String(company.id),
                    companyName: company.name,
                  });
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="shrink-0" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.868-2.03-.967-.273-.099-.472-.149-.671.15-.198.297-.769.967-.941 1.166-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.149-.173.198-.297.298-.496.099-.198.05-.372-.025-.521-.075-.149-.671-1.614-.919-2.213-.243-.583-.49-.503-.671-.512-.173-.009-.372-.009-.571-.009-.198 0-.521.074-.794.372-.273.297-1.04 1.017-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.1 3.202 5.077 4.487.709.306 1.262.489 1.693.625.712.226 1.36.194 1.872.118.571-.085 1.758-.718 2.006-1.413.248-.695.248-1.29.173-1.413-.074-.123-.272-.198-.57-.347z" />
                  <path d="M12.004 2C6.48 2 2 6.453 2 11.944c0 2.106.69 4.063 1.87 5.657L2 22l4.532-1.846c1.539.846 3.298 1.34 5.172 1.34 5.524 0 10.004-4.453 10.004-9.944C21.708 6.453 17.528 2 12.004 2zm0 17.708c-1.65 0-3.18-.446-4.47-1.223l-.32-.198-2.643 1.075.99-2.527-.22-.33c-1.04-1.513-1.585-3.28-1.585-5.061 0-5.087 4.198-9.225 9.29-9.225 5.083 0 9.281 4.138 9.281 9.225 0 5.087-4.198 9.264-9.333 9.264z" />
                </svg>
                <span className="whitespace-nowrap">Falar no WhatsApp</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden="true" />
              </a>
            </div>
          ) : phoneValue ? (
            <div className="flex min-w-0 items-start gap-2 sm:gap-2.5">
              <Phone className="mt-0.5 h-[18px] w-[18px] shrink-0 text-slate-800" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <a
                  href={"tel:" + phoneValue.replace(/\D/g, "")}
                  className="inline-flex min-h-9 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 sm:text-[13px]"
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
          ) : null}

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
