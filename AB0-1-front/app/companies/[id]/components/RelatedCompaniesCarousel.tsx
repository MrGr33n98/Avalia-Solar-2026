"use client";

import { ShieldCheck, Lock, ChevronRight, ChevronLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Company } from "@/lib/api";
import Link from "next/link";
import React, { useEffect, useState, useRef } from "react";
import RelatedCompanyCard from "./RelatedCompanyCard";

interface RelatedCompaniesCarouselProps {
  company: Company;
  showAlternatives: boolean;
  relatedCompanies: Company[];
  loading: boolean;
}

export default function RelatedCompaniesCarousel({
  company: _company,
  showAlternatives,
  relatedCompanies,
  loading,
}: RelatedCompaniesCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Autoplay Effect
  useEffect(() => {
    if (loading || relatedCompanies.length <= 1 || isHovered) return;

    const intervalTime = 50; // ms
    const totalTime = 5000; // 5 segundos
    const increment = (intervalTime / totalTime) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          scroll('right', true);
          return 0;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [loading, relatedCompanies.length, isHovered]);

  const scroll = (direction: 'left' | 'right', isAutoplay = false) => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = 300; // Largura do card + gap
      
      if (direction === 'left') {
        current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        const isAtEnd = current.scrollLeft + current.clientWidth >= current.scrollWidth - 20;
        if (isAtEnd && isAutoplay) {
          current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      }

      if (!isAutoplay) {
        setProgress(0); // Reseta a barra ao clicar manualmente
      }
    }
  };

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
    <div 
      className="w-full flex flex-col gap-4 mt-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Cabeçalho do Carrossel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-1 gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Empresas Relacionadas</h3>
          <p className="text-sm text-slate-500 font-medium">Recomendadas para soluções similares</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Barra de progresso circular simulada nos botões ou linear embaixo */}
          <div className="hidden sm:flex items-center gap-1.5 relative">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200" onClick={() => scroll('left')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 relative overflow-hidden" onClick={() => scroll('right')}>
              <ChevronRight className="h-4 w-4 relative z-10" />
            </Button>
          </div>
          
          <Link href="/companies" className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1">
            Ver todas <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Barra de Progresso Linear */}
      {relatedCompanies.length > 1 && (
        <div className="w-full h-0.5 sm:h-1 bg-slate-100 rounded-full overflow-hidden mb-2 hidden sm:block">
          <div 
            className="h-full bg-blue-400 transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Carrossel Horizontal Customizado */}
      <div className="relative w-full pb-4">
        <div 
          ref={scrollContainerRef}
          className="flex gap-3 sm:gap-4 w-full overflow-x-auto snap-x snap-mandatory scroll-smooth px-1 pt-1 pb-2 scroll-pl-1 sm:scroll-pl-1 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {relatedCompanies.map((comp) => (
            <RelatedCompanyCard
              key={comp.id}
              company={comp}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
