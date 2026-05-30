"use client";

import { Phone, Mail, Globe, MapPin, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Company } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { trackCTAClick } from "@/lib/analytics/track-cta";
import { useCopyIntent, useHoverIntent } from "@/lib/analytics/hooks/useIntentTracking";
import { openSignupGate } from "@/lib/signup-gate";

interface CompanyContactCardProps {
  company: Company;
}

export default function CompanyContactCard({ company }: CompanyContactCardProps) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const intentCompanyId = String(company.id);

  const currentReturnTo = typeof window !== "undefined"
    ? `${window.location.pathname}${window.location.search}`
    : `/companies/${company.slug || company.id}`;

  // Hooks de telemetria legados mantidos intactos
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

  return (
    <Card className="overflow-hidden border border-slate-100 bg-white p-5 shadow-sm rounded-2xl">
      <CardHeader className="p-0 border-b border-slate-100 pb-4 mb-4">
        <CardTitle className="text-sm font-black text-slate-950 uppercase tracking-wider flex items-center gap-2">
          Informações de Contato
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-4">
        
        {/* TELEFONE */}
        {company.phone && (
          <div className="flex items-start gap-3 group">
            <div className="bg-blue-50 p-2 rounded-xl text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <Phone className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Telefone Comercial</p>
              <a
                href={!isAuthenticated ? "#" : `tel:${company.phone.replace(/\D/g, "")}`}
                className="text-sm font-black text-slate-900 hover:text-blue-700 transition-colors inline-flex items-center gap-1.5 hover:underline decoration-blue-700/30 underline-offset-2 w-full truncate"
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
                    phoneNumber: company.phone,
                  });
                }}
              >
                {!isAuthenticated && !authLoading ? (
                  <>
                    <span className="opacity-75">{company.phone.substring(0, 6)}****</span>
                    <span className="text-[9px] bg-blue-100/80 text-blue-700 px-2 py-0.5 rounded-full font-black uppercase tracking-wider border border-blue-200 ml-2">
                      Ver
                    </span>
                  </>
                ) : (
                  company.phone
                )}
              </a>
            </div>
          </div>
        )}

        {/* E-MAIL */}
        {(company.email || company.email_public) && (
          <div className="flex items-start gap-3 group">
            <div className="bg-blue-50 p-2 rounded-xl text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <Mail className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">E-mail Corporativo</p>
              <a
                href={!isAuthenticated ? "#" : `mailto:${company.email || company.email_public}`}
                className="text-sm font-black text-slate-900 hover:text-blue-700 transition-colors inline-flex items-center gap-1.5 hover:underline decoration-blue-700/30 underline-offset-2 w-full truncate"
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
                    email: company.email || company.email_public,
                  });
                }}
              >
                {!isAuthenticated && !authLoading ? (
                  <>
                    <span className="opacity-75 truncate">
                      {(company.email || company.email_public || "").split("@")[0].substring(0, 3)}****@{(company.email || company.email_public || "").split("@")[1]}
                    </span>
                    <span className="text-[9px] bg-blue-100/80 text-blue-700 px-2 py-0.5 rounded-full font-black uppercase tracking-wider border border-blue-200 ml-2 shrink-0">
                      Ver
                    </span>
                  </>
                ) : (
                  company.email || company.email_public
                )}
              </a>
            </div>
          </div>
        )}

        {/* WEBSITE */}
        {company.website && (
          <div className="flex items-start gap-3 group">
            <div className="bg-blue-50 p-2 rounded-xl text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <Globe className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Website Oficial</p>
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-black text-blue-700 hover:text-blue-800 transition-colors flex items-center gap-1 hover:underline decoration-blue-700/30 truncate w-full"
                onClick={async () => {
                  await trackCTAClick({
                    ctaType: "website",
                    ctaLocation: "sidebar",
                    companyId: String(company.id),
                    companyName: company.name,
                    destinationUrl: company.website,
                  });
                }}
              >
                <span className="truncate">{formatUrl(company.website)}</span>
                <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-55" />
              </a>
            </div>
          </div>
        )}

        {/* LOCALIZAÇÃO */}
        {(company.address || company.city) && (
          <div className="flex items-start gap-3 group">
            <div className="bg-blue-50 p-2 rounded-xl text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Localização</p>
              <p className="text-sm font-semibold text-slate-800 leading-relaxed mt-0.5">
                {company.address && <span className="block">{company.address}</span>}
                {company.city && company.state && (
                  <span className="block text-slate-600 font-normal">
                    {company.city}, {company.state}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
