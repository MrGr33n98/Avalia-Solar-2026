"use client";

import { Award, ArrowRight, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Company } from "@/lib/api";
import { BannerSlot } from "@/components/banners/BannerSlot";
import Link from "next/link";

interface PremiumSidebarAdSlotProps {
  company: Company;
  showCompetitorBanners: boolean;
}

export default function PremiumSidebarAdSlot({ company, showCompetitorBanners }: PremiumSidebarAdSlotProps) {
  const fallbackMockup = (
    <Card className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-5 text-center relative overflow-hidden">
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="p-2.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
          <Award className="h-5 w-5" />
        </div>
        <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">
          Anúncio Institucional Avalia Solar
        </h4>
        <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
          O seu perfil comercial é um espaço premium. Concorrentes diretos não podem veicular anúncios nesta página pública.
        </p>
        <Button asChild variant="outline" size="sm" className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-[10px] uppercase h-8 shadow-sm">
          <Link href="/advertise">
            Saiba Mais
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
          Parceiro Patrocinado
        </span>
      </div>
      <BannerSlot
        placement="company_profile_sidebar_sponsored"
        companyId={Number(company.id)}
        blockCompetitors={!showCompetitorBanners}
        fallback={fallbackMockup}
        className="w-full"
      />
    </div>
  );
}
