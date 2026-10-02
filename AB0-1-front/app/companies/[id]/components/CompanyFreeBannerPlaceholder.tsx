'use client';

import { OptimizedImage } from '@/components/ui/optimized-image';

const FREE_COMPANY_BANNER_SRC =
  '/assets/avalia-solar-banner-placeholder.png';

export default function CompanyFreeBannerPlaceholder({
  alt,
  priority = false,
  desktopCover = false,
}: {
  alt: string;
  priority?: boolean;
  desktopCover?: boolean;
}) {
  return (
    <OptimizedImage
      src={FREE_COMPANY_BANNER_SRC}
      alt={alt}
      fill
      priority={priority}
      objectFit="contain"
      className={desktopCover ? 'md:!object-cover' : undefined}
      width={1200}
      containerClassName="h-full w-full"
      useAspectRatio={false}
      height={400}
    />
  );
}
