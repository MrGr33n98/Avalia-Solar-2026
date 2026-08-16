'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { BannerSlot } from '@/components/banners/BannerSlot';

type UnifiedHeroBannerProps = {
  categoryName?: string;
  categorySlug?: string;
  categoryId?: number;
  companyId?: number;
  companyName?: string;
  className?: string;
};

export function UnifiedHeroBanner({
  categoryName = 'Energia Solar',
  categorySlug,
  categoryId,
  companyId,
  companyName,
  className,
}: UnifiedHeroBannerProps) {
  return (
    <div className={cn('my-4 w-full', className)}>
      <BannerSlot
        placement="company_profile_about_inline"
        categoryId={categoryId}
        companyId={companyId}
        limit={6}
        priority={true}
        fallback={null}
      />
    </div>
  );
}
