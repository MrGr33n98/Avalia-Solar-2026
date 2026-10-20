"use client";

import { Award, ArrowRight, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Company } from "@/lib/api";
import { hasPaidPlan } from "@/lib/feature-access";
import { BannerSlot } from "@/components/banners/BannerSlot";
import Link from "next/link";

interface PremiumSidebarAdSlotProps {
  company: Company;
  showCompetitorBanners: boolean;
}

export default function PremiumSidebarAdSlot({ company, showCompetitorBanners }: PremiumSidebarAdSlotProps) {
  // P0.5: Defesa em profundidade - nunca mostrar Ads para empresas com plano pago
  if (hasPaidPlan(company)) {
    return null;
  }

  return (
    <div className="space-y-2">
      <BannerSlot
        placement="company_profile_sidebar_sponsored"
        companyId={Number(company.id)}
        blockCompetitors={!showCompetitorBanners}
        className="w-full"
      />
    </div>
  );
}
