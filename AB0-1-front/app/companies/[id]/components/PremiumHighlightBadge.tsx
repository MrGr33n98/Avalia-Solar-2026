'use client';

import { Company } from '@/lib/api';
import CommercialPlanBadge from '@/components/company/CommercialPlanBadge';

interface PremiumHighlightBadgeProps {
  company: Company;
  className?: string;
}

export default function PremiumHighlightBadge({ company, className }: PremiumHighlightBadgeProps) {
  // Separação estrita: plan badge depende unicamente de commercial_status ou has_paid_plan, NUNCA de company.featured
  const commercialStatus = company.commercial_status || {
    tier: (company as Company & { plan_tier?: string | null }).plan_tier || 'free',
    status: company.status || 'active',
    paid: company.has_paid_plan === true,
  };

  return (
    <CommercialPlanBadge
      commercialStatus={commercialStatus}
      hasPaidPlan={company.has_paid_plan}
      className={className}
    />
  );
}
