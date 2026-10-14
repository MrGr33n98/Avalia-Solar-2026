'use client';

import { Company } from '@/lib/api';
import { isFeatureEnabled } from '@/lib/feature-access';
import { CompanyVerifiedBadge } from '@/components/company/CompanyVerifiedBadge';

interface CompanyVerificationBadgeProps {
  company: Company;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CompanyVerificationBadge({
  company,
  className,
  size = 'md',
}: CompanyVerificationBadgeProps) {
  const isVerifiedEnabled = isFeatureEnabled(company?.feature_access, 'verified_product');
  const isVerified = Boolean(
    company?.verified ||
    company?.trust?.verification_status === 'verified' ||
    isVerifiedEnabled
  );

  if (!isVerified) {
    return null;
  }

  return <CompanyVerifiedBadge className={className} size={size} />;
}
