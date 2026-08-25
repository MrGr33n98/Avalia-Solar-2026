'use client';

import * as React from 'react';
import Image from 'next/image';
import { PremiumBannerCarousel } from '@/components/PremiumBannerCarousel';

interface GroupHeroMediaProps {
  heroImages?: { id: number | string; url: string }[];
  groupName: string;
}

export function GroupHeroMedia({ heroImages = [], groupName }: GroupHeroMediaProps) {
  // If there are multiple hero images, render the PremiumBannerCarousel
  if (heroImages.length > 1) {
    const carouselItems = heroImages.map((image, idx) => (
      <div key={image.id} className="relative h-full w-full">
        <Image
          src={image.url}
          alt={`Capa ${idx + 1} de ${groupName}`}
          fill
          priority={idx === 0}
          sizes="(max-width: 1280px) 100vw, 1280px"
          className="object-cover"
        />
      </div>
    ));

    return (
      <PremiumBannerCarousel
        items={carouselItems}
        aspectRatio="aspect-[16/5] min-h-[220px] md:min-h-[320px]"
        className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm"
      />
    );
  }

  // If there is exactly one hero image, render it directly
  if (heroImages.length === 1) {
    return (
      <div className="relative w-full aspect-[16/5] min-h-[200px] md:min-h-[300px] overflow-hidden rounded-xl border border-slate-200/60 shadow-sm">
        <Image
          src={heroImages[0].url}
          alt={`Capa de ${groupName}`}
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 1280px"
          className="object-cover"
        />
      </div>
    );
  }

  // Fallback: Deep navy geometric backdrop
  return (
    <div className="relative w-full aspect-[16/5] min-h-[200px] md:min-h-[300px] overflow-hidden rounded-xl bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 border border-slate-200/10 shadow-inner flex items-center justify-center">
      {/* Decorative Brand SVG background */}
      <div className="absolute inset-0 opacity-[0.06] select-none pointer-events-none flex items-center justify-center overflow-hidden">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1500 345" className="w-[120%] h-auto rotate-[-8deg] scale-110">
          <defs>
            <linearGradient id="solarA" x1="20" y1="45" x2="275" y2="230" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#FFE08A"/>
              <stop offset="0.52" stopColor="#F6B91A"/>
              <stop offset="1" stopColor="#F59E0B"/>
            </linearGradient>
            <linearGradient id="blueA" x1="145" y1="115" x2="275" y2="332" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#2563EB"/>
              <stop offset="1" stopColor="#081326"/>
            </linearGradient>
          </defs>
          <g transform="translate(18 6)">
            <path d="M15 128 L313 5 L225 334 L174 181 Z" fill="url(#solarA)"/>
            <path d="M15 128 L174 181 L141 126 Z" fill="#F59E0B"/>
            <path d="M174 181 L225 334 L226 123 Z" fill="url(#blueA)"/>
            <path d="M141 126 L226 123 L174 181 Z" fill="#155EEF"/>
            <path d="M174 181 L226 123 L210 177 L225 334 Z" fill="#0B2A4A"/>
            <path d="M226 123 L313 5 L174 181 Z" fill="#F6B91A" opacity="0.72"/>
          </g>
        </svg>
      </div>

      {/* Grid Overlay for texture */}
      <div 
        className="absolute inset-0 opacity-[0.03] select-none pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Subtle branding hint */}
      <div className="z-10 text-center select-none opacity-40">
        <p className="text-xs tracking-[0.2em] font-semibold text-slate-400 uppercase">Comunidade Oficial</p>
        <h3 className="text-lg md:text-2xl font-bold text-white mt-1 tracking-tight">{groupName}</h3>
      </div>
    </div>
  );
}
