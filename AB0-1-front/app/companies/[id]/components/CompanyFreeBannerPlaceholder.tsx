'use client';

import Image from 'next/image';
import { useState } from 'react';

// Proporção da arte institucional: reservar a altura antes do carregamento.
// Não usar "fill" ou um contêiner de altura fixa: isso cria faixas letterbox.
export const FREE_COMPANY_BANNER_SRC = '/assets/avalia-solar-banner-v3.webp';
// Conferido diretamente no cabeçalho VP8 do WebP: 1024 × 191 (razão 5.361:1).
// Estes atributos DEVEM refletir os pixels do asset para evitar layout shift e distorção.
export const FREE_COMPANY_BANNER_DIMENSIONS = { width: 1024, height: 191 } as const;
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
  const [imageSourceFailed, setImageSourceFailed] = useState(false);

  return (
    <picture
      className={desktopCover ? 'relative z-10 block w-full' : 'block w-full'}
      data-testid="company-free-banner-picture"
    >
      <Image
        src={imageSourceFailed ? IMAGE_FALLBACK_SRC : FREE_COMPANY_BANNER_SRC}
        alt={alt}
        width={FREE_COMPANY_BANNER_DIMENSIONS.width}
        height={FREE_COMPANY_BANNER_DIMENSIONS.height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        quality={90}
        className="block h-auto w-full"
        sizes="(max-width: 767px) 100vw, (max-width: 1023px) 100vw, 1240px"
        onError={() => {
          if (!imageSourceFailed) setImageSourceFailed(true);
        }}
      />
    </picture>
  );
}
