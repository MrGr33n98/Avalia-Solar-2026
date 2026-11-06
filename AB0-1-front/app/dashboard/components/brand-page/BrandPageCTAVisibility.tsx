'use client';

// The Brand Page uses the same optimistic-locking, tenant-scoped settings
// workflow as Company Settings. Do not implement an independent CTA gate:
// an OFF preference must not disable its own reactivation control.
import CtaVisibilitySettings from '../cta-visibility/CtaVisibilitySettings';
import type { Company } from '@/lib/api';

export default function BrandPageCTAVisibility({
  companyId,
}: {
  company?: Company;
  companyId: string;
}) {
  return <CtaVisibilitySettings companyId={companyId} />;
}
