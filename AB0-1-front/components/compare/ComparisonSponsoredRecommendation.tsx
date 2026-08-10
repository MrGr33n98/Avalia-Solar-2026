'use client';

import { ExternalLink } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';

import { useBannersQuery } from '@/hooks/useBannersQuery';
import { analyticsApi } from '@/lib/api-analytics';
import { track } from '@/lib/analytics/lazy';

const PLACEMENT = 'comparison_floating_bar';

interface ComparisonSponsoredRecommendationProps {
  excludedCompanyIds: number[];
}

export function ComparisonSponsoredRecommendation({
  excludedCompanyIds,
}: ComparisonSponsoredRecommendationProps) {
  const containerRef = useRef<HTMLAnchorElement>(null);
  const impressionTrackedRef = useRef<string | null>(null);
  const { data: banners } = useBannersQuery({ position: PLACEMENT, limit: 6 });

  const recommendation = useMemo(() => {
    const excluded = new Set(excludedCompanyIds.map(Number));
    return (banners || []).find(
      (banner) => !banner.company_id || !excluded.has(Number(banner.company_id))
    );
  }, [banners, excludedCompanyIds]);

  useEffect(() => {
    const node = containerRef.current;
    const deliveryKey = recommendation?.delivery_id || 'legacy';
    const impressionKey = recommendation
      ? `${recommendation.id}:${deliveryKey}:${PLACEMENT}`
      : null;
    if (!node || !recommendation || impressionTrackedRef.current === impressionKey) return;

    let visibleTimer: ReturnType<typeof setTimeout> | undefined;
    const registerImpression = () => {
      if (!impressionKey || impressionTrackedRef.current === impressionKey) return;
      impressionTrackedRef.current = impressionKey;
      const impressionInstanceId = impressionKey;
      void analyticsApi.trackBannerEvent({
        banner_id: recommendation.id,
        company_id: recommendation.company_id || undefined,
        event_type: 'impression',
        impression_instance_id: impressionInstanceId,
        delivery_id: recommendation.delivery_id || undefined,
        metadata: {
          position: PLACEMENT,
          page_path: window.location.pathname,
          banner_id: recommendation.id,
          title: recommendation.title,
          link: recommendation.link_url || recommendation.link || null,
        },
        tracked_at: new Date().toISOString(),
      });
      track('banner_view', {
        banner_id: recommendation.id,
        banner_position: PLACEMENT,
        element_type: 'sponsored_recommendation',
      });
    };

    if (typeof IntersectionObserver === 'undefined') {
      visibleTimer = setTimeout(registerImpression, 1000);
      return () => clearTimeout(visibleTimer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && entry.intersectionRatio >= 0.5) {
          visibleTimer = setTimeout(registerImpression, 1000);
        } else if (visibleTimer) {
          clearTimeout(visibleTimer);
          visibleTimer = undefined;
        }
      },
      { threshold: [0, 0.5, 1] }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (visibleTimer) clearTimeout(visibleTimer);
    };
  }, [recommendation]);

  if (!recommendation) return null;

  const destination = recommendation.link_url || recommendation.link || '#';

  const handleClick = () => {
    track('banner_click', {
      banner_id: recommendation.id,
      banner_position: PLACEMENT,
      element_type: 'sponsored_recommendation',
      destination_url: destination,
    });
  };

  return (
    <a
      ref={containerRef}
      href={`/api/v1/banner_clicks/${recommendation.id}`}
      target="_blank"
      rel="sponsored noopener noreferrer"
      onClick={handleClick}
      aria-label={`Patrocinado: ${recommendation.title}`}
      className="group flex min-h-14 min-w-0 items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-2 transition-colors hover:border-amber-300 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
    >
      <span className="shrink-0 rounded-md bg-amber-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-amber-800">
        Patrocinado
      </span>
      {recommendation.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={recommendation.image_url}
          alt=""
          className="hidden h-9 w-16 shrink-0 rounded-md border border-amber-100 bg-white object-contain sm:block"
        />
      ) : null}
      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800">
        {recommendation.title}
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-amber-800 transition-colors group-hover:bg-amber-100">
        Conhecer
        <ExternalLink className="h-3 w-3" />
      </span>
    </a>
  );
}
