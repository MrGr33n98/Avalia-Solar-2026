"use client";

import { useState, useEffect } from "react";
import { HelpCircle, ShieldCheck, Award, FileText, Download, LockKeyhole } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Company, fetchApi } from "@/lib/api";
import { hasPaidPlan, isFeatureEnabled } from "@/lib/feature-access";
import { getFullImageUrl } from "@/utils/image";
import { toast } from "@/hooks/use-toast";

import { trackFaqEngagement } from "@/lib/analytics/consolidated";
import { useFaqExpand } from "@/lib/analytics/hooks/useIntentTracking";

import CompanyContactCard from "./CompanyContactCard";
import ClaimProfileCard from "./ClaimProfileCard";
import MaterialLeadMagnetCard from "./MaterialLeadMagnetCard";
import PremiumSidebarAdSlot from "./PremiumSidebarAdSlot";
import { DownloadGate, type Material } from "./MaterialsLibrary";

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
  const paidPlan = hasPaidPlan(company);

  // Hook legado de tracking de expansão de FAQ
  const { trackQuestion } = useFaqExpand(intentCompanyId);
  const visibleFaqs = company.faqs?.slice(0, 3) ?? [];

  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [materialsError, setMaterialsError] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  useEffect(() => {
    let active = true;
    setMaterialsLoading(true);
    setMaterialsError(false);
    fetchApi<{ materials: Material[] }>(`/companies/${company.id}/materials`, { cache: 'no-store' })
      .then((response) => {
        if (active) setMaterials(response.materials || []);
      })
      .catch((err) => {
        if (active) {
          console.error('[SidebarPremium] Erro ao carregar materiais:', err);
          setMaterialsError(true);
        }
      })
      .finally(() => {
        if (active) setMaterialsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [company.id]);

  const track = (eventType: string, material: Material) =>
    fetchApi('/events/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_id: company.id,
        event_type: eventType,
        metadata: { material_id: material.id, material_slug: material.slug },
      }),
    }).catch(() => undefined);

  const requestDownload = async (
    material: Material,
    values: Record<string, string | Record<string, string>> = {}
  ) => {
    await track('material_download_clicked', material);
    try {
      const campaign = new URLSearchParams(window.location.search);
      const response = await fetchApi<{ download_id: string; authorization_token: string }>(`/material_downloads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({
          company_id: company.id,
          material_slug: material.slug,
          utm_source: campaign.get('utm_source') || undefined,
          utm_medium: campaign.get('utm_medium') || undefined,
          utm_campaign: campaign.get('utm_campaign') || undefined,
          ...values,
        }),
      });
      const fileResponse = await fetch(`/api/v1/material_downloads/${response.download_id}/file`, { headers: { 'X-Material-Download-Token': response.authorization_token } }); if (!fileResponse.ok) throw new Error(`HTTP ${fileResponse.status}`); const blob = await fileResponse.blob(); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = material.title; link.click(); URL.revokeObjectURL(url);
      setSelectedMaterial(null);
    } catch {
      toast({
        title: 'Não foi possível preparar o download',
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    }
  };

  const featuredMaterial = materials.length > 0 ? materials[0] : null;

  return (
    <div className="space-y-6">
      {/* 1. Informações de Contato Protegidas */}
      <CompanyContactCard company={company} />

      {/* 2. Card "Trabalha nesta empresa?" (Claim Profile Card) ou Material Destacado */}
      {materialsLoading ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3 animate-pulse">
          <div className="h-4 bg-slate-100 rounded w-2/3" />
          <div className="h-10 bg-slate-100 rounded" />
          <div className="h-8 bg-slate-100 rounded w-1/2" />
        </div>
      ) : featuredMaterial ? (
        <MaterialLeadMagnetCard
          material={featuredMaterial}
          onDownload={() => {
            if (featuredMaterial.gated) {
              setSelectedMaterial(featuredMaterial);
            } else {
              requestDownload(featuredMaterial);
            }
          }}
        />
      ) : (
        <ClaimProfileCard company={company} />
      )}

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

      {/* Card de Materiais da Empresa */}
      {materials.length > 0 && (
        <Card className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-950 uppercase tracking-wider">
                  Materiais da Empresa
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Baixe catálogos, apresentações e outros conteúdos técnicos disponibilizados pela {company.name}.
                </p>
              </div>
            </div>
            
            <div className="pt-3 flex items-center justify-between border-t border-slate-100 mt-2">
              <span className="text-[10px] font-bold text-slate-500">
                {materials.length} {materials.length === 1 ? 'material disponível' : 'materiais disponíveis'}
              </span>
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 h-8"
                onClick={() => setOpenModal(true)}
              >
                Baixar materiais
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 4. Slot Lateral de Anúncios Patrocinados ou Galeria de Selos */}
      {paidPlan ? (
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

      {/* Modal de Lista de Materiais */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-950">
              Materiais da {company.name}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Selecione e baixe os materiais disponibilizados pela empresa.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 max-h-[400px] overflow-y-auto mt-4 pr-1">
            {materials.map((material) => (
              <article key={material.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                    <FileText className="h-5 w-5 text-blue-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-slate-900">{material.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {material.description || 'Material técnico disponível para download.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center shrink-0">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-slate-200 text-slate-700 hover:bg-white text-xs"
                    onClick={() => {
                      if (material.gated) {
                        setSelectedMaterial(material);
                      } else {
                        requestDownload(material);
                      }
                    }}
                  >
                    <Download className="mr-1 h-3 w-3" />
                    {material.gated ? (
                      <>
                        <LockKeyhole className="mr-1 h-3 w-3" />
                        Acessar
                      </>
                    ) : (
                      'Baixar'
                    )}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal DownloadGate para formulário de Lead */}
      <DownloadGate 
        material={selectedMaterial} 
        onClose={() => setSelectedMaterial(null)} 
        onSubmit={requestDownload} 
        onViewed={track} 
      />

    </div>
  );
}
