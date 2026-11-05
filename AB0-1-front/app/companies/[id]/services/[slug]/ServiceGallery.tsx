'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';

type Props = {
  serviceName: string;
  images: string[];
};

export default function ServiceGallery({ serviceName, images }: Props) {
  const [selected, setSelected] = useState(0);
  const visibleImages = images.filter(Boolean);
  const hasImages = visibleImages.length > 0;
  const currentIndex = Math.min(selected, Math.max(visibleImages.length - 1, 0));

  return (
    <div className="space-y-3">
      <div className="group relative aspect-[16/10] overflow-hidden rounded-[24px] border border-slate-100 bg-gradient-to-br from-slate-100 to-blue-100 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
        {hasImages ? (
          <>
            <Image
              key={visibleImages[currentIndex]}
              src={visibleImages[currentIndex]}
              alt={`${serviceName} — imagem ${currentIndex + 1} de ${visibleImages.length}`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 740px"
              className="object-cover"
            />
            {visibleImages.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Imagem anterior"
                  onClick={() => setSelected((index) => (index - 1 + visibleImages.length) % visibleImages.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-2.5 text-slate-900 shadow-lg transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Próxima imagem"
                  onClick={() => setSelected((index) => (index + 1) % visibleImages.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-2.5 text-slate-900 shadow-lg transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <span className="absolute bottom-4 right-4 rounded-full bg-slate-950/75 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                  {currentIndex + 1} / {visibleImages.length}
                </span>
              </>
            )}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
            <ImageIcon className="h-14 w-14 stroke-[1.2]" aria-hidden="true" />
            <span className="text-sm">Imagens do serviço em preparação</span>
          </div>
        )}
      </div>

      {visibleImages.length > 1 && (
        <div aria-label="Selecionar imagem da galeria" className="flex gap-2 overflow-x-auto pb-1">
          {visibleImages.map((url, index) => (
            <button
              type="button"
              key={`${url}-${index}`}
              aria-label={`Mostrar imagem ${index + 1}`}
              aria-pressed={currentIndex === index}
              onClick={() => setSelected(index)}
              className={`relative h-[76px] w-[106px] shrink-0 overflow-hidden rounded-xl border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                currentIndex === index ? 'border-blue-600 ring-2 ring-blue-100' : 'border-transparent opacity-75 hover:opacity-100'
              }`}
            >
              <Image src={url} alt="" fill sizes="106px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
