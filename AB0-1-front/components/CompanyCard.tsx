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
      className={`group overflow-hidden h-full bg-white border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-200 ${className}`} 
      data-testid="company-card"
    >
      <Link 
        href={companyPath}
        data-testid="company-detail-link"
        className="block"
      >
        <CardContent className="p-0">
          {/* Banner/Logo Section - Redesigned com object-contain */}
          <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 p-4 flex items-center justify-center">
            {bannerUrl && !bannerError ? (
              <>
                <Image
                  src={bannerUrl}
                  alt={`Banner ${company.name}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-contain p-4"
                  onError={() => setBannerError(true)}
                  data-testid="company-banner"
                  priority={false}
                />

                {logoUrl && !logoError && (
                  <div className="absolute bottom-3 left-3 w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/95 border border-gray-200 shadow-sm p-1 flex items-center justify-center"> // Container responsivo
                    <Image
                      src={logoUrl}
                      alt={`Logo ${name}`}
                      fill
                      sizes="(max-width: 768px) 40px, 56px" // Responsivo para mobile
                      className="object-contain aspect-square" // Manter proporções quadradas
                      onError={() => setLogoError(true)}
                      priority={false}
                    />
                  </div>
                )}
              </>
            ) : logoUrl && !logoError ? (
              <Image
                src={logoUrl}
                alt={`Logo ${name}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-contain p-6"
                onError={() => setLogoError(true)}
                data-testid="company-logo"
                priority={false}
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full" data-testid="logo-placeholder">
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center border border-gray-200 shadow-sm">
                  <Building2 className="h-10 w-10 text-gray-400" />
                </div>
              </div>
            )}
            
            {/* Rating Badge - Top Right */}
            {rating && parseFloat(rating) > 0 && (
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm border border-gray-100">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-semibold text-gray-900">{rating}</span>
              </div>
            )}
            
            {/* Verified Badge - Top Left */}
            {setupComplete && company.verified && (
              <div className="absolute top-3 left-3 bg-green-500 text-white text-[10px] font-semibold px-2 py-1 rounded-full">
                ✓ Verificada
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="p-4">
            {/* Company Name */}
            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
              {name}
            </h3>

            {/* Location */}
            {(city || state) && (
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="truncate">{city && state ? `${city} - ${state}` : city || state}</span>
              </div>
            )}

            {/* Description */}
            {description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">{description}</p>
            )}

            {/* Info Row */}
            <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
              {totalReviews > 0 && (
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>{totalReviews} {totalReviews === 1 ? 'avaliação' : 'avaliações'}</span>
                </div>
              )}
              {category && (
                <Badge variant="outline" className="text-xs border-gray-200">
                  {category}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Link>

      {/* Action Buttons */}
      <div className="px-4 pb-4 space-y-2">
        <Button variant="outline" size="sm" className="w-full border-gray-200 hover:bg-gray-50" asChild>
          <Link href={companyReviewPath}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Deixar Avaliação
          </Link>
        </Button>

        <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
          {company.buttons && company.buttons.length > 0 ? (
            <div className="grid gap-2 grid-cols-1 xl:grid-cols-2">
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
                      className="w-full text-xs"
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
                    className="w-full text-xs"
                    onClick={() => {
                      if (btn.url.startsWith('/')) {
                        window.location.href = btn.url;
                      } else {
                        window.open(btn.url, '_blank');
                      }
                    }}
                  >
                    {isPrimary ? <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> : null}
                    <span className="truncate">{btn.label}</span>
                  </Button>
                );
              })}
            </div>
          ) : (
            <div className="grid gap-2 grid-cols-1 xl:grid-cols-2">
              {hasWhatsapp && whatsappEnabled && (
                <WhatsappButton
                  enabled
                  href={company.whatsapp || whatsappLink}
                  styles={{ variant: 'solid' }}
                  size="sm"
                  preset="brandSolid"
                  className="w-full text-xs"
                  label="WhatsApp"
                />
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs border-gray-200 hover:bg-white"
                onClick={() => {
                  openQuoteWizard({ preferredCompanyId: company.id, source: 'company-card' });
                }}
              >
                <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                <span className="truncate">Orçamento</span>
              </Button>
            </div>
          )}
        </div>

        {/* Social Links */}
        {social_links && (website || social_links.facebook || social_links.instagram || social_links.twitter) && (
          <div className="flex items-center justify-center gap-3 pt-2 border-t border-gray-100">
            {website && <SocialLink href={website} icon={Globe} label="Website" />}
            {social_links.facebook && <SocialLink href={social_links.facebook} icon={Facebook} label="Facebook" />}
            {social_links.instagram && <SocialLink href={social_links.instagram} icon={Instagram} label="Instagram" />}
            {social_links.twitter && <SocialLink href={social_links.twitter} icon={Twitter} label="Twitter" />}
          </div>
        )}
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
