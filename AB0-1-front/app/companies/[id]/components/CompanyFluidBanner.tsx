'use client';

import Image from 'next/image';

/**
 * Custom banners cannot use a fixed-height frame without cropping or
 * letterboxing arbitrary uploaded image ratios.
 *
 * next/image keeps image optimization; h-auto lets the image's natural
 * dimensions determine the rendered height once decoded.
 *
 * For zero-CLS before decode on custom uploads, the API will need to expose
 * analyzed ActiveStorage width/height metadata (tracked separately).
 */
export default function CompanyFluidBanner({
  src,
  alt,
  priority = false,
  quality = 90,
  onError,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  quality?: number;
  onError?: () => void;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={1600}
      height={900}
      priority={priority}
      quality={quality}
      sizes="(max-width: 767px) 100vw, (max-width: 1023px) 100vw, 1240px"
      className="block h-auto w-full"
      onError={onError}
      data-testid="company-fluid-banner"
    />
  );
}
