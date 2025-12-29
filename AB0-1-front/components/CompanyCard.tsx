'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, MessageCircle, Building2 } from 'lucide-react';

// UI Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// Libs & Utils
import { Company } from '@/lib/api';
import { getFullImageUrl } from '@/utils/image';
import { buildCompanyPath, buildCompanySubPath } from '@/lib/slug';
import { openQuoteWizard } from '@/lib/quote-wizard';
import WhatsappButton from '@/components/WhatsappButton';

// Tipagem Estendida
interface ExtendedCompany extends Company {
  cta_whatsapp_url?: string;
  whatsapp_url?: string;
  whatsapp_enabled?: boolean;
  effect?: boolean;
}

interface Props {
  company: Company;
  className?: string;
  compact?: boolean;
  lang?: 'pt-BR' | 'en-US' | 'es-ES';
  isLoading?: boolean;
  avatarRingColor?: string;
  schemaEnabled?: boolean;
  onAnalyticsEvent?: (event: { type: string; companyId: number; meta?: Record<string, any> }) => void;
}

// Dicionário de Textos
const DICTIONARY = {
  'pt-BR': { whatsapp: 'WhatsApp', budget: 'Orçamento', review: 'Avaliar', verified: 'Verificada', reviews: 'avaliações' },
  'en-US': { whatsapp: 'WhatsApp', budget: 'Get Quote', review: 'Review', verified: 'Verified', reviews: 'reviews' },
  'es-ES': { whatsapp: 'WhatsApp', budget: 'Presupuesto', review: 'Evaluar', verified: 'Verificada', reviews: 'evaluaciones' },
} as const;

// Helper de Classes
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

export default function CompanyCard({
  company: rawCompany,
  className = '',
  compact = false,
  lang = 'pt-BR',
  isLoading = false,
  avatarRingColor = '#ffffff',
  schemaEnabled = true,
  onAnalyticsEvent,
}: Props) {
  const company = rawCompany as ExtendedCompany;
  const { id, name, city, state, description, rating_count, average_rating, category_name, website } = company;

  const [bannerError, setBannerError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Dados Calculados
  const rating = average_rating?.toFixed(1) ?? '0.0';
  const totalReviews = rating_count || 0;
  const companyPath = buildCompanyPath(id, name);
  const companyReviewPath = buildCompanySubPath(id, name, 'review');
  const bannerUrl = getFullImageUrl(company.banner_url || undefined);
  const logoUrl = getFullImageUrl(company.logo_url || undefined);

  // Lógica WhatsApp
  const whatsappLinkRaw = company.cta_whatsapp_url || company.whatsapp_url || company.whatsapp;
  const hasWhatsapp = Boolean(whatsappLinkRaw);
  const whatsappEnabled = company.whatsapp_enabled !== false;

  const text = DICTIONARY[lang] || DICTIONARY['pt-BR'];

  // SEO
  const jsonLd = useMemo(() => {
    if (!schemaEnabled || typeof window === 'undefined') return null;
    const url = window.location.origin + companyPath;
    const sameAs = website ? [website] : undefined;
    const aggregateRating = totalReviews > 0 
      ? { '@type': 'AggregateRating', ratingValue: parseFloat(rating), reviewCount: totalReviews } 
      : undefined;

    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name,
      url,
      logo: logoUrl || undefined,
      address: { '@type': 'PostalAddress', addressLocality: city || undefined, addressRegion: state || undefined },
      aggregateRating,
      sameAs,
    };
  }, [schemaEnabled, name, city, state, rating, totalReviews, logoUrl, website, companyPath]);

  // Analytics
  const emit = useCallback((type: string, meta?: Record<string, any>) => {
      if (onAnalyticsEvent) onAnalyticsEvent({ type, companyId: id, meta });
  }, [onAnalyticsEvent, id]);

  useEffect(() => { emit('view'); }, [emit]);

  // Formatadores
  const formatPhone = (phone?: string) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    return digits.length < 10 ? phone : `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  // --- SKELETON LOADING ---
  if (isLoading) {
    return (
      <div className={cn('h-full flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden', className)}>
        <Skeleton className="w-full h-32 sm:h-36" />
        <div className="px-5 pb-5 flex flex-col flex-1">
          <div className="relative -mt-10 mb-3">
            <Skeleton className="rounded-full w-20 h-20 border-4 border-white shadow-sm" />
          </div>
          <Skeleton className="h-6 w-3/4 mb-3" />
          <div className="flex gap-2 mb-4">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3 mb-6" />
          <div className="mt-auto grid grid-cols-1 gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        // Base
        'relative flex flex-col bg-white h-full',
        'rounded-2xl border border-gray-200 shadow-sm',
        // Hover Desktop
        'md:transition-all md:duration-300 md:ease-out',
        'md:hover:shadow-xl md:hover:-translate-y-1 md:hover:border-blue-100',
        // Mobile Touch Optimization
        'active:scale-[0.99] transition-transform duration-100', // Feedback tátil ao tocar no mobile
        company.effect ? 'ring-2 ring-blue-400 ring-offset-2' : '',
        className
      )}
      data-keywords={[name, city, state, category_name].filter(Boolean).join(', ')}
    >
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}

      {/* --- 1. Header: Banner & Avatar --- */}
      <div className="relative group/header">
        <Link
          href={companyPath}
          className={cn(
            'block relative w-full overflow-hidden rounded-t-2xl bg-gray-100',
            // Altura do banner aumentada no mobile para dar respiro
            'h-32 sm:h-36 md:h-40'
          )}
          onClick={() => emit('card_click')}
          aria-label={`Ver ${name}`}
        >
          {bannerUrl && !bannerError ? (
            <Image
              src={bannerUrl}
              alt={`Banner ${name}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={cn(
                'object-cover transition-transform duration-700',
                compact ? 'object-contain p-4 bg-white' : '',
                'md:group-hover/header:scale-105'
              )}
              onError={() => setBannerError(true)}
              priority={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
              <Building2 className="text-blue-200 w-12 h-12" />
            </div>
          )}
          {/* Overlay sutil apenas no desktop para texto branco se necessário, aqui removido para clean look */}
        </Link>

        {/* Avatar Container: Flutuando entre o banner e o conteúdo */}
        <div className="absolute -bottom-8 left-4 sm:left-5 z-10 pointer-events-none">
          <div
            className={cn(
              'relative rounded-full bg-white p-0.5', // P-0.5 cria uma borda branca limpa
              'w-20 h-20 sm:w-20 sm:h-20', // Tamanho fixo e generoso para mobile
              'shadow-md'
            )}
            style={{ 
              boxShadow: `0 0 0 2px ${avatarRingColor}, 0 4px 6px -1px rgba(0,0,0,0.1)` 
            }}
          >
            <div className="relative w-full h-full rounded-full overflow-hidden bg-white">
              {logoUrl && !logoError ? (
                <Image
                  src={logoUrl}
                  alt={`Logo ${name}`}
                  fill
                  sizes="80px"
                  className="object-contain p-1"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <Building2 className="text-gray-300 w-8 h-8" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- 2. Conteúdo --- */}
      <div className="flex flex-col flex-1 px-4 sm:px-5 pb-5">
        
        {/* Espaçador superior para compensar o Avatar negativo */}
        <div className="pt-12 sm:pt-14 flex justify-between items-start mb-2">
          
          {/* Coluna Esquerda: Título */}
          <div className="flex-1 min-w-0 mr-2">
            <Link 
              href={companyPath} 
              className="block"
              onClick={() => emit('title_click')}
            >
              <h3 className="text-lg font-bold text-gray-900 leading-snug truncate pr-2 hover:text-blue-600 transition-colors">
                {name}
              </h3>
            </Link>
            
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {company.verified && (
                <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-800 border-emerald-200 px-1.5 py-0 rounded-md font-semibold">
                  {text.verified}
                </Badge>
              )}
               {category_name && (
                <span className="text-[11px] text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full truncate max-w-[140px]">
                  {category_name}
                </span>
              )}
            </div>
          </div>

          {/* Coluna Direita: Rating */}
          <div className="shrink-0 flex flex-col items-end">
             {parseFloat(rating) > 0 && (
               <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md border border-amber-100/50">
                 <span className="text-sm font-bold text-amber-700">{rating}</span>
                 <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
               </div>
             )}
             <span className="text-[10px] text-gray-400 mt-1">
               {totalReviews > 0 ? `${totalReviews} ${text.reviews}` : 'Novo'}
             </span>
          </div>
        </div>

        {/* Localização */}
        {(city || state) && (
          <div className="flex items-center text-xs text-gray-500 mb-3">
            <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400 shrink-0" />
            <span className="truncate max-w-full">
              {city}{city && state ? ', ' : ''}{state}
            </span>
          </div>
        )}

        {/* Descrição */}
        <div className="mb-5 flex-1">
          <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
            {description || <span className="text-gray-400 italic font-light">Visite o perfil para saber mais sobre nossos serviços.</span>}
          </p>
        </div>

        {/* Divisor */}
        <div className="h-px bg-gray-100 w-full mb-4" />

        {/* --- 3. Ações (UX Mobile Refinado) --- */}
        <div className="mt-auto grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-2 print:hidden">
          
          {/* Botão Primário (WhatsApp ou Orçamento) */}
          {hasWhatsapp && whatsappEnabled ? (
            <div className="w-full">
              <WhatsappButton
                enabled
                href={whatsappLinkRaw}
                label={text.whatsapp}
                className="w-full h-10 shadow-sm font-medium"
                onClick={() => emit('cta_whatsapp_click')}
              />
            </div>
          ) : (
            <Button
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium"
              onClick={() => openQuoteWizard({ preferredCompanyId: id, source: 'company-card' })}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {text.budget}
            </Button>
          )}

          {/* Botão Secundário (Avaliar) */}
          <Button
            variant="outline"
            className="w-full h-10 border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium"
            asChild
          >
            <Link href={companyReviewPath} onClick={() => emit('cta_review_click')}>
              <Star className="w-4 h-4 mr-2 text-gray-400 group-hover:text-amber-500 transition-colors" />
              {text.review}
            </Link>
          </Button>
        </div>

        {/* Área de Impressão (Oculta na tela) */}
        <div className="hidden print:block mt-4 pt-2 border-t border-gray-300 text-xs">
          <div className="grid grid-cols-2 gap-2">
            {company.whatsapp && <div>Tel: {formatPhone(company.whatsapp)}</div>}
            {company.email && <div>Email: {company.email}</div>}
            {website && <div className="col-span-2">{website.replace(/^https?:\/\//, '')}</div>}
          </div>
        </div>

      </div>
    </div>
  );
}
