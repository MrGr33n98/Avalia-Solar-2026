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
    <section className="relative overflow-hidden border-b border-slate-200 bg-transparent pb-8 pt-7 sm:py-16 lg:py-20">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 18%, rgba(37,99,235,.06), transparent 30%), radial-gradient(circle at 82% 12%, rgba(245,158,11,.04), transparent 25%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14 xl:gap-16">
          <div className="flex w-full flex-col items-start text-left lg:col-span-6">
            <LandingHeroClient {...props} />
          </div>

          <div className="relative hidden h-[500px] w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_24px_60px_-40px_rgba(15,23,42,.42)] lg:col-span-6 lg:block">
            <Image
              src="/images/lp-avalia-solar-image.webp"
              alt="Casa inteligente sustentável com carro elétrico e energia solar"
              fill
              priority
              quality={90}
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 p-5 shadow-none backdrop-blur-md">
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
