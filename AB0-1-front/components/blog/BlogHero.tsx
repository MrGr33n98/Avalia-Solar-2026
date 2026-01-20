'use client';

import * as React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { openQuoteWizard } from '@/lib/quote-wizard';
import { ImageOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BannerImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: 'video' | 'wide' | 'square';
}

const BannerImage = ({ src, alt, className, aspectRatio = 'video' }: BannerImageProps) => {
  const [status, setStatus] = React.useState<'loading' | 'error' | 'success'>('loading');

  return (
    <div className={cn(
      "relative w-full overflow-hidden bg-slate-800/50 rounded-lg",
      aspectRatio === 'video' && "aspect-video",
      aspectRatio === 'wide' && "aspect-[21/9]",
      aspectRatio === 'square' && "aspect-square",
      className
    )}>
      {/* Background fallback */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-30" />
      
      {/* Loading State */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      {/* Error State / Fallback */}
      {status === 'error' ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-4 bg-slate-800">
          <ImageOff className="w-10 h-10 mb-2 opacity-50" />
          <span className="text-xs font-medium">Imagem indisponível</span>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          className={cn(
            "object-contain transition-opacity duration-500",
            status === 'loading' ? 'opacity-0' : 'opacity-100'
          )}
          onLoad={() => setStatus('success')}
          onError={() => setStatus('error')}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          loading="lazy"
        />
      )}
    </div>
  );
};

export function BlogHero() {
  return (
    <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden rounded-2xl mx-4 lg:mx-0 shadow-2xl">
      <div className="absolute inset-0 bg-[url('/images/hero-pattern.svg')] opacity-10" />
      <div className="container relative mx-auto px-6 py-8 md:py-12 lg:px-12 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1 space-y-4 text-center md:text-left z-10">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Bem-vindo ao <br />
            <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-green-400">
              Blog Avalia Solar
            </span>
          </h1>
          <p className="text-base md:text-lg text-slate-300 max-w-xl mx-auto md:mx-0 leading-relaxed">
            Dicas, guias e novidades para você economizar com energia solar e transformar sua casa ou empresa.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
            <Button 
              size="default" 
              className="font-bold text-base px-6 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
              onClick={() => openQuoteWizard({ source: 'blog_hero' })}
            >
              Simular Economia
            </Button>
            <Button 
              variant="outline" 
              size="default" 
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm px-6"
            >
              Nossos Guias
            </Button>
          </div>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-4 text-xs sm:text-sm text-slate-400 font-medium">
            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              +1.200 empresas
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Guias gratuitos
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Cidades atendidas
            </span>
          </div>
        </div>
        
        <div className="flex-1 relative w-full max-w-md md:max-w-none flex justify-center md:justify-end">
          <div className="w-full max-w-[500px] max-h-[250px]">
             <BannerImage 
               src="/images/banner-avalia-solar.png" 
               alt="Energia Solar Ilustração"
               aspectRatio="wide"
               className="h-full"
             />
          </div>
        </div>
      </div>
    </div>
  );
}
