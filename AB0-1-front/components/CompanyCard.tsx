'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Star, MapPin, MessageCircle, Phone, Globe,
  Facebook, Instagram, Building2, ExternalLink
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  
  // Fail-safe para dados nulos
  if (!company) return null;

  const {
    id, name, city, state, description, 
    payment_methods, rating_count, average_rating,
    category_name, website, social_links
  } = company;

  // Formatação de dados
  const rating = average_rating?.toFixed(1) ?? '0.0';
  const totalReviews = rating_count || 0;
  const companyPath = buildCompanyPath(id, name);
  const companyReviewPath = buildCompanySubPath(id, name, 'review');
  
  // Tratamento de Imagens
  const bannerUrl = getFullImageUrl(company.banner_url || undefined);
  const logoUrl = getFullImageUrl(company.logo_url || undefined);

  // Lógica de WhatsApp/Contato
  const whatsappLinkRaw = (company as any).cta_whatsapp_url || (company as any).whatsapp_url || company.whatsapp;
  const hasWhatsapp = Boolean(whatsappLinkRaw);
  const whatsappEnabled = (company as any).whatsapp_enabled !== false; // Default true se undefined

  // Helper para telefone
  const formatPhone = (phone?: string) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) return phone;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  return (
    <div className={`h-full flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group ${className}`}>
      
      {/* 1. Área do Banner e Logo */}
      <div className="relative">
        <Link href={companyPath} className="block relative h-32 w-full overflow-hidden rounded-t-xl bg-gray-50" aria-label={`Ver detalhes de ${name}`}>
          {bannerUrl && !bannerError ? (
            <Image
              src={bannerUrl}
              alt={`Banner ${name}`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transform group-hover:scale-105 transition-transform duration-500"
              onError={() => setBannerError(true)}
              priority={false}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-50 to-gray-100 flex items-center justify-center">
               <Building2 className="text-gray-300 w-12 h-12 opacity-50" />
            </div>
          )}
          {/* Badge de Verificado */}
          {company.verified && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-600 shadow-sm flex items-center gap-1 border border-emerald-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              VERIFICADA
            </div>
          )}
        </Link>

        {/* Logo Circular Sobreposto - Ajuste de posição e borda para destaque */}
        <div className="absolute -bottom-10 left-4 z-10">
          <div className="relative w-20 h-20 rounded-full bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
             {logoUrl && !logoError ? (
               <Image
                 src={logoUrl}
                 alt={`Logo ${name}`}
                 fill
                 sizes="80px"
                 className="object-contain p-1" // p-1 evita que logos quadrados toquem a borda circular
                 onError={() => setLogoError(true)}
               />
             ) : (
               <Building2 className="text-gray-300 w-8 h-8" />
             )}
          </div>
        </div>
      </div>

      {/* 2. Conteúdo Principal */}
      <div className="pt-12 px-5 pb-4 flex-1 flex flex-col">
        {/* Cabeçalho: Nome e Avaliação */}
        <div className="flex justify-between items-start mb-2">
           <div className="flex-1 min-w-0 pr-2">
             <Link href={companyPath} className="group-hover:text-blue-600 transition-colors">
               <h3 className="font-bold text-lg text-gray-900 truncate" title={name}>
                 {name}
               </h3>
             </Link>
             {(city || state) && (
               <div className="flex items-center text-sm text-gray-500 mt-1">
                 <MapPin className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                 <span className="truncate">{city}{city && state ? ', ' : ''}{state}</span>
               </div>
             )}
           </div>
           
           {/* Rating Badge */}
           {parseFloat(rating) > 0 && (
             <div className="flex flex-col items-end flex-shrink-0 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
               <div className="flex items-center gap-1">
                 <span className="font-bold text-amber-700">{rating}</span>
                 <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
               </div>
               <span className="text-[10px] text-amber-600/80 font-medium">{totalReviews} avaliações</span>
             </div>
           )}
        </div>

        {/* Tags / Categoria */}
        <div className="mb-3">
          {category_name && (
            <Badge variant="secondary" className="font-normal bg-gray-100 text-gray-600 hover:bg-gray-200">
              {category_name}
            </Badge>
          )}
        </div>

        {/* Descrição Curta */}
        {description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
            {description}
          </p>
        )}

        {/* Separador Visual */}
        <div className="border-t border-gray-100 my-3 print:hidden" />

        {/* 3. Ações e Contato */}
        <div className="mt-auto space-y-2 print:hidden">
           {hasWhatsapp && whatsappEnabled ? (
             <WhatsappButton
               enabled
               href={whatsappLinkRaw}
               label="Conversar no WhatsApp"
               className="w-full shadow-sm hover:shadow-md transition-shadow"
               size="sm"
             />
           ) : (
             <Button 
               className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
               size="sm"
               onClick={() => openQuoteWizard({ preferredCompanyId: id, source: 'company-card' })}
             >
               <MessageCircle className="w-4 h-4 mr-2" />
               Solicitar Orçamento
             </Button>
           )}

           <Button 
             variant="outline" 
             size="sm" 
             className="w-full border-gray-200 hover:bg-gray-50 text-gray-600"
             asChild
           >
             <Link href={companyReviewPath}>
               <Star className="w-4 h-4 mr-2 text-gray-400 group-hover:text-amber-400 transition-colors" />
               Avaliar Empresa
             </Link>
           </Button>
        </div>

        {/* 4. Versão para Impressão (Oculta na tela) */}
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
