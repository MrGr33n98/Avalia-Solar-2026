'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Company } from '@/lib/api';

interface ClaimCompanyCardProps {
  company: Company;
}

export default function ClaimCompanyCard({ company }: ClaimCompanyCardProps) {
  if (company.claimed === true) return null;

  return (
    <div className="overflow-hidden bg-[#0B1528] text-white shadow-xl rounded-none p-6 border border-slate-800 space-y-5 font-sans">
      {/* Direct title alignment — no generic decorative icon or spacer. */}
      <h3 className="font-extrabold text-sm sm:text-base tracking-wide text-white uppercase leading-tight">
        TRABALHA NESTA EMPRESA?
      </h3>

      {/* Body Description */}
      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
        Solicite acesso para gerenciar este perfil. A equipe analisará o pedido antes de qualquer
        permissão ser concedida.
      </p>

      {/* Golden CTA Button */}
      <Button
        asChild
        className="w-full h-11 bg-[#F5B529] hover:bg-[#E5A71F] text-slate-950 font-black text-sm rounded-none shadow-md transition-all duration-200 group border-none"
      >
        <Link
          href={`/companies/${company.id}/claim`}
          className="flex items-center justify-center gap-2"
        >
          <span>Reivindicar Perfil Grátis</span>
          <ArrowRight className="h-4 w-4 stroke-[2.5] text-slate-950 group-hover:translate-x-1 transition-transform" />
        </Link>
      </Button>
    </div>
  );
}
