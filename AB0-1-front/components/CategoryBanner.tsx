'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

import { Category } from '@/lib/api';
import { getFullImageUrl } from '@/utils/image';
import { Button } from '@/components/ui/button';
import { Building2, Package } from 'lucide-react'; // Sugestão: adicione ícones simples

const MotionDiv = motion.div;

interface CategoryBannerProps {
  category: Category;
  companiesCount?: number;
  productsCount?: number;
  height?: string;
  onQuoteClick?: () => void;
}

export default function CategoryBanner({
  category,
  companiesCount = 0,
  productsCount = 0,
  height = 'h-48 sm:h-56 md:h-64', // Aumentei um pouco a altura para melhor respiro
  onQuoteClick,
}: CategoryBannerProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const bannerUrl = useMemo(() => {
    return (
      getFullImageUrl((category as any)?.banner_url) ||
      getFullImageUrl((category as any)?.image_url) ||
      ''
    );
  }, [(category as any)?.banner_url, (category as any)?.image_url]);

  const hasImage = typeof bannerUrl === 'string' && bannerUrl.trim().length > 0 && !imageError;

  const subtitle = (category as any)?.short_description || (category as any)?.description || '';

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={[
        'relative mx-auto w-full max-w-[1180px] overflow-hidden rounded-3xl',
        'bg-slate-900 shadow-xl', // Fundo escuro para caso a imagem falhe
        height,
      ].join(' ')}
    >
      {/* IMAGEM DE FUNDO COM EFEITO */}
      {hasImage && (
        <Image
          src={bannerUrl}
          alt={`${category.name} Banner`}
          fill
          priority
          className={[
            'object-cover object-center transition-all duration-1000 ease-out',
            imageLoaded ? 'scale-100 opacity-70' : 'scale-110 opacity-0',
          ].join(' ')}
          onError={() => setImageError(true)}
          onLoad={() => setImageLoaded(true)}
        />
      )}

      {/* OVERLAY DE GRADIENTE (Essencial para UX) */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />

      {/* CONTEÚDO */}
      <div className="relative z-20 flex h-full flex-col justify-center px-6 sm:px-12 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight drop-shadow-md">
            {category.name}
          </h1>

          {subtitle && (
            <p className="mt-2 text-sm sm:text-base text-gray-100 line-clamp-2 max-w-md font-medium drop-shadow-sm">
              {subtitle}
            </p>
          )}

          {/* BADGES DE STATUS */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-white/90">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
              <Building2 size={14} className="text-emerald-400" />
              <span>{companiesCount} empresas</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
              <Package size={14} className="text-emerald-400" />
              <span>{productsCount} produtos</span>
            </div>
          </div>

          {/* BOTÃO DE AÇÃO */}
          {onQuoteClick && (
            <div className="mt-6">
              <Button
                onClick={onQuoteClick}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-6 rounded-xl transition-transform active:scale-95 shadow-lg shadow-emerald-500/20"
              >
                Solicitar Orçamento Grátis
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </MotionDiv>
  );
}