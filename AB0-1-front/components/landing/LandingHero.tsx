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
    <section 
      className="relative overflow-hidden border-b border-brand-borderSoft pt-12 pb-16 lg:pt-20 lg:pb-28 min-h-[500px] md:min-h-[600px] flex items-center"
      style={{ background: 'linear-gradient(180deg, #EFF6FF 0%, #F8FAFC 45%, #F8FAFC 100%)' }}
    >
      {/* 1. Grid pontilhado técnico quase invisível */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.05] z-0"
        style={{
          backgroundImage: 'radial-gradient(#0F172A 1.2px, transparent 1.2px)',
          backgroundSize: '32px 32px'
        }}
      />

      {/* 2. Elementos Abstratos Técnicos (Linhas finas, circuitos e conexões) */}
      <svg 
        viewBox="0 0 1000 1000" 
        preserveAspectRatio="none" 
        className="absolute inset-0 w-full h-full pointer-events-none z-0" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Linhas diagonais técnicas */}
        <line x1="80" y1="150" x2="250" y2="320" stroke="#2563EB" strokeWidth="1" strokeDasharray="3 3" opacity="0.06" />
        <line x1="850" y1="120" x2="980" y2="350" stroke="#2563EB" strokeWidth="1" opacity="0.05" />
        
        {/* Traço conectando com um ponto (circuito sutil) */}
        <path d="M 520 180 L 580 180 L 620 240" fill="none" stroke="#2563EB" strokeWidth="1" opacity="0.06" />
        <circle cx="520" cy="180" r="3" fill="#2563EB" opacity="0.08" />
        <circle cx="620" cy="240" r="3" fill="#2563EB" opacity="0.08" />

        {/* Detalhe verde de apoio sutil */}
        <path d="M 400 820 L 430 850 L 500 850" fill="none" stroke="#10B981" strokeWidth="1" opacity="0.05" />
        <circle cx="500" cy="850" r="2.5" fill="#10B981" opacity="0.06" />

        {/* Detalhe geométrico angular (navy técnico) */}
        <rect x="40" y="550" width="10" height="10" rx="1.5" fill="none" stroke="#0F172A" strokeWidth="1" opacity="0.04" />
        <line x1="40" y1="600" x2="140" y2="600" stroke="#0F172A" strokeWidth="1" opacity="0.04" />
      </svg>

      {/* 3. Halo suave de luz e círculo vazado grande ao redor da imagem principal */}
      <div className="absolute right-[5%] top-1/2 -translate-y-1/2 w-[550px] h-[550px] pointer-events-none z-0 hidden lg:block">
        {/* Círculo vazado grande */}
        <div className="absolute inset-0 rounded-full border border-blue-500/[0.06] scale-95" />
        <div className="absolute inset-10 rounded-full border border-blue-500/[0.03] scale-90 border-dashed" />
        {/* Halo de luz suave azul */}
        <div className="absolute inset-20 rounded-full bg-gradient-to-tr from-blue-400/8 to-indigo-400/4 blur-3xl opacity-50" />
      </div>

      <div className="container relative mx-auto px-4 md:px-8 lg:px-12 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Coluna Esquerda: Textos e Busca */}
          <div className="lg:col-span-7 flex flex-col items-start text-left w-full">
            <LandingHeroClient {...props} />
          </div>

          {/* Coluna Direita: Imagem de Casa Sustentável */}
          <div className="lg:col-span-5 hidden lg:block relative h-[450px] w-full rounded-[8px] overflow-hidden border border-brand-border shadow-soft">
            <Image
              src="/images/lp-avalia-solar-image.webp"
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
