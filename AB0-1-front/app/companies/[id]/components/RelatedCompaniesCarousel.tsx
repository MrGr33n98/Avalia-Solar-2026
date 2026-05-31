"use client";

import { ShieldCheck, Lock, ChevronRight, Star, MapPin, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Company } from "@/lib/api";
import { companiesApiSafe } from "@/lib/api-client";
import Link from "next/link";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import React, { useEffect, useState } from "react";
import Image from "next/image";

interface RelatedCompaniesCarouselProps {
  company: Company;
  showAlternatives: boolean;
}

export default function RelatedCompaniesCarousel({ company, showAlternatives }: RelatedCompaniesCarouselProps) {
  const [relatedCompanies, setRelatedCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!showAlternatives) {
      setLoading(false);
      return;
    }

    const fetchRelated = async () => {
      try {
        const response = await companiesApiSafe.getAllPaginated({
          category_id: company.category_info?.id || company.category_id,
          per_page: 6,
          status: 'active'
        });
        
        // Remove a própria empresa da lista de relacionadas e limita a 5
        let filtered = (response.data || []).filter(c => c.id !== company.id).slice(0, 5);
        setRelatedCompanies(filtered);
      } catch (error) {
        console.error("Erro ao buscar empresas relacionadas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [company.id, company.category_id, company.category_info?.id, showAlternatives]);

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

  if (loading || relatedCompanies.length === 0) {
    return null;
  }

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
          {relatedCompanies.map((comp) => (
            <Card key={comp.id} className="w-[280px] rounded-[20px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow shrink-0 bg-white">
              <CardContent className="p-5 flex flex-col gap-4 h-full">
                {/* Topo do Card: Logo + Infos */}
                <div className="flex gap-4">
                  {/* Logo do Banco de Dados */}
                  <div className="h-[60px] w-[60px] rounded-2xl border border-slate-100 bg-white flex items-center justify-center shrink-0 shadow-sm overflow-hidden relative">
                    {comp.logo_url ? (
                      <Image 
                        src={comp.logo_url} 
                        alt={`Logo ${comp.name}`} 
                        fill 
                        className="object-contain p-1"
                        sizes="60px"
                      />
                    ) : (
                      <Building2 className="h-8 w-8 text-slate-300" />
                    )}
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <h4 className="font-bold text-slate-900 text-base truncate" title={comp.name}>{comp.name}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-black text-slate-800">{comp.rating_avg || comp.rating || "5.0"}</span>
                      <span className="text-xs font-medium text-slate-400">({comp.reviews_count || comp.total_reviews || 0})</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-slate-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-xs font-medium truncate">
                        {comp.city && comp.state ? `${comp.city}, ${comp.state}` : (comp.city || comp.state || "Brasil")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Badge de Categoria centralizado */}
                <div className="flex justify-center mt-1">
                  <span className="bg-slate-100 text-slate-600 text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider truncate max-w-full">
                    {comp.category_info?.name || comp.category_name || comp.category || "Energia Solar"}
                  </span>
                </div>

                {/* Botão de Ver Perfil no rodapé do card */}
                <div className="mt-auto pt-2">
                  <Button variant="outline" className="w-full rounded-xl border-blue-100 text-blue-700 hover:bg-blue-50 hover:border-blue-200 font-bold shadow-sm transition-all h-11" asChild>
                    <Link href={`/companies/${comp.slug}`}>
                      Ver Perfil
                    </Link>
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
