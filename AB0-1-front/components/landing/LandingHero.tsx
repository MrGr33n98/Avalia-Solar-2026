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
    <section className="relative overflow-hidden bg-gradient-to-b from-[#EFF6FF] via-[#F8FAFC] to-white border-b border-brand-borderSoft pt-12 pb-16 lg:pt-20 lg:pb-28 min-h-[500px] md:min-h-[600px] flex items-center">
      {/* Grid sutil de fundo técnico */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.06] z-0 pointer-events-none" />

      <div className="container relative mx-auto px-4 md:px-8 lg:px-12 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Coluna Esquerda: Textos e Busca */}
          <div className="lg:col-span-7 flex flex-col items-start text-left w-full">
            <LandingHeroClient {...props} />
          </div>

          {/* Coluna Direita: Imagem de Casa Sustentável */}
          <div className="lg:col-span-5 hidden lg:block relative h-[450px] w-full rounded-2xl overflow-hidden border border-brand-border shadow-soft">
            <Image
              src="/images/lp-avalia-solar-image.png"
              alt="Casa inteligente sustentável com carro elétrico e energia solar"
              fill
              priority
              quality={90}
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
