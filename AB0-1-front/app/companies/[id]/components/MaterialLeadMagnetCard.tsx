'use client';

import { Download, LockKeyhole } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Material } from './MaterialsLibrary';
import Image from 'next/image';

interface MaterialLeadMagnetCardProps {
  material: Material;
  onDownload: () => void;
  materialCount?: number;
  onViewAll?: () => void;
}

export default function MaterialLeadMagnetCard({
  material,
  onDownload,
  materialCount = 1,
  onViewAll,
}: MaterialLeadMagnetCardProps) {
  return (
    <Card
      data-testid="featured-material-card"
      className="overflow-hidden rounded-none border border-slate-800 bg-[#0B1528] text-white shadow-md"
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-sky-400">
              Material destacado
            </span>
            <h4 className="mt-2 break-words text-base font-extrabold leading-tight text-white line-clamp-3">
              {material.title}
            </h4>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-300 line-clamp-3">
              {material.description || 'Baixe este material técnico disponibilizado pela empresa.'}
            </p>
          </div>

          {material.cover_url && (
            <div className="relative h-28 w-20 shrink-0 overflow-hidden bg-slate-900/60 sm:w-24">
              <Image
                src={material.cover_url}
                alt={`Capa do material: ${material.title}`}
                fill
                sizes="(min-width: 640px) 96px, 80px"
                className="object-contain"
              />
            </div>
          )}
        </div>

        <Button
          type="button"
          onClick={onDownload}
          className="mt-4 min-h-10 w-full rounded-md bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-none transition-colors hover:bg-blue-700 sm:text-sm"
        >
          {material.gated ? (
            <>
              <LockKeyhole className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
              Acessar material
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
              Baixar material
            </>
          )}
        </Button>

        {materialCount > 1 && onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="mt-2 flex min-h-9 w-full items-center justify-center px-2 text-xs font-semibold text-sky-200 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            Ver todos os {materialCount} materiais
          </button>
        )}
      </CardContent>
    </Card>
  );
}
