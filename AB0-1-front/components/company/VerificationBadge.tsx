'use client';

import React from 'react';
import {
  CompanyVerifiedBadge,
  VerificationBadgeProps,
  OFFICIAL_VERIFIED_MESSAGE,
} from './CompanyVerifiedBadge';

export type { VerificationBadgeProps };
export { OFFICIAL_VERIFIED_MESSAGE };

export default function VerificationBadge({
  verification,
  verified,
  className,
  size = 'md',
  tooltipText,
}: VerificationBadgeProps) {
  const isVerified = verification
    ? verification.verified === true || verification.status === 'verified'
    : Boolean(verified);

  if (!isVerified) return null;

  return (
    <CompanyVerifiedBadge
      className={className}
      size={size}
      tooltipText={tooltipText}
    />
  );
}
