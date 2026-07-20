'use client';

import React from 'react';
import Link from 'next/link';
import { Briefcase, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Company } from '@/lib/api';

interface ClaimCompanyCardProps {
  company: Company;
}

export default function ClaimCompanyCard({ company }: ClaimCompanyCardProps) {
  return (
    <div className="overflow-hidden bg-[#0B1528] text-white shadow-xl rounded-none p-6 border border-slate-800 space-y-5 font-sans">
      {/* Top Header with Golden Briefcase Icon Box & Title */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-none border border-amber-500/60 bg-amber-500/10 text-amber-400 shrink-0 shadow-inner">
          <Briefcase className="h-6 w-6 stroke-[2]" />
        </div>
        <h3 className="font-extrabold text-sm sm:text-base tracking-wide text-white uppercase leading-tight">
          TRABALHA NESTA EMPRESA?
        </h3>
      </div>

      {/* Body Description */}
      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
        Mostre que sua empresa é confiável. Você terá um perfil verificado especial na plataforma, com selo de empresa e destaque nas buscas e cotações.
      </p>

      {/* Golden CTA Button */}
      <Button
        asChild
        className="w-full h-11 bg-[#F5B529] hover:bg-[#E5A71F] text-slate-950 font-black text-sm rounded-none shadow-md transition-all duration-200 group border-none"
      >
        <Link href={`/companies/${company.id}/claim`} className="flex items-center justify-center gap-2">
          <span>Reivindicar Perfil Grátis</span>
          <ArrowRight className="h-4 w-4 stroke-[2.5] text-slate-950 group-hover:translate-x-1 transition-transform" />
        </Link>
      </Button>
    </div>
  );
}
