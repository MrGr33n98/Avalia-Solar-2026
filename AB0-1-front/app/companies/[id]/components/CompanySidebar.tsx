'use client';

import { useEffect, useState } from 'react';

import { Phone, Globe, MapPin, ExternalLink, Mail, Clock, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Company, fetchApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import SponsoredBanner from './SponsoredBanner';
import ClaimCompanyCard from './ClaimCompanyCard';
import CompanyAwardsCard from './CompanyAwardsCard';
import { trackFaqEngagement } from '@/lib/analytics/consolidated';
import { trackCTAClick } from '@/lib/analytics/track-cta';
import { useCopyIntent, useFaqExpand, useHoverIntent } from '@/lib/analytics/hooks/useIntentTracking';
import { openSignupGate } from '@/lib/signup-gate';
import MaterialLeadMagnetCard from './MaterialLeadMagnetCard';
import { DownloadGate, Material } from './MaterialsLibrary';


interface CompanySidebarProps {
  company: Company;
  showFaq?: boolean;
  showCompetitorBanners?: boolean;
}

export default function CompanySidebar({
  company,
  showFaq = true,
  showCompetitorBanners = true,
}: CompanySidebarProps) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchApi<{ materials: Material[] }>(`/companies/${company.id}/materials`, { signal: controller.signal })
      .then((response) => setMaterials(response.materials || []))
      .catch((error) => { if (error?.name !== 'AbortError') setMaterials([]); });
    return () => controller.abort();
  }, [company.id]);

  const featuredMaterial = materials[0];
  const requestDownload = async (material: Material, values: Record<string, string | Record<string, string>> = {}) => {
    const response = await fetchApi<{ download_id: string; authorization_token: string; delivery?: string }>('/material_downloads', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}` },
      body: JSON.stringify({ company_id: company.id, material_slug: material.slug, ...values }),
    });
    if (response.delivery !== 'email') { const fileResponse = await fetch(`/api/v1/material_downloads/${response.download_id}/file`, { headers: { 'X-Material-Download-Token': response.authorization_token } }); if (!fileResponse.ok) throw new Error(`HTTP ${fileResponse.status}`); const blob = await fileResponse.blob(); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = material.title; link.click(); URL.revokeObjectURL(url); }
    if (response.delivery !== 'email') setSelectedMaterial(null);
  };
  const intentCompanyId = String(company.id);
  const visibleFaqs = company.faqs?.slice(0, 5) ?? [];
  const currentReturnTo = typeof window !== 'undefined'
    ? `${window.location.pathname}${window.location.search}`
    : `/companies/${company.slug || company.id}`;
  const phoneHoverIntent = useHoverIntent(intentCompanyId, 'phone', 800, {
    signalCategory: 'contact_intent',
    elementSelector: 'company-sidebar-phone',
    metadata: {
      source: 'company_profile_sidebar',
    },
  });
  const phoneCopyIntent = useCopyIntent(intentCompanyId, 'phone', {
    signalCategory: 'contact_intent',
    elementSelector: 'company-sidebar-phone',
    metadata: {
      source: 'company_profile_sidebar',
    },
  });
  const emailHoverIntent = useHoverIntent(intentCompanyId, 'email', 800, {
    signalCategory: 'contact_intent',
    elementSelector: 'company-sidebar-email',
    metadata: {
      source: 'company_profile_sidebar',
    },
  });
  const emailCopyIntent = useCopyIntent(intentCompanyId, 'email', {
    signalCategory: 'contact_intent',
    elementSelector: 'company-sidebar-email',
    metadata: {
      source: 'company_profile_sidebar',
    },
  });
  const { trackQuestion } = useFaqExpand(intentCompanyId);

  const formatUrl = (url?: string) => {
    if (!url) return '';
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  };

  return (
    <div className="space-y-6 lg:sticky lg:top-24">
      {/* Claim Profile Card - Always visible */}
      <ClaimCompanyCard company={company} />

      {/* Awards Card - Visible when company has Avalia Solar awards */}
      <CompanyAwardsCard company={company} />

      {/* Sponsored Square Banner */}
      {showCompetitorBanners && (
        <SponsoredBanner
          slotKey="company_sidebar_square"
          companyId={company.id}
          variant="square"
        />
      )}

      {/* Contact Info Card */}
      <Card className="overflow-hidden border-none shadow-lg bg-card/80 backdrop-blur-sm">
        <CardHeader className="bg-muted/30 pb-4 border-b">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            Informações de Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          {company.phone && (
            <div className="flex items-start gap-4 group">
              <div className="bg-primary/10 p-2.5 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-0.5 uppercase tracking-wide">Telefone</p>
                <a 
                  href={!isAuthenticated ? "#" : `tel:${company.phone.replace(/\D/g, '')}`} 
                  className="text-base font-semibold hover:text-primary transition-colors hover:underline decoration-primary/30 underline-offset-4 group/item inline-flex items-center gap-2"
                  onMouseEnter={phoneHoverIntent.onMouseEnter}
                  onMouseLeave={phoneHoverIntent.onMouseLeave}
                  onCopy={phoneCopyIntent.onCopy}
                  onClick={async (e) => {
                    if (!authLoading && !isAuthenticated) {
                      e.preventDefault();
                      openSignupGate({
                        source: 'contact_reveal',
                        returnTo: currentReturnTo,
                        title: 'Crie sua conta para ver os contatos',
                        description: 'Libere telefone, e-mail e outros canais de contato desta empresa.',
                      });
                      return;
                    }

                    await trackCTAClick({
                      ctaType: 'phone',
                      ctaLocation: 'sidebar',
                      companyId: String(company.id),
                      companyName: company.name,
                      phoneNumber: company.phone,
                    });
                  }}
                >
                  {(!isAuthenticated && !authLoading) ? (
                    <>
                      <span className="opacity-70">{company.phone.substring(0, 6)}****</span>
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-tight group-hover/item:bg-primary group-hover/item:text-white transition-colors ml-2">
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

          {company.website && (
            <div className="flex items-start gap-4 group">
              <div className="bg-primary/10 p-2.5 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <Globe className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-600 mb-0.5 uppercase tracking-wide">Website</p>
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-semibold hover:text-primary transition-colors flex items-center gap-1.5 hover:underline decoration-primary/30 underline-offset-4 truncate w-full"
                  onClick={async (e) => {
                    await trackCTAClick({
                      ctaType: 'website',
                      ctaLocation: 'sidebar',
                      companyId: String(company.id),
                      companyName: company.name,
                      destinationUrl: company.website,
                    });
                  }}
                >
                  <span className="truncate">{formatUrl(company.website)}</span>
                  <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-50" />
                </a>
              </div>
            </div>
          )}

          {(company.address || (company.city && company.state)) && (
            <div className="flex items-start gap-4 group">
              <div className="bg-primary/10 p-2.5 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-0.5 uppercase tracking-wide">Localização</p>
                <p className="text-base font-semibold leading-relaxed">
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
          
          {(company.email || company.email_public) && (
             <div className="flex items-start gap-4 group">
              <div className="bg-primary/10 p-2.5 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <Mail className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-600 mb-0.5 uppercase tracking-wide">Email</p>
                <a 
                  href={!isAuthenticated ? "#" : `mailto:${company.email || company.email_public}`}
                  className="text-base font-semibold hover:text-primary transition-colors hover:underline decoration-primary/30 underline-offset-4 truncate group/item inline-flex items-center gap-2 max-w-full"
                  onMouseEnter={emailHoverIntent.onMouseEnter}
                  onMouseLeave={emailHoverIntent.onMouseLeave}
                  onCopy={emailCopyIntent.onCopy}
                  onClick={async (e) => {
                    if (!authLoading && !isAuthenticated) {
                      e.preventDefault();
                      openSignupGate({
                        source: 'contact_reveal',
                        returnTo: currentReturnTo,
                        title: 'Crie sua conta para ver os contatos',
                        description: 'Libere telefone, e-mail e outros canais de contato desta empresa.',
                      });
                      return;
                    }

                    await trackCTAClick({
                      ctaType: 'email',
                      ctaLocation: 'sidebar',
                      companyId: String(company.id),
                      companyName: company.name,
                      email: company.email || company.email_public,
                    });
                  }}
                >
                  {(!isAuthenticated && !authLoading) ? (
                    <>
                      <span className="opacity-70 truncate">
                        {(company.email || company.email_public || '').split('@')[0].substring(0, 3)}****@{(company.email || company.email_public || '').split('@')[1]}
                      </span>
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-tight group-hover/item:bg-primary group-hover/item:text-white transition-colors flex-shrink-0 ml-2">
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
        </CardContent>
      </Card>
      
      {featuredMaterial && (
        <>
          <MaterialLeadMagnetCard material={featuredMaterial} onDownload={() => featuredMaterial.gated ? setSelectedMaterial(featuredMaterial) : void requestDownload(featuredMaterial)} />
          <DownloadGate material={selectedMaterial} onClose={() => setSelectedMaterial(null)} onSubmit={requestDownload} onViewed={async () => undefined} />
        </>
      )}

      {/* Working Hours Card (Optional) */}
      {company.business_hours && (
        <Card className="overflow-hidden border-none shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader className="bg-muted/30 pb-4 border-b">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              Horário de Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-2.5 rounded-full text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <div className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
                {company.business_hours}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showFaq && visibleFaqs.length > 0 && (
        <Card className="overflow-hidden border-none shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader className="bg-muted/30 pb-4 border-b">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Dúvidas frequentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <Accordion
              type="single"
              collapsible
              className="w-full"
              onValueChange={(value) => {
                if (!value) return;
                const faq = visibleFaqs.find((item, index) => `faq-${item.id ?? index}` === value);
                if (faq) {
                  trackQuestion(faq.id ?? value);
                  trackFaqEngagement('expand', faq.question);
                }
              }}
            >
              {visibleFaqs.map((faq, index) => (
                <AccordionItem
                  key={faq.id || index}
                  value={`faq-${faq.id ?? index}`}
                >
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
      {/* Map Placeholder (Future Feature) */}
      {(company.latitude && company.longitude) && (
        <div className="rounded-xl overflow-hidden shadow-lg border h-48 bg-muted relative group cursor-pointer">
           <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
             <MapPin className="h-8 w-8 text-gray-400" />
           </div>
           {/* Here you would implement the actual map component */}
           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <span className="bg-white/90 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                Ver no mapa
              </span>
           </div>
        </div>
      )}
    </div>
  );
}
