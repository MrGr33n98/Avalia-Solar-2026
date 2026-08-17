'use client';

import { useEffect, useState } from 'react';
import { Camera, ChevronLeft, ChevronRight, X } from 'lucide-react';

export type ReviewMediaItem = {
  id: number;
  thumbnail_url: string;
  display_url: string;
  width?: number | null;
  height?: number | null;
  sort_order: number;
};

export function ReviewMediaGallery({
  media,
  companyName = 'empresa',
}: {
  media?: ReviewMediaItem[];
  companyName?: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const visibleMedia = (media || []).slice().sort((a, b) => a.sort_order - b.sort_order);

  useEffect(() => {
    if (activeIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveIndex(null);
      if (event.key === 'ArrowLeft') setActiveIndex((index) => index === null ? null : (index - 1 + visibleMedia.length) % visibleMedia.length);
      if (event.key === 'ArrowRight') setActiveIndex((index) => index === null ? null : (index + 1) % visibleMedia.length);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activeIndex, visibleMedia.length]);

  if (visibleMedia.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        <Camera className="h-3.5 w-3.5" aria-hidden="true" /> Fotos enviadas
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
        {visibleMedia.slice(0, 4).map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="relative h-20 w-24 shrink-0 snap-start overflow-hidden rounded-lg border border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            aria-label={`Abrir foto ${index + 1} da avaliação`}
          >
            <img
              src={item.thumbnail_url}
              alt={`Foto ${index + 1} da avaliação de ${companyName}`}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform hover:scale-105"
            />
            {index === 3 && visibleMedia.length > 4 && (
              <span className="absolute inset-0 grid place-items-center bg-black/50 text-sm font-bold text-white">
                +{visibleMedia.length - 4}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Visualização da foto da avaliação"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setActiveIndex(null)}
        >
          <button type="button" onClick={() => setActiveIndex(null)} aria-label="Fechar fotos" className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <X className="h-6 w-6" />
          </button>
          <button type="button" onClick={(event) => { event.stopPropagation(); setActiveIndex((activeIndex - 1 + visibleMedia.length) % visibleMedia.length); }} aria-label="Foto anterior" className="absolute left-3 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-8">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <img
            src={visibleMedia[activeIndex].display_url}
            alt={`Foto ${activeIndex + 1} da avaliação de ${companyName}`}
            className="max-h-[85dvh] max-w-[90vw] rounded-lg object-contain"
            onClick={(event) => event.stopPropagation()}
          />
          <button type="button" onClick={(event) => { event.stopPropagation(); setActiveIndex((activeIndex + 1) % visibleMedia.length); }} aria-label="Próxima foto" className="absolute right-3 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-8">
            <ChevronRight className="h-6 w-6" />
          </button>
          <span className="absolute bottom-5 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white">
            {activeIndex + 1} / {visibleMedia.length}
          </span>
        </div>
      )}
    </div>
  );
}