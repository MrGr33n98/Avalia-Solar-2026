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
    <section className="relative overflow-hidden border-b border-slate-200 bg-transparent py-9 sm:py-11 lg:py-12">
      <div className="relative z-10 mx-auto w-full max-w-[1180px] px-4 sm:px-5 lg:px-6">
        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="flex w-full min-w-0 flex-col items-start text-left lg:col-span-8">
            <LandingHeroClient {...props} />
          </div>

          <div className="relative hidden h-[340px] w-full overflow-hidden rounded-lg border border-slate-200 bg-white lg:col-span-4 lg:block">
            <Image
              src="/images/lp-avalia-solar-image.webp"
              alt="Casa inteligente sustentável com carro elétrico e energia solar"
              fill
              priority
              quality={90}
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 p-4 shadow-none backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
                Escolha com evidências
              </p>
              <p className="mt-1 text-sm font-medium leading-snug text-slate-800">
                Compare reputação, cobertura e qualidade antes de pedir propostas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
