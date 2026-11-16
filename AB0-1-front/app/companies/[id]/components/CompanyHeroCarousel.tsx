'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { track } from '@/lib/analytics/lazy';
import type { CompanyHeroCarouselData } from '@/lib/api';
import { getFullImageUrl } from '@/utils/image';

type Props = {
  companyId: number;
  companyName: string;
  carousel?: CompanyHeroCarouselData | null;
  onAllFailed?: () => void;
};

const INTERVAL_MS = 6000;

/**
 * Renders ONLY a published, server-entitled institutional slide collection.
 * The current banner frame is preserved by reserving the first image's ratio.
 * No advertising slots, progress bars, dots, crops or layout-sized controls.
 */
export default function CompanyHeroCarousel({ companyId, companyName, carousel, onAllFailed }: Props) {
  const slides = carousel?.enabled ? (carousel.slides || []).filter(
    (slide) => slide.image_url && slide.width > 0 && slide.height > 0
  ).slice(0, 3) : [];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [failed, setFailed] = useState<number[]>([]);
  const frameRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const observed = useRef<Set<number>>(new Set());
  const slideIds = slides.map((slide) => slide.id).join(':');

  useEffect(() => {
    setIndex(0);
    setFailed([]);
    setUserInteracted(false);
    observed.current.clear();
  }, [companyId, slideIds]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(Boolean(media?.matches));
    update();
    media?.addEventListener?.('change', update);
    return () => media?.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const visibility = () => setHidden(document.visibilityState === 'hidden');
    visibility();
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, []);

  const navigate = useCallback((delta: number, source: 'manual' | 'auto') => {
    if (slides.length < 2) return;
    const next = (index + delta + slides.length) % slides.length;
    setIndex(next);
    track('hero_slide_advanced', {
      company_id: companyId, slide_id: slides[next].id,
      from_index: index, to_index: next, source, placement: 'brand_page_hero',
      sponsored: false,
    });
    if (source === 'manual') setUserInteracted(true);
  }, [slides, companyId, index]);

  useEffect(() => {
    if (slides.length < 2 || paused || hidden || reducedMotion || userInteracted) return;
    const timer = window.setInterval(() => navigate(1, 'auto'), INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [slides.length, paused, hidden, reducedMotion, userInteracted, navigate]);

  const current = slides[index];
  useEffect(() => {
    const node = frameRef.current;
    if (!node || !current || observed.current.has(current.id)) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const mark = () => {
      if (observed.current.has(current.id)) return;
      observed.current.add(current.id);
      track('hero_slide_impression', {
        company_id: companyId, slide_id: current.id,
        slot: current.slot, position: current.position,
        placement: 'brand_page_hero', sponsored: false,
      });
    };
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting && entry.intersectionRatio >= 0.5 && !hidden) {
        timer = setTimeout(mark, 1000);
      } else if (timer) {
        clearTimeout(timer);
        timer = undefined;
      }
    }, { threshold: [0, 0.5, 1] });
    observer.observe(node);
    return () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
    };
  }, [companyId, current, hidden]);

  if (!current) return null;

  const onTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStart.current || slides.length < 2) return;
    const dx = event.changedTouches[0].clientX - touchStart.current.x;
    const dy = event.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      navigate(dx < 0 ? 1 : -1, 'manual');
    }
  };

  return (
    <div
      ref={frameRef}
      role="region"
      aria-roledescription="carrossel"
      aria-label={`Banners da empresa ${companyName}`}
      className="group relative w-full overflow-hidden bg-white"
      style={{ aspectRatio: `${slides[0].width} / ${slides[0].height}` }}
      data-testid="company-hero-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setPaused(false);
      }}
      onTouchStart={(event) => {
        touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      }}
      onTouchEnd={onTouchEnd}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') { event.preventDefault(); navigate(1, 'manual'); }
        if (event.key === 'ArrowLeft') { event.preventDefault(); navigate(-1, 'manual'); }
      }}
    >
      <Image
        key={current.id}
        src={getFullImageUrl(current.image_url)}
        alt={current.alt_text || `Banner da empresa ${companyName}`}
        fill
        priority={index === 0}
        sizes="(max-width: 767px) 100vw, (max-width: 1023px) 100vw, 1240px"
        quality={90}
        className="block h-full w-full object-contain"
        onError={() => {
          setFailed((prev) => prev.includes(current.id) ? prev : [...prev, current.id]);
          if (failed.length + 1 >= slides.length) {
            onAllFailed?.();
          } else {
            navigate(1, 'auto');
          }
        }}
        data-testid="company-hero-carousel-image"
      />
      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Banner anterior"
            onClick={() => navigate(-1, 'manual')}
            className="absolute left-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-900 opacity-0 shadow-sm transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:group-hover:opacity-100"
          >
            <ChevronLeft aria-hidden="true" className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Próximo banner"
            onClick={() => navigate(1, 'manual')}
            className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-900 opacity-0 shadow-sm transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:group-hover:opacity-100"
          >
            <ChevronRight aria-hidden="true" className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
}
