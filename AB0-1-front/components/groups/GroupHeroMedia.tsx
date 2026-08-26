'use client';

import * as React from 'react';
import Image from 'next/image';

import { PremiumBannerCarousel } from '@/components/PremiumBannerCarousel';

interface GroupHeroMediaProps {
  heroImages?: { id: number | string; url: string }[];
  groupName: string;
}

export function GroupHeroMedia({
  heroImages = [],
  groupName,
}: GroupHeroMediaProps) {
  /**
   * Premium responsive cover strategy
   *
   * Mobile / PWA:
   * - altura aproximada: 148–165px
   *
   * Tablet:
   * - ~170px
   *
   * Desktop:
   * - ~185–205px
   *
   * Evita o hero antigo de 300px+,
   * que ocupava espaço demais acima da dobra.
   */
  const heroAspectRatio =
    'aspect-[16/5.25] sm:aspect-[16/4.6] lg:aspect-[16/3.65]';

  const heroBaseClass = `
    relative
    w-full
    overflow-hidden
    rounded-[18px]
    border
    border-slate-200/80
    bg-white
    shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.05)]
  `;

  /**
   * Multiple cover images
   */
  if (heroImages.length > 1) {
    const carouselItems = heroImages.map((image, index) => (
      <div
        key={image.id}
        className="relative h-full w-full overflow-hidden bg-slate-100"
      >
        <Image
          src={image.url}
          alt={`Capa ${index + 1} de ${groupName}`}
          fill
          priority={index === 0}
          sizes="
            (max-width: 640px) 100vw,
            (max-width: 1024px) 100vw,
            (max-width: 1440px) 1200px,
            1320px
          "
          className="
            object-cover
            object-center
            transition-transform
            duration-500
            ease-out
          "
        />

        {/* Image readability overlay */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute inset-0
            bg-gradient-to-b
            from-black/[0.02]
            via-transparent
            to-slate-950/[0.08]
          "
        />
      </div>
    ));

    return (
      <PremiumBannerCarousel
        items={carouselItems}
        aspectRatio={heroAspectRatio}
        className="
          overflow-hidden
          rounded-[18px]
          border
          border-slate-200/80
          bg-white
          shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.05)]
        "
      />
    );
  }

  /**
   * Single cover
   */
  if (heroImages.length === 1) {
    return (
      <div className={`${heroBaseClass} ${heroAspectRatio}`}>
        <Image
          src={heroImages[0].url}
          alt={`Capa de ${groupName}`}
          fill
          priority
          sizes="
            (max-width: 640px) 100vw,
            (max-width: 1024px) 100vw,
            (max-width: 1440px) 1200px,
            1320px
          "
          className="
            object-cover
            object-center
            transition-transform
            duration-500
            ease-out
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute inset-0
            bg-gradient-to-b
            from-black/[0.02]
            via-transparent
            to-slate-950/[0.10]
          "
        />
      </div>
    );
  }

  /**
   * Branded fallback
   */
  return (
    <div
      className={`
        ${heroBaseClass}
        ${heroAspectRatio}
        flex
        items-center
        justify-center
        bg-[#07152f]
      `}
    >
      {/* Premium navy background */}
      <div
        aria-hidden="true"
        className="
          absolute inset-0
          bg-[radial-gradient(circle_at_78%_18%,rgba(37,99,235,0.18),transparent_28%),linear-gradient(115deg,#071326_0%,#0A2147_48%,#07142D_100%)]
        "
      />

      {/* Very subtle grid */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-0
          opacity-[0.035]
        "
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.95) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />

      {/* Brand origami */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -left-[5%]
          top-1/2
          hidden
          -translate-y-1/2
          select-none
          opacity-[0.09]
          sm:block
        "
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 340 340"
          className="
            h-[250px]
            w-[250px]
            lg:h-[300px]
            lg:w-[300px]
          "
        >
          <defs>
            <linearGradient
              id="groupSolarGold"
              x1="20"
              y1="45"
              x2="275"
              y2="230"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#FFE08A" />
              <stop offset="0.52" stopColor="#F6B91A" />
              <stop offset="1" stopColor="#F59E0B" />
            </linearGradient>

            <linearGradient
              id="groupSolarBlue"
              x1="145"
              y1="115"
              x2="275"
              y2="332"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#2563EB" />
              <stop offset="1" stopColor="#081326" />
            </linearGradient>
          </defs>

          <path
            d="M15 128 L313 5 L225 334 L174 181 Z"
            fill="url(#groupSolarGold)"
          />

          <path
            d="M15 128 L174 181 L141 126 Z"
            fill="#F59E0B"
          />

          <path
            d="M174 181 L225 334 L226 123 Z"
            fill="url(#groupSolarBlue)"
          />

          <path
            d="M141 126 L226 123 L174 181 Z"
            fill="#155EEF"
          />

          <path
            d="M174 181 L226 123 L210 177 L225 334 Z"
            fill="#0B2A4A"
          />

          <path
            d="M226 123 L313 5 L174 181 Z"
            fill="#F6B91A"
            opacity="0.72"
          />
        </svg>
      </div>

      {/* Center content */}
      <div
        className="
          relative z-10
          mx-auto
          max-w-[80%]
          select-none
          text-center
          sm:max-w-[70%]
        "
      >
        <p
          className="
            text-[9px]
            font-bold
            uppercase
            tracking-[0.22em]
            text-blue-200/55
            sm:text-[10px]
            lg:text-[11px]
          "
        >
          Comunidade oficial
        </p>

        <h3
          className="
            mt-1.5
            line-clamp-2
            text-base
            font-semibold
            tracking-[-0.015em]
            text-white/60
            sm:text-lg
            lg:text-xl
          "
        >
          {groupName}
        </h3>
      </div>

      {/* Lower tonal depth */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-x-0 bottom-0
          h-1/2
          bg-gradient-to-t
          from-black/10
          to-transparent
        "
      />
    </div>
  );
}