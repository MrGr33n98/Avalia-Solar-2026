'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import analyticsApi from '@/lib/api-analytics';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { PremiumBannerCarousel } from '@/components/PremiumBannerCarousel';

type SponsoredBannerProps = {
  slotKey: string;
  companyId?: number;
  variant?: 'inline' | 'square';
  className?: string;
};

type Banner = {
  id: number;
  title: string;
  image_url?: string | null;
  link?: string | null;
  link_url?: string | null;
  sponsored?: boolean;
  width?: number | null;
  height?: number | null;
  delivery_id?: string | null;
};

export default function SponsoredBanner({
  slotKey,
  companyId,
  variant = 'inline',
  className,
}: SponsoredBannerProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const impressionTrackedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    let mounted = true;
    async function loadBanners() {
      if (mounted) setLoading(true);
      try {
        const response = await api.request<Banner[]>({
          url: '/banners',
          method: 'GET',
          params: { slot_key: slotKey, company_id: companyId, limit: 5 },
        });
        const items = Array.isArray(response.data) ? response.data : [];
        if (!mounted) return;
        setBanners(items);
      } catch (err: unknown) {
        if (!mounted) return;
        const message =
          err instanceof Error ? err.message : 'Erro ao carregar banners patrocinados';
        setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadBanners();
    return () => {
      mounted = false;
    };
  }, [slotKey, companyId]);

  useEffect(() => {
    const node = containerRef.current;
    const firstBanner = banners[0];
    if (!node || !firstBanner) return;
    const trackImpression = (banner: Banner) => {
      if (impressionTrackedRef.current.has(banner.id)) return;
      impressionTrackedRef.current.add(banner.id);
      void analyticsApi.trackBannerEvent({
        banner_id: banner.id,
        company_id: companyId,
        event_type: 'impression',
        impression_instance_id: `${banner.id}:${slotKey}`,
        delivery_id: banner.delivery_id || undefined,
        metadata: { slot_key: slotKey },
      });
    };
    if (typeof IntersectionObserver === 'undefined') {
      trackImpression(firstBanner);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && entry.intersectionRatio >= 0.5) {
          trackImpression(firstBanner);
          observer.disconnect();
        }
      },
      { threshold: [0.5] }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [banners, companyId, loading, slotKey]);

  const aspectClass = useMemo(
    () => (variant === 'square' ? 'aspect-[16/10]' : 'aspect-[3/1] md:aspect-[4/1]'),
    [variant]
  );

  if (loading) {
    return (
      <div
        className={cn(
          'w-full overflow-hidden rounded-2xl bg-muted animate-pulse',
          aspectClass,
          className
        )}
      />
    );
  }

  if (error || banners.length === 0) return null;

  const renderBannerContent = (banner: Banner) => {
    const imageSrc = banner.image_url || '/images/banner-avalia-solar.png';
    const imageAlt = banner.title || 'Banner';

    const content = (
      <div className="relative w-full h-full bg-muted/20">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes={
            variant === 'square'
              ? '(max-width: 1024px) 100vw, 360px'
              : '(max-width: 1024px) 100vw, 900px'
          }
          className="object-cover object-center"
        />
        {banner.sponsored !== false && (
          <span className="absolute bottom-2 right-2 z-10 bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 rounded backdrop-blur-sm">
            Patrocinado
          </span>
        )}
      </div>
    );

    if (variant === 'square') {
      return (
        <Card className="h-full overflow-hidden border border-slate-100 shadow-sm">
          <CardContent className="p-3 h-full flex flex-col">
            <div className={cn('relative flex-1 overflow-hidden rounded-lg', aspectClass)}>
              {banner.link_url ? (
                <a
                  href={`/api/v1/banner_clicks/${banner.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full h-full"
                >
                  {content}
                </a>
              ) : (
                content
              )}
            </div>
            {banner.link_url && (
              <div className="mt-3">
                <Button asChild variant="default" size="sm" className="w-full">
                  <a
                    href={`/api/v1/banner_clicks/${banner.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Saiba mais
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="w-full h-full">
        {banner.link_url ? (
          <a
            href={`/api/v1/banner_clicks/${banner.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full h-full"
          >
            {content}
          </a>
        ) : (
          content
        )}
      </div>
    );
  };

  if (banners.length === 1) {
    return (
      <div
        ref={containerRef}
        className={cn('overflow-hidden rounded-2xl border border-slate-100 shadow-sm', className)}
      >
        <div className={aspectClass}>{renderBannerContent(banners[0])}</div>
      </div>
    );
  }

  const items = banners.map((b, i) => (
    <React.Fragment key={b.id || i}>{renderBannerContent(b)}</React.Fragment>
  ));

  return (
    <div ref={containerRef} className={cn('w-full', className)}>
      <PremiumBannerCarousel
        items={items}
        aspectRatio={aspectClass}
        autoplayDelay={5000}
        onActiveIndexChange={(index) => {
          const banner = banners[index];
          if (!banner) return;
          void analyticsApi.trackBannerEvent({
            banner_id: banner.id,
            company_id: companyId,
            event_type: 'impression',
            impression_instance_id: `${banner.id}:${slotKey}`,
            delivery_id: banner.delivery_id || undefined,
            metadata: { slot_key: slotKey },
          });
        }}
      />
    </div>
  );
}
