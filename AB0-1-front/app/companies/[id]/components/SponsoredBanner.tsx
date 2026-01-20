'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import analyticsApi from '@/lib/api-analytics';
import { api } from '@/lib/api';

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

  useEffect(() => {
    let mounted = true;
    async function loadBanner() {
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
  if (!banner) {
    return (
      <div className={className}>
        <div className="animate-pulse rounded-xl bg-muted h-24" />
      </div>
    );
  }

  const onClick = () => {
    analyticsApi.trackBannerEvent({
      banner_id: banner.id,
      company_id: companyId,
      event_type: 'click',
    });
  };

  const content = (
    <div className="relative w-full overflow-hidden rounded-xl">
      {banner.image_url ? (
        <Image
          src={banner.image_url}
          alt={banner.title}
          width={banner.width || 600}
          height={banner.height || (variant === 'square' ? 250 : 180)}
          className="w-full h-auto object-cover"
        />
      ) : (
        <div className="h-24 bg-muted rounded-xl" />
      )}
    </div>
  );

  if (variant === 'square') {
    return (
      <Card className={className}>
        <CardContent className="p-3">
          {banner.link_url ? (
            <a href={banner.link_url} target="_blank" rel="noopener noreferrer" onClick={onClick}>
              {content}
            </a>
          ) : (
            content
          )}
          {banner.link_url && (
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
    <div className={className}>
      {banner.link_url ? (
        <a href={banner.link_url} target="_blank" rel="noopener noreferrer" onClick={onClick}>
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}
