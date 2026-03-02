'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Zap, ExternalLink, ArrowRight } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

import type { Category } from '@/lib/api';
import { LandingHeroSearch } from '@/components/landing/LandingHeroSearch';
import { getFullImageUrl } from '@/utils/image';

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
};

const FALLBACK_BANNER_SRC = '/images/banner-placeholder.svg';

export default function LandingHero({ categories = [], banners = [] }: LandingHeroProps) {
  // Normaliza banners
  const validBanners = banners.map(b => ({
    ...b,
    image_url: b.image_url ? getFullImageUrl(b.image_url) : FALLBACK_BANNER_SRC
  })).filter(b => b.image_url);

  return (
    <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-28 min-h-[500px] md:min-h-[600px] flex items-center">
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

      <div className="container relative mx-auto px-4 z-10">
        <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-12 lg:items-center">
          
          {/* Left Column: Content & Search */}
          <div className="lg:col-span-7 xl:col-span-7 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue/5 text-brand-blue text-sm font-bold mb-6">
              <Zap className="w-4 h-4 fill-brand-blue" />
              +1.500 Empresas Verificadas
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight mb-6">
              Encontre as melhores empresas de <span className="text-brand-blue">energia solar e mobilidade elétrica</span> perto de você.
            </h1>

            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto lg:mx-0">
              Compare orçamentos, avaliações reais e instale solar, baterias ou carregadores veiculares com segurança.
            </p>

            <div className="max-w-3xl mx-auto lg:mx-0">
              <LandingHeroSearch categories={categories} />
            </div>

            <div className="mt-8 flex flex-wrap justify-center lg:justify-start items-center gap-6 md:gap-10 opacity-70">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium text-slate-600">Empresas Verificadas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium text-slate-600">Orçamentos Gratuitos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium text-slate-600">Suporte Especializado</span>
              </div>
            </div>
          </div>

          {/* Right Column: Spotlight Card */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-5">
            {validBanners.length > 0 ? (
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-white/40 backdrop-blur-xl border border-white/40 p-3 rounded-[32px] shadow-2xl overflow-hidden">
                  <div className="mb-3 flex items-center justify-between px-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                      Parceiro em Destaque
                    </span>
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>

                  <Carousel
                    plugins={[Autoplay({ delay: 6000, stopOnInteraction: true })]}
                    opts={{ loop: true }}
                    className="w-full"
                  >
                    <CarouselContent>
                      {validBanners.map((banner, idx) => (
                        <CarouselItem key={banner.id || idx}>
                          <Link 
                            href={banner.link_url || banner.link || '#'} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="group/card block relative w-full aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100 shadow-inner"
                          >
                            <Image
                              src={banner.image_url!}
                              alt={banner.title || 'Destaque'}
                              fill
                              sizes="420px"
                              className="object-cover object-center transition-transform duration-700 group-hover/card:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                            
                            <div className="absolute bottom-5 left-5 right-5">
                                <h3 className="text-white font-black text-xl leading-tight mb-2 drop-shadow-lg">
                                    {banner.title || 'Visitar Especialista'}
                                </h3>
                                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md px-4 py-2 text-xs font-bold text-white transition-colors group-hover/card:bg-blue-600">
                                    Conhecer parceiro
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </div>
                            </div>
                          </Link>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                </div>
              </div>
            ) : (
              /* Fallback spotlight (ex: Trust Badge or special category) */
              <div className="relative bg-white/30 backdrop-blur-lg border border-white/40 p-8 rounded-[40px] shadow-2xl flex flex-col items-center text-center">
                 <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-blue-500/30">
                    <Zap className="w-10 h-10 text-white fill-white" />
                 </div>
                 <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">
                   Sua empresa aqui no topo?
                 </h3>
                 <p className="text-slate-600 mb-8 font-medium">
                   Seja visto por milhares de clientes que buscam energia solar e mobilidade todos os dias.
                 </p>
                 <Link 
                   href="/contact" 
                   className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                 >
                   Anunciar agora
                 </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
