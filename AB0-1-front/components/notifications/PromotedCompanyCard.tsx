'use client';

import React, { useState } from 'react';
import { Check, MoreHorizontal, ExternalLink, Info, EyeOff, Flag } from 'lucide-react';
import { useBannersQuery } from '@/hooks/useBannersQuery';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const PromotedCompanyCard: React.FC = () => {
  const [hidden, setHidden] = useState(false);

  // Busca o banner lateral ativo configurado no Active Admin (slot_key / position: 'sidebar')
  const { data: banners, isLoading } = useBannersQuery({
    position: 'sidebar',
    limit: 1,
  });

  if (hidden) return null;

  const banner = banners && banners.length > 0 ? banners[0] : null;
  const bannerImage = banner?.image_url;
  const bannerTitle = banner?.title || 'WEG';
  const bannerLink = banner?.link_url || banner?.link || 'https://www.weg.net';

  return (
    <div className="bg-white border border-slate-200 p-5 rounded-none shadow-sm space-y-4 font-sans relative">
      {/* Header with PROMOVIDO Label & Menu */}
      <div className="flex items-center justify-between">
        <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-extrabold px-2 py-0.5 tracking-wider uppercase rounded-none">
          PROMOVIDO
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-700 rounded-none">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-none text-xs w-48 shadow-md">
            <DropdownMenuItem onClick={() => alert('Este anúncio é exibido com base no seu interesse em soluções solares.')}>
              <Info className="mr-2 h-3.5 w-3.5 text-slate-500" /> Por que estou vendo isto?
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setHidden(true)}>
              <EyeOff className="mr-2 h-3.5 w-3.5 text-slate-500" /> Ocultar este anúncio
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => alert('Obrigado pelo seu feedback.')}>
              <Flag className="mr-2 h-3.5 w-3.5 text-slate-500" /> Reportar anúncio
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dynamic Active Admin Banner Image or Styled Card */}
      {bannerImage ? (
        <a
          href={bannerLink}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className="block group relative overflow-hidden border border-slate-200"
        >
          <img
            src={bannerImage}
            alt={bannerTitle}
            className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </a>
      ) : (
        <>
          {/* Fallback to Styled Card Layout */}
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center bg-blue-900 text-white font-extrabold text-sm border border-blue-950 shrink-0">
              WEG
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{bannerTitle}</h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                Soluções completas em energia solar para residências, comércios e indústrias.
              </p>
            </div>
          </div>

          {/* Differentials Check List */}
          <ul className="space-y-1.5 text-xs text-slate-700">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-blue-600 shrink-0" />
              <span>Inversores de alta performance</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-blue-600 shrink-0" />
              <span>Tecnologia brasileira</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-blue-600 shrink-0" />
              <span>Suporte técnico especializado</span>
            </li>
          </ul>
        </>
      )}

      {/* Sponsored CTA Link */}
      <a
        href={bannerLink}
        target="_blank"
        rel="sponsored noopener noreferrer"
        className="inline-flex items-center justify-center w-full py-2 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 transition-colors uppercase tracking-wider rounded-none gap-1.5"
      >
        Conhecer a empresa
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
};
