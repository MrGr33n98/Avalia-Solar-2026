'use client';

import React from 'react';
import Link from 'next/link';
import { Briefcase, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Company } from '@/lib/api';

interface ClaimProfileCardProps {
  company: Company;
}

export default function ClaimProfileCard({ company }: ClaimProfileCardProps) {
  const isClaimed =
    (company as any).claimed === true || company.verified === true || company.has_paid_plan === true;

  if (isClaimed) {
    return (
      <Card className="overflow-hidden border border-emerald-900/30 bg-[#0B1528] text-white shadow-lg rounded-2xl">
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm uppercase tracking-wider text-white">
                Perfil Verificado Oficial
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Empresa auditada e ativa</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed pt-1">
            As informações desta empresa foram autenticadas e são gerenciadas ativamente pelo representante legal sob auditoria do portal **Avalia Solar**.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-hidden bg-[#0B1528] text-white shadow-xl rounded-2xl p-6 border border-slate-800 space-y-5 font-sans">
      {/* Top Header with Golden Briefcase Icon Box & Title */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/60 bg-amber-500/10 text-amber-400 shrink-0 shadow-inner">
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
        className="w-full h-11 bg-[#F5B529] hover:bg-[#E5A71F] text-slate-950 font-black text-sm rounded-xl shadow-md transition-all duration-200 group border-none"
      >
        <Link href={`/companies/${company.id}/claim`} className="flex items-center justify-center gap-2">
          <span>Reivindicar Perfil Grátis</span>
          <ArrowRight className="h-4 w-4 stroke-[2.5] text-slate-950 group-hover:translate-x-1 transition-transform" />
        </Link>
      </Button>
    </div>
  );
}
