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
      title="Empresa Verificada"
      aria-label="Empresa Verificada"
      className="inline-flex items-center justify-center rounded-full bg-emerald-50 p-1 text-emerald-600 ring-1 ring-inset ring-emerald-600/20 shadow-xs"
    >
      <CheckCircle2 className="h-4 w-4 fill-emerald-100 text-emerald-600" />
    </span>
  );
}
