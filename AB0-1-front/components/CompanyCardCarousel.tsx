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
    <div className="relative w-full overflow-hidden" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 transition-transform duration-500 ease-in-out">
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
              aria-label={`Ir para slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={i === index ? 'w-8 h-2 bg-gray-800 rounded-full' : 'w-2 h-2 bg-gray-400 rounded-full'}
            />
          ))}
        </div>
      )}

      {showControls && items.length > 1 && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2">
          <button aria-label="Anterior" className="bg-white/80 hover:bg-white text-black rounded-full px-3 py-2 shadow" onClick={() => setIndex((p) => (p === 0 ? items.length - 1 : p - 1))}>
            ‹
          </button>
          <button aria-label="Próximo" className="bg-white/80 hover:bg-white text-black rounded-full px-3 py-2 shadow" onClick={next}>
            ›
          </button>
        </div>
      )}
    </div>
  );
}
