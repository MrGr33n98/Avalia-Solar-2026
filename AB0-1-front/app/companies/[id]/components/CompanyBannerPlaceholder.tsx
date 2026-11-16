import type { Company } from '@/lib/api';
import {
  resolveCompanyFallbackBanner,
} from '@/utils/company-banner';

interface CompanyBannerPlaceholderProps {
  alt: string;
  company?: Partial<Company> | null;
  className?: string;
  priority?: boolean;
}

/**
 * Institutional fallback uses the same intrinsic ratio as the default free
 * banner. No fixed-height wrapper, background blur or decorative fade.
 */
export default function CompanyBannerPlaceholder({
  alt,
  company,
  className = '',
  priority = false,
}: CompanyBannerPlaceholderProps) {
  const fallback = resolveCompanyFallbackBanner(company);

  return (
    <picture className="block w-full">
      <img
        src={fallback.src}
        width={fallback.width}
        height={fallback.height}
        alt={alt}
        className={`block h-auto w-full ${className}`}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
      />
    </picture>
  );
}
