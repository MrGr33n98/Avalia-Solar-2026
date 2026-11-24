import { useRef, useState } from 'react';
import type { Integrator } from '../contracts/schemas';
import { sanitizeExternalHttpsUrl } from '../bridge/capabilities';
import { Button } from '../design/primitives';

type Carousel = NonNullable<Integrator['hero_carousel']>;

export function BrandHero({ carousel }: { carousel: Carousel }) {
  const slides = carousel.enabled
    ? [...carousel.slides].filter((slide) => sanitizeExternalHttpsUrl(slide.image_url))
      .sort((a, b) => a.position - b.position)
    : [];
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const current = slides.length ? index % slides.length : 0;
  const slide = slides[current];
  const src = sanitizeExternalHttpsUrl(slide?.image_url);
  const move = (delta: number) => setIndex((value) => (value + delta + slides.length) % slides.length);

  return (
    <section aria-label="Banner institucional" className="as-stack" style={{ gap: 4 }}>
      <div
        style={{ aspectRatio: '16 / 5', width: '100%', overflow: 'hidden', background: 'var(--as-bg-muted)', touchAction: 'pan-y' }}
        onTouchStart={(event) => {
          const point = event.touches[0];
          touch.current = point ? { x: point.clientX, y: point.clientY } : null;
        }}
        onTouchEnd={(event) => {
          const start = touch.current;
          touch.current = null;
          const end = event.changedTouches[0];
          if (!start || !end || slides.length < 2) return;
          const dx = end.clientX - start.x;
          const dy = end.clientY - start.y;
          if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
        }}
      >
        {src && slide && !failed.includes(src) ? (
          <img key={src} src={src} alt={slide.alt_text} onError={() => setFailed((urls) => [...urls, src])}
            style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <div className="as-meta" style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
            Banner institucional indisponível
          </div>
        )}
      </div>
      {slides.length > 1 ? (
        <div className="as-row as-between">
          <Button variant="secondary" onClick={() => move(-1)}>Anterior</Button>
          <span className="as-meta" aria-live="polite">{current + 1} / {slides.length}</span>
          <Button variant="secondary" onClick={() => move(1)}>Próximo</Button>
        </div>
      ) : null}
    </section>
  );
}
