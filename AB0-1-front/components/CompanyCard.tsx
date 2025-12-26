'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Star, MapPin, MessageCircle, Phone, Globe,
  Clock, CreditCard, Facebook, Instagram, Twitter, Building2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Company } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import WhatsappButton from '@/components/WhatsappButton';
import { getFullImageUrl } from '@/utils/image';
import { buildCompanyPath, buildCompanySubPath } from '@/lib/slug';
import { openQuoteWizard } from '@/lib/quote-wizard';

interface Props {
  company: Company;
  className?: string;
  compact?: boolean;
}

export default function CompanyCard({ company, className = '', compact = false }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState(false);
  const [logoError, setLogoError] = useState(false);
  
  useEffect(() => {
    if (error) {
      console.error('[CompanyCard] Error:', error);
    }
  }, [error]);

  if (error) {
    return (
      <Card className={`overflow-hidden h-full ${className}`}>
        <CardContent className="p-4 text-red-500">Error loading company data</CardContent>
      </Card>
    );
  }
  
  if (!company) {
    return (
      <Card className={`overflow-hidden h-full ${className}`}>
        <CardContent className="p-4 text-gray-500">Company data not available</CardContent>
      </Card>
    );
  }


  const {
    id, name, city, state, description, about, working_hours, business_hours,
    payment_methods, reviews_count, rating_count, average_rating, rating_avg,
    categories, website, social_links
  } = company;

  // Updated rating calculation to use a period for decimal separator
  const rating = (company.average_rating?.toFixed(1) ?? '0.0');
  const totalReviews = rating_count || 0;
  const workingHours = business_hours;
  const payments = Array.isArray(payment_methods) ? payment_methods.join(', ') : payment_methods || '';
  const category = company.category_name;
  const companyPath = buildCompanyPath(id, name);
  const companyReviewPath = buildCompanySubPath(id, name, 'review');
  
  // Prepara as URLs das imagens
  const bannerUrl = getFullImageUrl(company.banner_url || undefined);
  const logoUrl = getFullImageUrl(company.logo_url || undefined) || '/fallback-logo.png'; // Fallback para logo padrão se não disponível
  
  // Debug logs to track image loading (Requested by user)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`[CompanyCard] Debug info for: ${company.name} (ID: ${company.id})`);
      console.log('Raw Banner URL:', company.banner_url);
      console.log('Processed Banner URL:', bannerUrl);
      console.log('Raw Logo URL:', company.logo_url);
      console.log('Processed Logo URL:', logoUrl);
      console.groupEnd();
    }
  }, [company, bannerUrl, logoUrl]);

  // Helper functions
  const extractDigits = (value?: string | null) => {
    if (!value) return '';
    return value.replace(/\D/g, '');
  };
  const parseWhatsappFromUrl = (url?: string | null) => {
    if (!url) return '';
    const digits = extractDigits(url);
    return digits;
  };
  const formatBrazilPhone = (digits: string) => {
    if (!digits) return '';
    const d = digits;
    const country = d.length > 11 ? `+${d.slice(0, d.length - 11)} ` : '';
    const core = d.slice(-11);
    const dd = core.slice(0, 2);
    const nine = core.slice(2, 3);
    const first = core.slice(3, 7);
    const last = core.slice(7, 11);
    return `${country}(${dd}) ${nine}${first}-${last}`.replace(/-$/, '');
  };
  const buildWhatsappLink = (value?: string | null) => {
    const val = (value || '').trim();
    if (!val) return '';
    const isHttp = /^https?:\/\//i.test(val);
    const isWhats = /wa\.me|api\.whatsapp\.com/i.test(val);
    if (isHttp && isWhats) return val;
    const digits = val.replace(/\D/g, '');
    if (!digits) return '';
    return `https://wa.me/${digits}`;
  };

  // Verificações solicitadas
  const eligiblePlan = (company.has_paid_plan === true) || (company.plan_status === 'active') || (company.has_paid_plan === undefined && company.plan_status === undefined);
  const setupComplete = Boolean(company.status === 'active' && company.verified && eligiblePlan);
  const enabledRaw = (company as any).cta_whatsapp_enabled ?? (company as any).whatsapp_enabled;
  const whatsappEnabled = enabledRaw === undefined || enabledRaw === null ? true : Boolean(enabledRaw);
  
  // Lógica de telefone/WhatsApp
  const whatsappLinkRaw = (company as any).cta_whatsapp_url || (company as any).whatsapp_url || company.whatsapp;
  const whatsappLink = buildWhatsappLink(whatsappLinkRaw);
  const hasWhatsapp = Boolean(whatsappLink);
  
  // Debug removido para produção

  return (
    <Card 
      className={`group overflow-hidden h-full bg-white border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-200 print:shadow-none print:border-gray-300 ${className}`} 
      data-testid="company-card"
    > > 
      <Link 
        href={companyPath}
        data-testid="company-detail-link"
        className="block flex-1 relative"
      >
        {/* Banner Section */}
        <div className="relative h-32 w-full bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
            {bannerUrl && !bannerError ? (
              <Image
                src={bannerUrl}
                alt={`Banner ${company.name}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                className="object-cover"
                onError={() => setBannerError(true)}
                data-testid="company-banner"
                priority={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-10">
                 <Building2 className="h-16 w-16 text-gray-400" />
              </div>
            )}
            
            {/* Verified Badge - Top Left */}
            {setupComplete && company.verified && (
              <div className="absolute top-3 left-3 bg-emerald-500/90 backdrop-blur-[2px] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm z-10 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                VERIFICADA
              </div>
            )}
        </div>

        {/* Logo Section - Circular & Overlapping */}
        <div className="absolute top-20 left-4 z-20">
            <div className="w-20 h-20 rounded-full bg-white border-[3px] border-white shadow-md overflow-hidden flex items-center justify-center relative">
                {logoUrl && !logoError ? (
                  <Image
                    src={logoUrl}
                    alt={`Logo ${name}`}
                    fill
                    sizes="80px"
                    className="object-contain p-1"
                    onError={() => setLogoError(true)}
                    priority={false}
                  />
                ) : (
                  <Building2 className="h-8 w-8 text-gray-300" />
                )}
            </div>
        </div>

        {/* Rating Badge - Absolute Positioned (Right side, aligned with logo center vertically roughly) */}
        {rating && parseFloat(rating) > 0 && (
             <div className="absolute top-36 right-4 z-10">
                <div className="flex items-center gap-1.5 bg-white border border-gray-100 px-2.5 py-1 rounded-full shadow-sm">
                   <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                   <span className="text-sm font-bold text-gray-900">{rating}</span>
                   <span className="text-[10px] text-gray-400 font-medium">({totalReviews})</span>
                </div>
             </div>
        )}

        {/* Content Section */}
        <div className="pt-12 px-5 pb-5">
            {/* Company Name & Location */}
            <div className="mb-3">
              <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-1 mb-1" title={name}>
                {name}
              </h3>
              
              {(city || state) && (
                <div className="flex items-center text-sm text-gray-500 font-medium">
                  <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{city && state ? `${city}, ${state}` : city || state}</span>
                </div>
              )}
            </div>

            {/* Tags / Categories */}
            <div className="flex flex-wrap gap-2 mb-3">
               {category && (
                  <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0.5 h-5 bg-gray-100 text-gray-600 hover:bg-gray-200 border-transparent">
                    {category}
                  </Badge>
               )}
               {totalReviews > 0 && (
                  <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0.5 h-5 bg-blue-50 text-blue-700 hover:bg-blue-100 border-transparent">
                    {totalReviews} avaliações
                  </Badge>
               )}
            </div>

            {/* Description */}
            {description && (
              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-1">
                {description}
              </p>
            )}
        </div>
      </Link>

      {/* Action Buttons */}
      <div className="px-5 pb-5 pt-0 mt-auto print:hidden">
        <div className="flex flex-col gap-2">
          {/* Main Action - WhatsApp or Quote */}
          {hasWhatsapp && whatsappEnabled ? (
             <div className="w-full">
                <WhatsappButton
                  enabled
                  href={company.whatsapp || whatsappLink}
                  styles={{ variant: 'solid' }}
                  size="sm"
                  preset="brandSolid"
                  className="w-full font-medium shadow-sm"
                  label="Conversar no WhatsApp"
                />
             </div>
          ) : (
            <Button
                variant="default"
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
                onClick={() => {
                  openQuoteWizard({ preferredCompanyId: company.id, source: 'company-card' });
                }}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Solicitar Orçamento
              </Button>
          )}

          {/* Secondary Action - Reviews */}
          <Button variant="outline" size="sm" className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900" asChild>
            <Link href={companyReviewPath}>
              <Star className="mr-2 h-4 w-4 text-gray-400 group-hover:text-amber-400 transition-colors" />
              Avaliar Empresa
            </Link>
          </Button>
        </div>

        {/* Social Links - Minimalist */}
        {social_links && (website || social_links.facebook || social_links.instagram || social_links.twitter) && (
          <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-gray-100">
            {website && <SocialLink href={website} icon={Globe} label="Website" />}
            {social_links.instagram && <SocialLink href={social_links.instagram} icon={Instagram} label="Instagram" />}
            {social_links.facebook && <SocialLink href={social_links.facebook} icon={Facebook} label="Facebook" />}
          </div>
        )}
      </div>

      {/* Print Only Contact Info */}
      <div className="hidden print:block px-5 pb-5 pt-2">
         <div className="text-xs text-gray-600 space-y-1">
            {company.whatsapp && (
                <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    <span>{formatBrazilPhone(extractDigits(company.whatsapp))}</span>
                </div>
            )}
            {website && (
                <div className="flex items-center gap-2">
                    <Globe className="h-3 w-3" />
                    <span>{website.replace(/^https?:\/\//, '')}</span>
                </div>
            )}
         </div>
      </div>

      {/* Print Only Contact Info */}
      <div className="hidden print:block px-5 pb-5 pt-2">
         <div className="text-xs text-gray-600 space-y-1">
            {company.whatsapp && (
                <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    <span>{formatBrazilPhone(extractDigits(company.whatsapp))}</span>
                </div>
            )}
            {website && (
                <div className="flex items-center gap-2">
                    <Globe className="h-3 w-3" />
                    <span>{website.replace(/^https?:\/\//, '')}</span>
                </div>
            )}
         </div>
      </div>

      {/* Print Only Contact Info */}
      <div className="hidden print:block px-5 pb-5 pt-2">
         <div className="text-xs text-gray-600 space-y-1">
            {company.whatsapp && (
                <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    <span>{formatBrazilPhone(extractDigits(company.whatsapp))}</span>
                </div>
            )}
            {website && (
                <div className="flex items-center gap-2">
                    <Globe className="h-3 w-3" />
                    <span>{website.replace(/^https?:\/\//, '')}</span>
                </div>
            )}
         </div>
      </div>

      {/* Print Only Contact Info */}
      <div className="hidden print:block px-5 pb-5 pt-2">
         <div className="text-xs text-gray-600 space-y-1">
            {company.whatsapp && (
                <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    <span>{formatBrazilPhone(company.whatsapp)}</span>
                </div>
            )}
            {website && (
                <div className="flex items-center gap-2">
                    <Globe className="h-3 w-3" />
                    <span>{website.replace(/^https?:\/\//, '')}</span>
                </div>
            )}
         </div>
      </div>
    </Card>
  );
}

/* Componente auxiliar para Social Links */
const SocialLink = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => (
  <a 
    href={href} 
    target="_blank" 
    rel="noopener noreferrer" 
    className="text-gray-400 hover:text-blue-600 transition-colors"
    aria-label={label}
  >
    <Icon size={16} />
  </a>
);
