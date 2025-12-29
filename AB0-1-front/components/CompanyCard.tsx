'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, MessageCircle, Building2 } from 'lucide-react';

// Importando o CSS Module (ESSENCIAL PARA A REDUÇÃO FUNCIONAR)
import styles from './CompanyCard.module.css';

// UI Components
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Libs & Utils
import { Company } from '@/lib/api';
import { getFullImageUrl } from '@/utils/image';
import { buildCompanyPath, buildCompanySubPath } from '@/lib/slug';
import { openQuoteWizard } from '@/lib/quote-wizard';
import WhatsappButton from '@/components/WhatsappButton';
import { cn } from '@/lib/utils'; // Certifique-se que o caminho do utils está correto

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

export default function CompanyCard({
  company: rawCompany,
  className = '',
  compact = false,
  lang = 'pt-BR',
  isLoading = false,
  schemaEnabled = true,
  onAnalyticsEvent,
}: Props) {
  const company = rawCompany as ExtendedCompany;
  const { id, name, city, state, description, rating_count, average_rating, category_name, website } = company;

  // Define a escala: 0.5 se for compact (mobile grid), 1 se for normal
  const activeScale = compact ? 0.5 : 1;

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

  // Formatador de telefone
  const formatPhone = (phone?: string) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    return digits.length < 10 ? phone : `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  // --- SKELETON LOADING ---
  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <Skeleton className="w-full h-32" />
        <div className="p-4 flex flex-col flex-1">
          <Skeleton className="h-6 w-3/4 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-10 w-full mt-auto" />
        </div>
      </div>
    );
  }

  return (
    <div
      // AQUI ESTÁ A MÁGICA: styles.card + Variável CSS Scale
      className={cn(styles.card, className)}
      style={{ '--scale': activeScale } as React.CSSProperties}
      data-keywords={[name, city, state, category_name].filter(Boolean).join(', ')}
    >
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}

      {/* --- 1. Header: Banner & Avatar --- */}
      <div className={cn(styles.banner, compact ? styles.bannerCompact : styles.bannerDefault)}>
        <Link
          href={companyPath}
          className="block relative w-full h-full"
          onClick={() => emit('card_click')}
          aria-label={`Ver ${name}`}
        >
          {bannerUrl && !bannerError ? (
            <Image
              src={bannerUrl}
              alt={`Banner ${name}`}
              fill
              className="object-cover transition-transform duration-700 hover:scale-105"
              onError={() => setBannerError(true)}
              priority={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <Building2 className="text-gray-300 w-10 h-10" />
            </div>
          )}
        </Link>

        {/* Avatar agora controlado pelo CSS Module (sem classes fixas w-20 ou bottom-8) */}
        <div className={styles.avatarWrap}>
          <div className={styles.avatar}>
            {logoUrl && !logoError ? (
              <Image
                src={logoUrl}
                alt={`Logo ${name}`}
                fill
                className="object-contain p-1"
                onError={() => setLogoError(true)}
              />
            ) : (
              <Building2 className="text-gray-300 w-1/2 h-1/2" />
            )}
          </div>
        </div>
      </div>

      {/* --- 2. Conteúdo --- */}
      {/* O styles.content já tem o padding-top correto para não atropelar o logo */}
      <div className={styles.content}>
        
        {/* Título */}
        <Link 
          href={companyPath} 
          onClick={() => emit('title_click')}
          className="block"
        >
          <h3 className={styles.title}>{name}</h3>
        </Link>

        {/* Badges e Rating */}
        <div className={styles.metaRow}>
          {company.verified && (
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] px-1.5 h-5">
              {text.verified}
            </Badge>
          )}
          {category_name && (
            <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full truncate max-w-[100px]">
              {category_name}
            </span>
          )}
          {parseFloat(rating) > 0 && (
             <div className="flex items-center gap-1 text-amber-600 font-bold text-xs ml-auto">
               <Star size={12 * activeScale} fill="currentColor" /> 
               {rating}
             </div>
          )}
        </div>

        {/* Localização */}
        {(city || state) && (
          <div className="flex items-center text-xs text-gray-500 mb-2">
            <MapPin size={12 * activeScale} className="mr-1 shrink-0" />
            <span className="truncate">
              {city}{city && state ? ', ' : ''}{state}
            </span>
          </div>
        )}

        {/* Descrição (com limite de linhas via CSS) */}
        <p className={styles.description}>
          {description || <span className="italic text-gray-400">Saiba mais visitando o perfil.</span>}
        </p>

        {/* --- 3. Ações --- */}
        <div className={styles.actionsGrid}>
          {/* Botão Principal */}
          {hasWhatsapp && whatsappEnabled ? (
            <WhatsappButton
              enabled
              href={whatsappLinkRaw}
              label={text.whatsapp}
              // Forçamos as classes do CSS Module para garantir o tamanho reduzido
              className={cn(styles.btn, styles.btnPrimary, "w-full justify-center")} 
              onClick={() => emit('cta_whatsapp_click')}
            />
          ) : (
            <button
              className={cn(styles.btn, styles.btnPrimary, "w-full")}
              onClick={() => openQuoteWizard({ preferredCompanyId: id, source: 'company-card' })}
            >
              <MessageCircle size={14 * activeScale} className="mr-1.5" />
              {text.budget}
            </button>
          )}

          {/* Botão Secundário */}
          <Link 
            href={companyReviewPath} 
            onClick={() => emit('cta_review_click')}
            className={cn(styles.btn, styles.btnSecondary, "justify-center")}
          >
            <Star size={14 * activeScale} className="mr-1.5 text-gray-400" />
            {text.review}
          </Link>
        </div>

        {/* Área de Impressão (Oculta na tela) */}
        <div className="hidden print:block mt-2 pt-2 border-t border-gray-200 text-xs">
           <p>{company.email}</p>
           <p>{formatPhone(company.whatsapp)}</p>
        </div>

      </div>
    </div>
  );
}