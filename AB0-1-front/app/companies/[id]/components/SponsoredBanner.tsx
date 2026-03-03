'use client';

import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    let mounted = true;
    async function loadBanners() {
      if (mounted) {
        setLoading(true);
      }
      try {
        const response = await api.request<Banner[]>({
          url: '/banners',
          method: 'GET',
          params: { slot_key: slotKey, company_id: companyId, limit: 5 },
        });
        const items = Array.isArray(response.data) ? response.data : [];
        if (!mounted) return;
        setBanners(items);

        items.forEach(item => {
          analyticsApi.trackBannerEvent({
            banner_id: item.id,
            company_id: companyId,
            event_type: 'view',
          });
        });
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || 'Erro ao carregar banners patrocinados');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadBanners();
    return () => {
      mounted = false;
    };
  }, [slotKey, companyId]);

  if (loading) {
    return (
      <div className={className}>
        <div
          className={cn(
            'animate-pulse rounded-xl bg-muted',
            variant === 'square' ? 'aspect-[16/10]' : 'aspect-[3/1] md:aspect-[4/1]'
          )}
        />
      </div>
    );
  }

  if (error || banners.length === 0) {
    return null;
  }

  const aspectClass =
    variant === 'square'
      ? 'aspect-[16/10]'
      : 'aspect-[3/1] md:aspect-[4/1]';

  const renderBannerContent = (banner: Banner) => {
    const imageSrc = banner.image_url || '/images/banner-avalia-solar.png';
    const imageAlt = banner.title || 'Banner';

    const onClick = () => {
      analyticsApi.trackBannerEvent({
        banner_id: banner.id,
        company_id: companyId,
        event_type: 'click',
      });
    };

    const content = (
      <div className="relative w-full h-full bg-muted/20">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes={variant === 'square' ? '(max-width: 1024px) 100vw, 360px' : '(max-width: 1024px) 100vw, 900px'}
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
            <div className={cn("relative flex-1 overflow-hidden rounded-lg", aspectClass)}>
              {banner.link_url ? (
                <a href={banner.link_url} target="_blank" rel="noopener noreferrer" onClick={onClick} className="block w-full h-full">
                  {content}
                </a>
              ) : (
                content
              )}
            </div>
            {banner.link_url && (
              <div className="mt-3">
                <Button asChild variant="default" size="sm" className="w-full">
                  <a href={banner.link_url} target="_blank" rel="noopener noreferrer" onClick={onClick}>
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
          <a href={banner.link_url} target="_blank" rel="noopener noreferrer" onClick={onClick} className="block w-full h-full">
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
      <div className={cn('overflow-hidden rounded-2xl border border-slate-100 shadow-sm', className)}>
        <div className={aspectClass}>
          {renderBannerContent(banners[0])}
        </div>
      </div>
    );
  }

  const items = banners.map((b, i) => (
    <React.Fragment key={b.id || i}>
      {renderBannerContent(b)}
    </React.Fragment>
  ));

  return (
    <div className={cn("w-full", className)}>
      <PremiumBannerCarousel 
        items={items}
        aspectRatio={aspectClass}
        autoplayDelay={5000}
      />
    </div>
  );
}
