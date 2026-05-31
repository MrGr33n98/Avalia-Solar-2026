"use client";

import { ShieldCheck, Lock, ChevronRight, Star, MapPin, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Company } from "@/lib/api";
import Link from "next/link";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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

  // Dados mockados baseados no design de referência
  const recommendedCompanies = [
    { name: "Volt Solar", rating: 4.8, reviews: 24, location: "Florianópolis, SC", category: "Carregadores", initial: "V" },
    { name: "ChargeUp", rating: 4.6, reviews: 15, location: "São Paulo, SP", category: "Infraestrutura", initial: "C" },
    { name: "EcoCharging", rating: 4.5, reviews: 18, location: "Curitiba, PR", category: "Mobilidade Elétrica", initial: "E" },
    { name: "PowerEV", rating: 4.7, reviews: 22, location: "Belo Horizonte, MG", category: "Soluções EV", initial: "P" },
    { name: "EV Solutions", rating: 4.6, reviews: 19, location: "Rio de Janeiro, RJ", category: "Carregadores", initial: "EV" },
  ];

  return (
    <div className="w-full flex flex-col gap-4 mt-8">
      {/* Cabeçalho do Carrossel */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Empresas Relacionadas</h3>
          <p className="text-sm text-slate-500 font-medium">Recomendadas para soluções similares</p>
        </div>
        <Link href="/companies" className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1">
          Ver todas <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Carrossel Horizontal usando ScrollArea */}
      <ScrollArea className="w-full pb-4">
        <div className="flex gap-4 w-max px-1 pt-1 pb-2">
          {recommendedCompanies.map((comp, idx) => (
            <Card key={idx} className="w-[280px] rounded-[20px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow shrink-0 bg-white">
              <CardContent className="p-5 flex flex-col gap-4 h-full">
                {/* Topo do Card: Logo + Infos */}
                <div className="flex gap-4">
                  {/* Logo Placeholder */}
                  <div className="h-[60px] w-[60px] rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-center shrink-0 text-slate-300 font-black text-xl shadow-inner">
                    {comp.initial}
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <h4 className="font-bold text-slate-900 text-base truncate">{comp.name}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-black text-slate-800">{comp.rating}</span>
                      <span className="text-xs font-medium text-slate-400">({comp.reviews})</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-slate-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-xs font-medium truncate">{comp.location}</span>
                    </div>
                  </div>
                </div>

                {/* Badge de Categoria centralizado */}
                <div className="flex justify-center mt-1">
                  <span className="bg-slate-100 text-slate-600 text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                    {comp.category}
                  </span>
                </div>

                {/* Botão de Ver Perfil no rodapé do card */}
                <div className="mt-auto pt-2">
                  <Button variant="outline" className="w-full rounded-xl border-blue-100 text-blue-700 hover:bg-blue-50 hover:border-blue-200 font-bold shadow-sm transition-all h-11">
                    Ver Perfil
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="hidden sm:flex" />
      </ScrollArea>
    </div>
  );
}
