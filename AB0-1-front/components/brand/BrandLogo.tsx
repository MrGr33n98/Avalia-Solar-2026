import Image from 'next/image';
import { cn } from '@/lib/utils';

export const AVALIA_SOLAR_LOGO_SRC = '/images/avalia-solar-logo-horizontal.svg';

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
  sizes?: string;
};

export function BrandLogo({
  className,
  priority = false,
  sizes = '(max-width: 640px) 120px, 180px',
}: BrandLogoProps) {
  return (
    <Image
      src={AVALIA_SOLAR_LOGO_SRC}
      alt="Avalia Solar"
      width={1500}
      height={345}
      sizes={sizes}
      priority={priority}
      className={cn('h-auto w-auto aspect-[1500/345] object-contain', className)}
    />
  );
}
