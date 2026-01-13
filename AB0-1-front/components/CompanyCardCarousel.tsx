import { useEffect, useRef, useState, useCallback } from 'react';
import { Company } from '@/lib/api';
import CompanyCard from './CompanyCard';

type Props = {
  items: Company[];
  interval?: number;
  showControls?: boolean;
  showIndicators?: boolean;
};

export default function CompanyCardCarousel({ items, interval = 5000, showControls = true, showIndicators = true }: Props) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timerRef = useRef<number | null>(null);

  const next = useCallback(() => {
    setIndex((prev) => (prev + 1) % Math.max(items.length, 1));
  }, [items.length]);

  useEffect(() => {
    if (!playing || items.length <= 1) return;
    timerRef.current = window.setInterval(next, interval);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [playing, interval, items.length, next]);

  const onMouseEnter = () => setPlaying(false);
  const onMouseLeave = () => setPlaying(true);

  const visible = (i: number) => {
    const start = index;
    const end = (start + 2) % items.length;
    return i === start || i === (start + 1) % items.length || i === end;
  };

  return (
    <div
      className="relative w-full overflow-hidden"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Empresas"
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') next();
        if (e.key === 'ArrowLeft') setIndex((p) => (p === 0 ? items.length - 1 : p - 1));
      }}
    >
      <div id="company-card-carousel-grid" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 transition-transform duration-500 ease-in-out">
        {items.map((item, i) => (
          <div key={item.id} className={visible(i) ? 'opacity-100' : 'opacity-0 pointer-events-none'}>
            <CompanyCard company={item} compact className="h-full" />
          </div>
        ))}
      </div>

      {showIndicators && items.length > 1 && (
        <div className="flex gap-2 justify-center mt-3">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir para slide ${i + 1}`}
              aria-pressed={i === index}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => setIndex(i)}
              className={`${i === index ? 'w-8 h-2 bg-gray-800' : 'w-2 h-2 bg-gray-400'} rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40`}
            />
          ))}
        </div>
      )}

      {showControls && items.length > 1 && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2">
          <button type="button" aria-label="Anterior" aria-controls="company-card-carousel-grid" className="bg-white/80 hover:bg-white text-black rounded-full px-3 py-2 shadow focus-visible:ring-2 focus-visible:ring-primary/40" onClick={() => setIndex((p) => (p === 0 ? items.length - 1 : p - 1))}>
            ‹
          </button>
          <button type="button" aria-label="Próximo" aria-controls="company-card-carousel-grid" className="bg-white/80 hover:bg-white text-black rounded-full px-3 py-2 shadow focus-visible:ring-2 focus-visible:ring-primary/40" onClick={next}>
            ›
          </button>
        </div>
      )}
    </div>
  );
}
