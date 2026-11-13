'use client';

import Image, { getImageProps } from 'next/image';
import { useState } from 'react';

const FREE_COMPANY_BANNER_SRC = '/assets/avalia-solar-banner-v3.webp';
const MOBILE_COMPANY_BANNER_SRC = '/assets/avalia-solar-banner-v3.webp';
const IMAGE_FALLBACK_SRC = '/images/placeholder.png';

export default function CompanyFreeBannerPlaceholder({
  alt,
  priority = false,
  desktopCover = false,
}: {
  alt: string;
  priority?: boolean;
  desktopCover?: boolean;
}) {
  const [mobileSourceFailed, setMobileSourceFailed] = useState(false);
  const [imageSourceFailed, setImageSourceFailed] = useState(false);
  const mobileImageSource = getImageProps({
    src: MOBILE_COMPANY_BANNER_SRC,
    alt,
    width: 2103,
    height: 748,
    sizes: '100vw',
    quality: 95,
  }).props;

  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      <picture
        className={
          desktopCover ? 'relative z-10 block h-full w-full' : 'relative block h-full w-full'
        }
      >
        {!mobileSourceFailed && !imageSourceFailed && (
          <source
            media="(max-width: 767px)"
            srcSet={mobileImageSource.srcSet}
            sizes={mobileImageSource.sizes}
          />
        )}
        <Image
          src={imageSourceFailed ? IMAGE_FALLBACK_SRC : FREE_COMPANY_BANNER_SRC}
          alt={alt}
          fill
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          quality={95}
          className="object-contain"
          sizes="(max-width: 767px) 100vw, (max-width: 1023px) 100vw, 1240px"
          onError={() => {
            if (!mobileSourceFailed) {
              setMobileSourceFailed(true);
            } else {
              setImageSourceFailed(true);
            }
          }}
        />
      </picture>
    </div>
  );
}
