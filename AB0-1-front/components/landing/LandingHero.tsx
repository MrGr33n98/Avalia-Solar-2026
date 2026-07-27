/**
 * LandingHero — Server Component
 *
 * Renderiza o background decorativo e a imagem de painéis solares (LCP) diretamente
 * no HTML do servidor, sem depender de hidratação JavaScript.
 *
 * Hierarquia visual (z-index):
 *   z-0  → HeroBackground (gradientes CSS + SVG decorativo)
 *   z-[1] → Imagem dos painéis solares (desktop)
 *   z-10 → Conteúdo textual + formulário de busca
 */
import Image from 'next/image';
import dynamic from 'next/dynamic';

import type { Category } from '@/lib/api';
import type { HomeHeroTrustMetrics, HomeHeroVariant } from '@/lib/experiments/homeHeroExperiment';
import { HeroBackground } from './HeroBackground';

// Importação dinâmica do componente client — hidratado de forma assíncrona
const LandingHeroClient = dynamic(() => import('./LandingHeroClient'), {
  ssr: true,
  loading: () => (
    <div className="relative z-10 mx-auto w-full max-w-[1180px] px-4 sm:px-5 lg:px-6">
      <div className="h-[280px] animate-pulse md:h-[340px]" />
    </div>
  ),
});

interface BannerData {
  id: number | string;
  image_url?: string | null;
  title?: string;
  link?: string | null;
  link_url?: string | null;
  sponsored?: boolean;
}

type LandingHeroProps = {
  categories?: Category[];
  banners?: BannerData[];
  variant?: HomeHeroVariant;
  experimentId?: string;
  experimentEnabled?: boolean;
  trustMetrics?: HomeHeroTrustMetrics;
};

export default function LandingHero(props: LandingHeroProps) {
  return (
    <section className="relative isolate overflow-hidden border-b border-slate-200 py-9 sm:py-11 lg:py-14">
      {/* ── Fundo decorativo: gradientes CSS + sol + SVG geométrico ── */}
      <HeroBackground />

      {/*
       * ── Painel Solar — desktop only ──
       * Posicionado na metade direita do hero, acima do background (z-[1])
       * mas abaixo do conteúdo textual (z-10).
       * LCP candidate no desktop: priority={true}.
       */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-[max(0px,calc((100vw-1320px)/2))] hidden h-full w-[50%] lg:block"
        style={{ zIndex: 1 }}
      >
        <Image
          src="/images/lp-avalia-solar-image.webp"
          alt=""
          fill
          priority
          quality={88}
          className="object-contain object-right-bottom"
          sizes="(max-width: 1023px) 0vw, 50vw"
        />
        {/* Gradiente de fade — faz o painel se fundir ao fundo à esquerda */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, #f8fbff 0%, rgba(248,251,255,0.4) 30%, transparent 65%)',
          }}
        />
      </div>

      {/* ── Conteúdo principal: título + formulário ── */}
      <div className="relative z-10 mx-auto w-full max-w-[1320px] px-5 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Coluna de conteúdo — 7 colunas no desktop para dar mais respiro */}
          <div className="flex w-full min-w-0 flex-col items-start text-left lg:col-span-7">
            <LandingHeroClient {...props} />
          </div>

          {/*
           * Coluna direita — vazia no markup (imagem é absolute).
           * Mantém o espaço reservado para o layout grid funcionar
           * sem empurrar o conteúdo para o centro.
           */}
          <div className="hidden lg:col-span-5 lg:block" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
