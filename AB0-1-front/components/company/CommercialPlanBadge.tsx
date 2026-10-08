'use client';



export interface CommercialPlanBadgeProps {
  commercialStatus?: {
    tier?: string;
    status?: string;
    paid?: boolean;
  } | null;
  hasPaidPlan?: boolean;
  className?: string;
}

export default function CommercialPlanBadge(_props?: CommercialPlanBadgeProps) {
  return null;
}
