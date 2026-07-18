"use client";

import { Gem } from "lucide-react";
import { Company } from "@/lib/api";
import { isFeatureEnabled } from "@/lib/feature-access";

interface PremiumHighlightBadgeProps {
  company: Company;
}

export default function PremiumHighlightBadge({ company }: PremiumHighlightBadgeProps) {
  const isHighlightEnabled = isFeatureEnabled(company.feature_access, "highlight_badges");
  const planTier = (company as Company & { plan_tier?: string | null }).plan_tier || "";
  const isProOrEnterprise = ["pro", "enterprise"].includes(planTier);

  if (!company.featured || (!isHighlightEnabled && !isProOrEnterprise)) {
    return null;
  }

  return (
    <span 
      id="premium-highlight-badge"
      className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-black text-violet-700 shadow-sm"
    >
      <Gem className="h-3 w-3 fill-violet-600 text-violet-600" aria-hidden="true" />
      DESTAQUE PREMIUM
    </span>
  );
}
