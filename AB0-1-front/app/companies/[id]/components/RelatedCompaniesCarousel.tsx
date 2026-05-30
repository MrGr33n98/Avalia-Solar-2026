"use client";

import { ShieldCheck, Lock, ExternalLink, HelpCircle, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Company } from "@/lib/api";
import Link from "next/link";

interface RelatedCompaniesCarouselProps {
  company: Company;
  showAlternatives: boolean;
}

export default function RelatedCompaniesCarousel({ company, showAlternatives }: RelatedCompaniesCarouselProps) {
  // Se o entitlement de empresas alternativas for desabilitado (Plano Pro/Enterprise que bloqueia concorrentes)
  if (!showAlternatives) {
    return (
      <Card className="rounded-2xl border border-blue-100 bg-blue-50/20 p-6 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none select-none">
          <ShieldCheck className="h-24 w-24 text-blue-600" />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5 uppercase">
                Perfil Protegido Exclusivo
              </h4>
              <p className="text-xs text-slate-500 max-w-xl mt-1 leading-relaxed">
                Esta empresa protege seu perfil comercial no portal **Avalia Solar**. Banners e anúncios de concorrentes são desativados para garantir uma navegação focada e transparente sobre a sua marca.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-blue-100/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-blue-700 border border-blue-200 shrink-0 self-start sm:self-center">
            Membro Premium
          </span>
        </div>
      </Card>
    );
  }

  // Fallback institucional de empresas similares para planos Free/Essential (simulação dinâmica estática e elegante)
  return (
    <Card className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm overflow-hidden">
      <div className="flex flex-col gap-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-slate-50 text-slate-600 border border-slate-100 flex items-center justify-center">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-950">Empresas Recomendadas</h3>
              <p className="text-xs text-slate-500">Outras opções qualificadas na sua região.</p>
            </div>
          </div>
        </div>

        {/* Empresas Similares - Exibição elegante baseada na vertical e localização da empresa ativa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-4 hover:shadow-md hover:border-slate-200 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-tight">
                  {company.category_info?.name || "Energia Solar"}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {company.city}, {company.state}
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-800 tracking-tight group-hover:text-blue-700 transition-colors uppercase">
                EcoVolt Soluções Solares
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                Referência em homologação rápida e pós-venda premiado na região.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                4.8 ★ (24 reviews)
              </span>
              <span className="text-[10px] font-black text-blue-700 group-hover:underline inline-flex items-center gap-0.5">
                Ver perfil
                <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-4 hover:shadow-md hover:border-slate-200 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-tight">
                  {company.category_info?.name || "Energia Solar"}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {company.city}, {company.state}
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-800 tracking-tight group-hover:text-blue-700 transition-colors uppercase">
                Helios Solar Brasil
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                Projetos industriais de grande porte com financiamento facilitado.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                4.6 ★ (18 reviews)
              </span>
              <span className="text-[10px] font-black text-blue-700 group-hover:underline inline-flex items-center gap-0.5">
                Ver perfil
                <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
