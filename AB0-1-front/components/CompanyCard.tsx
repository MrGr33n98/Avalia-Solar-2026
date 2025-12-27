'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, MessageCircle, Phone, Globe, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Company } from '@/lib/api';
import { getFullImageUrl } from '@/utils/image';
import { buildCompanyPath, buildCompanySubPath } from '@/lib/slug';
import { openQuoteWizard } from '@/lib/quote-wizard';
import WhatsappButton from '@/components/WhatsappButton';

interface Props {
  company: Company;
  className?: string;
  compact?: boolean;
}

export default function CompanyCard({ company, className = '', compact = false }: Props) {
  const [bannerError, setBannerError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  if (!company) return null;

  const { id, name, city, state, description, rating_count, average_rating, category_name, website } = company;

  const rating = average_rating?.toFixed(1) ?? '0.0';
  const totalReviews = rating_count || 0;

  const companyPath = buildCompanyPath(id, name);
  const companyReviewPath = buildCompanySubPath(id, name, 'review');

  const bannerUrl = getFullImageUrl(company.banner_url || undefined);
  const logoUrl = getFullImageUrl(company.logo_url || undefined);

  const whatsappLinkRaw =
    (company as any).cta_whatsapp_url || (company as any).whatsapp_url || company.whatsapp;
  const hasWhatsapp = Boolean(whatsappLinkRaw);
  const whatsappEnabled = (company as any).whatsapp_enabled !== false;

  const formatPhone = (phone?: string) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) return phone;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  // UI: altura do banner mais “hero” no mobile, borda/ring premium, e avatar redondo “de verdade”
  return (
    <div
      className={[
        'h-full flex flex-col bg-white',
        'rounded-2xl border border-gray-200 shadow-sm',
        'transition-all duration-200',
        'hover:shadow-lg hover:-translate-y-0.5 hover:ring-1 hover:ring-gray-200',
        'group touch-manipulation',
        className,
      ].join(' ')}
    >
      {/* 1) Banner + Avatar */}
      <div className="relative">
        <Link
          href={companyPath}
          aria-label={`Ver detalhes de ${name}`}
          className={[
            'block relative w-full overflow-hidden bg-gray-50',
            'h-32 md:h-40', // + impacto no mobile
            'rounded-t-2xl',
          ].join(' ')}
        >
          {bannerUrl && !bannerError ? (
            <>
              <Image
                src={bannerUrl}
                alt={`Banner ${name}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105 group-hover:brightness-[0.98]"
                onError={() => setBannerError(true)}
                priority={false}
              />
              {/* Gradiente para legibilidade e “acabamento” */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-black/0 to-black/0" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-50 to-gray-100 flex items-center justify-center">
              <Building2 className="text-gray-300 w-12 h-12 opacity-50" />
            </div>
          )}

          {company.verified && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-600 shadow-sm flex items-center gap-1 border border-emerald-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              VERIFICADA
            </div>
          )}
        </Link>

        {/* Avatar redondo do logo (com ring + borda consistente e melhor “acabamento”) */}
        <div className="absolute -bottom-8 md:-bottom-9 left-4 z-10">
          <div
            className={[
              'relative w-16 h-16 md:w-20 md:h-20',
              'rounded-full overflow-hidden',
              'bg-white/95 backdrop-blur',
              'ring-2 ring-white', // “halo” limpo sobre o banner
              'shadow-md',
              'transition-transform duration-200 group-hover:scale-[1.02]',
            ].join(' ')}
          >
            {logoUrl && !logoError ? (
              <Image
                src={logoUrl}
                alt={`Logo ${name}`}
                fill
                sizes="(max-width: 768px) 64px, 80px"
                className="object-contain p-1.5 md:p-2"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="text-gray-300 w-7 h-7 md:w-8 md:h-8" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2) Conteúdo */}
      <div className="pt-12 md:pt-14 px-4 md:px-5 pb-4 flex-1 flex flex-col">
        {/* Header responsivo (evita “buraco” e melhora leitura no mobile) */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <Link
              href={companyPath}
              aria-label={`Abrir perfil de ${name}`}
              className="transition-colors group-hover:text-blue-600"
            >
              <h3
                className="font-bold text-base md:text-lg text-gray-900 truncate leading-snug tracking-tight"
                title={name}
              >
                {name}
              </h3>
            </Link>

            {(city || state) && (
              <div className="flex items-center text-xs md:text-sm text-gray-600 mt-1">
                <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 shrink-0" />
                <span className="truncate">
                  {city}
                  {city && state ? ', ' : ''}
                  {state}
                </span>
              </div>
            )}
          </div>

          {/* Rating (mantém consistência visual) */}
          {parseFloat(rating) > 0 ? (
            <div className="flex flex-col items-end self-start bg-amber-50 px-2 py-1 rounded-xl border border-amber-100">
              <div className="flex items-center gap-1">
                <span className="font-bold text-sm md:text-base text-amber-700">{rating}</span>
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              </div>
              <span className="text-[10px] text-amber-600/80 font-medium whitespace-nowrap">
                {totalReviews} avaliações
              </span>
            </div>
          ) : (
            // Placeholder invisível para reduzir “pulo” em grids (opcional, mas ajuda)
            <div className="opacity-0 pointer-events-none select-none px-2 py-1 rounded-xl border border-transparent">
              <div className="flex items-center gap-1">
                <span className="font-bold text-sm md:text-base">0.0</span>
                <Star className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] whitespace-nowrap">0 avaliações</span>
            </div>
          )}
        </div>

        {/* Categoria */}
        <div className="mb-3">
          {category_name && (
            <Badge
              variant="secondary"
              className="font-normal text-[10px] md:text-xs bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {category_name}
            </Badge>
          )}
        </div>

        {/* Descrição (altura mínima para grid ficar alinhada) */}
        {description ? (
          <p className="text-xs md:text-sm text-gray-600 leading-relaxed line-clamp-2 mb-4 flex-1 min-h-[2.5rem]">
            {description}
          </p>
        ) : (
          <div className="min-h-[2.5rem] mb-4" />
        )}

        <div className="border-t border-gray-100 my-3 print:hidden" />

        {/* 3) Ações */}
        <div className="mt-auto space-y-2 print:hidden">
          {hasWhatsapp && whatsappEnabled ? (
            <WhatsappButton
              enabled
              href={whatsappLinkRaw}
              label="WhatsApp"
              className="w-full shadow-sm hover:shadow-md transition-shadow h-10 md:h-9"
              size="sm"
            />
          ) : (
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm h-10 md:h-9"
              size="sm"
              onClick={() => openQuoteWizard({ preferredCompanyId: id, source: 'company-card' })}
            >
              <MessageCircle className="w-4 h-4 mr-2 shrink-0" />
              <span className="truncate">Solicitar Orçamento</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full border-gray-200 hover:bg-gray-50 text-gray-700 h-10 md:h-9"
            asChild
          >
            <Link href={companyReviewPath}>
              <Star className="w-4 h-4 mr-2 shrink-0 text-gray-400 group-hover:text-amber-400 transition-colors" />
              Avaliar
            </Link>
          </Button>
        </div>

        {/* 4) Impressão */}
        <div className="hidden print:block mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-bold text-gray-900 mb-2">Contatos:</h4>
          <div className="space-y-1 text-xs text-gray-600">
            {company.whatsapp && (
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3" />
                <span>{formatPhone(company.whatsapp)}</span>
              </div>
            )}
            {website && (
              <div className="flex items-center gap-2">
                <Globe className="w-3 h-3" />
                <span>{website.replace(/^https?:\/\//, '')}</span>
              </div>
            )}
            {company.email && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">@</span>
                <span>{company.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
