/**
 * LandingHero — Server Component
 *
 * Renderiza a imagem de fundo (elemento LCP) diretamente no HTML do servidor,
 * sem depender de hidratação JavaScript. Isso garante que o browser pode fazer
 * preload da imagem imediatamente, antes de qualquer JS ser baixado.
 *
 * O conteúdo interativo (Carousel, tracking, CTAs) é carregado via LandingHeroClient.
 */
import Image from 'next/image';
import dynamic from 'next/dynamic';

import type { Category } from '@/lib/api';
import type { HomeHeroTrustMetrics, HomeHeroVariant } from '@/lib/experiments/homeHeroExperiment';

// Importação dinâmica do componente client — hidratado de forma assíncrona
const LandingHeroClient = dynamic(() => import('./LandingHeroClient'), {
  ssr: true,
  loading: () => (
    <div className="container relative mx-auto px-4 z-10">
      <div className="h-[320px] md:h-[400px] animate-pulse" />
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
    <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-28 min-h-[500px] md:min-h-[600px] flex items-center">
      {/*
        Imagem de fundo — renderizada pelo servidor, presente no HTML inicial.
        O browser faz preload imediato graças a `priority` + `fetchPriority="high"`.
        Este é o elemento LCP da página.
      */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/banner-landing-page-avalia-solar.jpg"
          alt="Avalia Solar Background"
          fill
          priority
          fetchPriority="high"
          quality={85}
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-white/70 md:bg-white/60 backdrop-blur-[1px]" />
      </div>

      {/* Conteúdo interativo carregado como Client Component */}
      <LandingHeroClient {...props} />
    </section>
  );
}
