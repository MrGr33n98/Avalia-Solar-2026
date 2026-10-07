'use client';

import { OptimizedImage } from '@/components/ui/optimized-image';

const FREE_COMPANY_BANNER_SRC = '/assets/avalia-solar-banner-placeholder.png';

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
    <div className="relative h-full w-full overflow-hidden bg-slate-900">
      {desktopCover && (
        <OptimizedImage
          src={FREE_COMPANY_BANNER_SRC}
          alt=""
          fill
          quality={60}
          objectFit="cover"
          className="scale-110 blur-lg"
          containerClassName="absolute inset-0 h-full w-full md:hidden"
          sizes="100vw"
          useAspectRatio={false}
          width={2896}
          height={543}
        />
      )}
      <OptimizedImage
        src={FREE_COMPANY_BANNER_SRC}
        alt={alt}
        fill
        priority={priority}
        quality={95}
        objectFit="cover"
        className="object-cover"
        containerClassName={desktopCover ? 'relative z-10 h-full w-full' : 'h-full w-full'}
        sizes="(max-width: 767px) 100vw, 1240px"
        useAspectRatio={false}
        width={2896}
        height={543}
      />
    </div>
  );
}
