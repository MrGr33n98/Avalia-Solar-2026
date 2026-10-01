'use client';

import { OptimizedImage } from '@/components/ui/optimized-image';

const FREE_COMPANY_BANNER_SRC =
  '/assets/avalia-solar-icon-pack/avalia-solar-banner-placeholder.png';

export default function CompanyFreeBannerPlaceholder({
  alt,
  priority = false,
}: {
  alt: string;
  priority?: boolean;
}) {
  return (
    <OptimizedImage
      src={FREE_COMPANY_BANNER_SRC}
      alt={alt}
      fill
      priority={priority}
      objectFit="contain"
      width={1600}
      containerClassName="h-full w-full"
      useAspectRatio={false}
      height={900}
    />
  );
}
