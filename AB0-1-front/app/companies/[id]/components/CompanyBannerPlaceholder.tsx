interface CompanyBannerPlaceholderProps {
  alt: string;
  className?: string;
  priority?: boolean;
}

/**
 * Institutional fallback uses the same intrinsic ratio as the default free
 * banner. No fixed-height wrapper, background blur or decorative fade.
 */
export default function CompanyBannerPlaceholder({
  alt,
  className = '',
  priority = false,
}: CompanyBannerPlaceholderProps) {
  return (
    <picture className="block w-full">
      <img
        src="/assets/avalia-solar-banner-v3.webp"
        width={1024}
        height={191}
        alt={alt}
        className={`block h-auto w-full ${className}`}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
      />
    </picture>
  );
}
