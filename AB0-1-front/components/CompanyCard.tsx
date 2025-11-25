'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Star, MapPin, MessageCircle, Phone, Globe,
  Clock, CreditCard, Facebook, Instagram, Twitter
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Company } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import WhatsappButton from '@/components/WhatsappButton';
import TestImage from '@/components/TestImage';
import { getFullImageUrl } from '@/utils/image';

interface Props {
  company: Company;
  className?: string;
}

export default function CompanyCard({ company, className = '' }: Props) {
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
  
  // Prepara as URLs das imagens
  const bannerUrl = getFullImageUrl(company.banner_url || undefined);
  const logoUrl = getFullImageUrl(company.logo_url || undefined);

  // Debug company data
  console.log('=== CompanyCard Debug ===');
  console.log('Company name:', company.name);
  console.log('Company ID:', company.id);
  console.log('Raw banner_url:', company.banner_url);
  console.log('Raw logo_url:', company.logo_url);
  console.log('Processed banner URL:', bannerUrl);
  console.log('Processed logo URL:', logoUrl);
  console.log('Window location:', typeof window !== 'undefined' ? window.location.href : 'server-side');
  console.log('=== End Debug ===');

  // Setup condicional baseado em configuração via Active Admin
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
    // Formata como +55 (DD) 9XXXX-XXXX quando possível
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
  const whatsappLink = buildWhatsappLink((company as any).cta_whatsapp_url || (company as any).whatsapp_url || company.whatsapp);
  const eligiblePlan = (company.has_paid_plan === true) || (company.plan_status === 'active') || (company.has_paid_plan === undefined && company.plan_status === undefined);
  const enabledRaw = (company as any).cta_whatsapp_enabled ?? (company as any).whatsapp_enabled;
  const whatsappEnabled = enabledRaw === undefined || enabledRaw === null ? true : Boolean(enabledRaw);
  const hasWhatsapp = Boolean(whatsappLink);
  // Original: Boolean(company.verified && whatsappEnabled && (whatsappDigits || whatsappLink))
  const setupComplete = Boolean(company.status === 'active' && company.verified && eligiblePlan);
  console.log('cta_whatsapp_enabled:', company.cta_whatsapp_enabled);
  console.log('whatsapp:', company.whatsapp);
  console.log('hasWhatsapp:', hasWhatsapp);
  console.log('setupComplete:', setupComplete);

  return (
    <Card className={`overflow-hidden h-full hover:shadow-lg transition-shadow ${className}`} suppressHydrationWarning data-testid="company-card">
      {/* Main company link (only wraps clickable area) */}
      <a 
        href={`/companies/${company.id}`} 
        data-testid="company-detail-link"
      >
        <CardContent className="p-0">
          {/* Banner section */}
          <div className="h-20 bg-gradient-to-r from-gray-200 to-gray-300 relative">
            {bannerUrl && !bannerError ? (
              <TestImage
                src={bannerUrl}
                alt={`Banner ${company.name}`}
                className="object-cover"
                onError={() => setBannerError(true)}
                data-testid="company-banner"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center" data-testid="banner-placeholder">
                <span className="text-gray-400 text-sm">Banner não disponível</span>
              </div>
            )}
          </div>

          <div className="p-4">
            {/* Header with logo and name */}
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                {logoUrl && !logoError ? (
                  <div className="mr-3 relative w-12 h-12">
                    <TestImage
                      src={logoUrl}
                      alt={`Logo ${name}`}
                      width={48}
                      height={48}
                      className="rounded-full border object-cover bg-gray-100"
                      fill={false}
                      onError={() => setLogoError(true)}
                      data-testid="company-logo"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full mr-3 bg-gray-200 flex items-center justify-center border relative" data-testid="logo-placeholder">
                    <Image
                      src="/images/logo-placeholder.svg"
                      alt="Logo placeholder"
                      width={24}
                      height={24}
                      className="rounded-full"
                      unoptimized
                    />
                  </div>
                )}
                <h3 className="text-lg font-semibold" suppressHydrationWarning>{name}</h3>
              </div>
              {rating && (
                <div className="flex items-center text-sm">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                  {rating}
                </div>
              )}
            </div>

            {/* Localização */}
            {(city || state) && (
              <div className="flex items-center text-sm text-gray-500 mt-2">
                <MapPin size={14} className="mr-1" />
                {city && state ? `${city} - ${state}` : city || state}
              </div>
            )}

            {/* Descrição */}
            <p className="text-gray-600 text-sm mt-2 line-clamp-2">{description || 'No description'}</p>

            {/* Info extra */}
            {workingHours && <Info icon={Clock} text={workingHours} />}
            {payments && <Info icon={CreditCard} text={payments} />}
            {totalReviews > 0 && <Info icon={MessageCircle} text={`${totalReviews} ${totalReviews === 1 ? 'avaliação' : 'avaliações'}`} />}
          </div>
        </CardContent>
      </a>

      {/* Social links outside main anchor */}
      <div className="px-4 pb-2">
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
      {category && <Badge variant="outline" className="px-4 pb-4 text-xs">{category}</Badge>}


      <div className="px-4 pb-4 space-y-2">
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href={`/companies/${id}/review`}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Deixar Avaliação
          </Link>
        </Button>

        <div className="rounded-lg border bg-background p-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {hasWhatsapp && whatsappEnabled && (
              <WhatsappButton
                enabled
                href={company.whatsapp || whatsappLink}
                styles={{ variant: 'solid' }}
                size="sm"
                preset="brandSolid"
                className="w-full"
                label="Conversar no WhatsApp"
              />
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                window.location.href = `/companies/${id}/quote`;
              }}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Solicite um orçamento
            </Button>
          </div>
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
