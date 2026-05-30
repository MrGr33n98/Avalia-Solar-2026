"use client";

import { Award } from "lucide-react";
import { Company } from "@/lib/api";
import { isFeatureEnabled } from "@/lib/feature-access";

interface PremiumHighlightBadgeProps {
  company: Company;
}

export default function PremiumHighlightBadge({ company }: PremiumHighlightBadgeProps) {
  const isHighlightEnabled = isFeatureEnabled(company.feature_access, "highlight_badges");
  const isProOrEnterprise = ["pro", "enterprise"].includes((company as any).plan_tier || "");

  if (!company.featured || (!isHighlightEnabled && !isProOrEnterprise)) {
    return null;
  }

  return (
    <span 
      id="premium-highlight-badge"
      className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-3.5 py-1 text-xs font-black text-white shadow-md animate-shimmer"
    >
      <Award className="h-3.5 w-3.5 text-white" />
      DESTAQUE PREMIUM
    </span>
  );
}
