'use client';

import React from 'react';
import { Download, FileText, LockKeyhole } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Material } from './MaterialsLibrary';
import Image from 'next/image';

interface MaterialLeadMagnetCardProps {
  material: Material;
  onDownload: () => void;
}

export default function MaterialLeadMagnetCard({
  material,
  onDownload,
}: MaterialLeadMagnetCardProps) {
  return (
    <Card className="overflow-hidden border border-blue-900/30 bg-[#0B1528] text-white shadow-lg rounded-2xl">
      {material.cover_url ? (
        <div className="relative w-full h-40 bg-slate-950">
          <Image
            src={material.cover_url}
            alt={material.title}
            fill
            className="object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1528] to-transparent" />
        </div>
      ) : (
        <div className="relative w-full h-32 bg-slate-900 flex items-center justify-center border-b border-slate-800">
          <FileText className="h-12 w-12 text-blue-500 opacity-60" />
        </div>
      )}
      <CardContent className="p-5 space-y-4">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
            Material Destacado
          </span>
          <h4 className="font-extrabold text-sm sm:text-base text-white leading-tight line-clamp-2">
            {material.title}
          </h4>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
          {material.description || 'Baixe gratuitamente este material técnico disponibilizado pela empresa.'}
        </p>

        <Button
          onClick={onDownload}
          className="w-full min-h-11 h-auto py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl shadow-md transition-all duration-200"
        >
          {material.gated ? (
            <>
              <LockKeyhole className="mr-2 h-4 w-4" />
              Acessar Grátis
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Baixar Grátis
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
