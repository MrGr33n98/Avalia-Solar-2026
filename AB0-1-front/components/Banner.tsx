'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { fetchApiSafe } from '@/lib/api-client';
import { getCurrentUTMs } from '@/lib/analytics/utm';

interface BannerProps {
  id?: number | string;
  type: 'rectangular_large' | 'rectangular_small';
  position: 'navbar' | 'sidebar';
  imageUrl: string;
  title: string;
  link?: string;
  sponsored?: boolean;
  companyId?: number;
  categoryId?: number;
  slotKey?: string;
  pagePath?: string;
}

export function Banner({
  id,
  type,
  position,
  imageUrl,
  title,
  link,
  sponsored,
  companyId,
  categoryId,
  slotKey,
  pagePath,
}: BannerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewSentRef = useRef(false);

  const page_path = pagePath || (typeof window !== 'undefined' ? window.location.pathname : undefined);
  const utm = getCurrentUTMs();
  const bannerId = id ?? null;

  const sendBannerEvent = async (event_type: 'view' | 'click') => {
    if (!bannerId) return;
    try {
      await fetchApiSafe('banner_events', {
        method: 'POST',
        body: JSON.stringify({
          banner_event: {
            banner_id: bannerId,
            company_id: companyId,
            event_type,
            tracked_at: new Date().toISOString(),
            utm,
            metadata: {
              slot_key: slotKey || `${position}_${type}`,
              position,
              page_path,
              category_id: categoryId,
              title,
              link,
            },
          },
        }),
      });
    } catch (err) {
      console.warn('[Banner] Failed to send banner event', err);
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el || viewSentRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting && entry.intersectionRatio >= 0.5 && !viewSentRef.current) {
          viewSentRef.current = true;
          void sendBannerEvent('view');
        }
      },
      { threshold: [0.5] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const bannerContent = (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden rounded-lg',
        type === 'rectangular_large' ? 'w-full aspect-[16/9] sm:aspect-[3/1]' : 'w-full sm:w-[300px] aspect-[4/3] sm:h-[250px]',
        position === 'navbar' ? 'mb-6' : 'mb-4'
      )}
    >
      <Image
        src={imageUrl}
        alt={title}
        fill
        className="object-contain md:object-cover object-center"
        priority={position === 'navbar'}
      />
      {sponsored && (
        <span className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded text-xs">
          Patrocinado
        </span>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-4">
        <h3 className="text-white font-semibold truncate">{title}</h3>
      </div>
    </div>
  );

  const handleClick = () => {
    void sendBannerEvent('click');
  };

  return link ? (
    <a href={link} target="_blank" rel="noopener noreferrer" onClick={handleClick}>
      {bannerContent}
    </a>
  ) : (
    <div onClick={handleClick}>{bannerContent}</div>
  );
}
