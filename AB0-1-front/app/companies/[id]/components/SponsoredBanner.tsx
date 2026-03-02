'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import analyticsApi from '@/lib/api-analytics';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

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
  const [banner, setBanner] = useState<Banner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadBanner() {
      if (mounted) {
        setLoading(true);
        setImageFailed(false);
      }
      try {
        const response = await api.request<Banner[]>({
          url: '/banners',
          method: 'GET',
          params: { slot_key: slotKey, company_id: companyId, limit: 1 },
        });
        const item = Array.isArray(response.data) ? response.data[0] : null;
        if (!mounted) return;
        setBanner(item || null);
        if (item) {
          analyticsApi.trackBannerEvent({
            banner_id: item.id,
            company_id: companyId,
            event_type: 'view',
          });
        }
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || 'Erro ao carregar banner patrocinado');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadBanner();
    return () => {
      mounted = false;
    };
  }, [slotKey, companyId]);

  if (error) {
    return null;
  }
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

  const imageSrc =
    banner?.image_url && !imageFailed
      ? banner.image_url
      : '/images/banner-avalia-solar.png';

  const imageAlt = banner?.title || 'Banner';

  const onClick = () => {
    if (banner) {
      analyticsApi.trackBannerEvent({
        banner_id: banner.id,
        company_id: companyId,
        event_type: 'click',
      });
    }
  };

  const aspectClass =
    variant === 'square'
      ? 'aspect-[16/10]'
      : 'aspect-[3/1] md:aspect-[4/1]';

  const content = (
    <div className={cn('relative w-full overflow-hidden rounded-xl bg-muted/20', aspectClass)}>
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        sizes={variant === 'square' ? '(max-width: 1024px) 100vw, 360px' : '(max-width: 1024px) 100vw, 900px'}
        className="object-cover object-center"
        onError={() => setImageFailed(true)}
      />
    </div>
  );

  if (variant === 'square') {
    return (
      <Card className={cn('overflow-hidden border border-slate-100 shadow-sm', className)}>
        <CardContent className="p-3">
          {banner?.link_url ? (
            <a href={banner.link_url} target="_blank" rel="noopener noreferrer" onClick={onClick}>
              {content}
            </a>
          ) : (
            content
          )}
          {banner?.link_url && (
            <div className="mt-3">
              <Button asChild variant="default" className="w-full">
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
    <div className={cn('overflow-hidden rounded-2xl border border-slate-100 shadow-sm', className)}>
      {banner?.link_url ? (
        <a href={banner.link_url} target="_blank" rel="noopener noreferrer" onClick={onClick}>
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}
