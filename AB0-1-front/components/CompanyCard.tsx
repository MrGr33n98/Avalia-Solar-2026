'use client';

import Link from 'next/link';
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
import TestImage from '@/components/TestImage';
import { getFullImageUrl } from '@/utils/image';
import { buildCompanyPath, buildCompanySubPath } from '@/lib/slug';

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
  const companyQuotePath = buildCompanySubPath(id, name, 'quote');
  
  // Prepara as URLs das imagens
  const bannerUrl = getFullImageUrl(company.banner_url || undefined);
  const logoUrl = getFullImageUrl(company.logo_url || undefined);
  
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
    <Card className={`overflow-hidden h-full hover:shadow-lg transition-shadow ${className}`} suppressHydrationWarning data-testid="company-card">
      {/* Main company link (only wraps clickable area) */}
      <a 
        href={companyPath}
        data-testid="company-detail-link"
      >
        <CardContent className="p-0">
          {/* Banner section */}
          <div className={`${compact ? 'h-14' : 'h-20'} bg-gradient-to-r from-gray-200 to-gray-300 relative`}>
            <TestImage
              src={!bannerUrl || bannerError ? '/images/avalia-solar-place-holder.PNG' : bannerUrl}
              alt={!bannerUrl || bannerError ? `Banner padrão da empresa ${company.name}` : `Banner ${company.name}`}
              className="object-cover"
              onError={() => setBannerError(true)}
              data-testid="company-banner"
              priority={true}
            />
            {(!bannerUrl || bannerError) && (
              <div className="absolute inset-0 rounded ring-1 ring-border/50 pointer-events-none" data-testid="banner-placeholder">
                <span className="absolute bottom-1 right-1 text-[10px] text-muted-foreground bg-white/70 backdrop-blur px-1.5 py-0.5 rounded">Imagem ilustrativa</span>
              </div>
            )}
          </div>

          <div className={compact ? 'p-3' : 'p-4'}>
            {/* Header with logo and name */}
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                {logoUrl && !logoError ? (
                  <div className={`mr-3 relative ${compact ? 'w-10 h-10' : 'w-12 h-12'} flex-shrink-0`}>
                    <TestImage
                      src={logoUrl}
                      alt={`Logo ${name}`}
                      width={compact ? 40 : 48}
                      height={compact ? 40 : 48}
                      className="rounded-full border object-cover bg-white"
                      fill={false}
                      onError={() => setLogoError(true)}
                      data-testid="company-logo"
                    />
                  </div>
                ) : (
                  <div className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-full mr-3 bg-gray-100 flex items-center justify-center border relative flex-shrink-0`} data-testid="logo-placeholder">
                    <Building2 className={`${compact ? 'h-5 w-5' : 'h-6 w-6'} text-gray-400`} />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className={`${compact ? 'text-base' : 'text-lg'} font-semibold truncate pr-2`} suppressHydrationWarning>{name}</h3>
                  {setupComplete && company.verified && (
                     <span className="text-[10px] text-green-600 bg-green-50 px-1 rounded border border-green-100">Verificada</span>
                  )}
                </div>
              </div>
              {rating && (
                <div className={`flex items-center ${compact ? 'text-xs' : 'text-sm'}`}>
                  <Star className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} fill-yellow-400 text-yellow-400 mr-1`} />
                  {rating}
                </div>
              )}
            </div>

            {/* Localização */}
            {(city || state) && (
              <div className={`flex items-center ${compact ? 'text-xs' : 'text-sm'} text-gray-500 mt-2`}>
                <MapPin size={compact ? 12 : 14} className="mr-1" />
                {city && state ? `${city} - ${state}` : city || state}
              </div>
            )}

            {/* Descrição - Hide or limit more in compact mode */}
            {!compact && (
              <p className="text-gray-600 text-sm mt-2 line-clamp-2">{description || 'No description'}</p>
            )}
            {compact && description && (
               <p className="text-gray-600 text-xs mt-1 line-clamp-1">{description}</p>
            )}

            {/* Info extra */}
            {!compact && (
              <>
                {workingHours && <Info icon={Clock} text={workingHours} />}
                {payments && <Info icon={CreditCard} text={payments} />}
                {totalReviews > 0 && <Info icon={MessageCircle} text={`${totalReviews} ${totalReviews === 1 ? 'avaliação' : 'avaliações'}`} />}
              </>
            )}
          </div>
        </CardContent>
      </a>

      {/* Social links outside main anchor */}
      <div className={`${compact ? 'px-3 pb-2' : 'px-4 pb-2'}`}>
        {social_links && (
          <div className="flex items-center gap-2 mt-2 text-blue-500">
            {website && <SocialLink href={website} icon={Globe} label="Globe" />} {/* Changed label to "Globe" */}
            {social_links.facebook && <SocialLink href={social_links.facebook} icon={Facebook} label="Facebook" />}
            {social_links.instagram && <SocialLink href={social_links.instagram} icon={Instagram} label="Instagram" />}
            {social_links.twitter && <SocialLink href={social_links.twitter} icon={Twitter} label="Twitter" />}
          </div>
        )}
      </div>

      {/* Categoria */}
      {category && <Badge variant="outline" className={`${compact ? 'px-3 pb-3' : 'px-4 pb-4'} text-xs`}>{category}</Badge>}


      <div className={`${compact ? 'px-3 pb-3' : 'px-4 pb-4'} space-y-2`}>
        <Button variant="outline" size={compact ? 'sm' : 'sm'} className="w-full" asChild>
          <Link href={companyReviewPath}>
            <MessageCircle className={`mr-2 ${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
            Deixar Avaliação
          </Link>
        </Button>

        <div className="rounded-lg border bg-background p-3">
          {company.buttons && company.buttons.length > 0 ? (
            <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-1 xl:grid-cols-2'}`}>
              {company.buttons.slice(0, 2).map((btn, idx) => {
                if (btn.button_type === 'whatsapp') {
                  return (
                    <WhatsappButton
                      key={idx}
                      enabled
                      href={btn.url}
                      styles={{ variant: 'solid' }}
                      size="sm"
                      preset="brandSolid"
                      className="w-full text-xs px-2 truncate"
                      label={btn.label}
                    />
                  );
                }
                const isPrimary = btn.button_type === 'primary';
                return (
                  <Button
                    key={idx}
                    variant={isPrimary ? 'default' : 'outline'}
                    size="sm"
                    className="w-full text-xs px-2 truncate"
                    onClick={() => {
                      if (btn.url.startsWith('/')) {
                        window.location.href = btn.url;
                      } else {
                        window.open(btn.url, '_blank');
                      }
                    }}
                  >
                    {isPrimary ? <MessageCircle className={`mr-1.5 flex-shrink-0 ${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'}`} /> : null}
                    <span className="truncate">{btn.label}</span>
                  </Button>
                );
              })}
            </div>
          ) : (
            <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-1 xl:grid-cols-2'}`}>
              {hasWhatsapp && whatsappEnabled && (
                <WhatsappButton
                  enabled
                  href={company.whatsapp || whatsappLink}
                  styles={{ variant: 'solid' }}
                  size="sm"
                  preset="brandSolid"
                  className="w-full text-xs px-2 truncate"
                  label={compact ? "WhatsApp" : "Conversar no WhatsApp"}
                />
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs px-2 truncate"
                onClick={() => {
                  window.location.href = companyQuotePath;
                }}
              >
                <MessageCircle className={`mr-1.5 flex-shrink-0 ${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'}`} />
                <span className="truncate">{compact ? "Orçamento" : "Solicite um orçamento"}</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/* Components auxiliares para reduzir código */
const Info = ({ icon: Icon, text }: { icon: any; text: string }) => (
  <div className="flex items-center text-sm text-gray-500 mt-2">
    <Icon size={14} className="mr-1" />
    <span>{text}</span>
  </div>
);

const SocialLink = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => (
  <a 
    href={href} 
    target="_blank" 
    rel="noopener noreferrer" 
    className="hover:text-blue-600"
    aria-label={label}
  >
    <Icon size={14} />
  </a>
);
