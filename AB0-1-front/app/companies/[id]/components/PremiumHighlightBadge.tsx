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

  // O selo só deve aparecer para perfis pagos/destacados
  if (!company.featured) {
    return null;
  }

  return (
    <span
      id="premium-highlight-badge"
      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-violet-50 px-3 text-xs font-bold uppercase tracking-wide text-violet-700"
      aria-label="Premium"
    >
      <Gem className="h-4 w-4 shrink-0" aria-hidden="true" />
      Premium
    </span>
  );
}
