"use client";

import { CheckCircle2 } from "lucide-react";
import { Company } from "@/lib/api";
import { isFeatureEnabled } from "@/lib/feature-access";

interface CompanyVerificationBadgeProps {
  company: Company;
}

export default function CompanyVerificationBadge({ company }: CompanyVerificationBadgeProps) {
  const isVerifiedEnabled = isFeatureEnabled(company.feature_access, "verified_product");
  
  if (!company.verified || !isVerifiedEnabled) {
    return null;
  }

  return (
    <span 
      id="company-verification-badge"
      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/10 shadow-sm"
    >
      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
      Empresa Verificada
    </span>
  );
}
