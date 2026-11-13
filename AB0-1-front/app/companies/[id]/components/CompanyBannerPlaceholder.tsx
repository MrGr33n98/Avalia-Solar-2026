interface CompanyBannerPlaceholderProps {
  alt: string;
  className?: string;
  priority?: boolean;
}

/**
 * Fallback art direction for profiles that do not yet have a custom cover.
 * A <picture> lets the browser download exactly one of the two creatives.
 */
export default function CompanyBannerPlaceholder({
  alt,
  className = '',
  priority = false,
}: CompanyBannerPlaceholderProps) {
  return (
    <picture className="block h-full w-full">
      <source
        media="(max-width: 639px)"
        srcSet="/assets/avalia-solar-banner-v3.webp"
      />
      <img
        src="/assets/avalia-solar-banner-v3.webp"
        alt={alt}
        className={`h-full w-full object-cover object-center ${className}`}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
      />
    </picture>
  );
}
