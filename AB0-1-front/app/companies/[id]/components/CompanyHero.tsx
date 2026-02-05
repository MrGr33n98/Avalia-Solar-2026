'use client';

import Image from 'next/image';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { useRouter } from 'next/navigation';
import { MessageCircle, BadgeCheck, Share2, ArrowLeft, Scale } from 'lucide-react';
import { RatingStars } from '@/components/RatingStars';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import WhatsappButton from '@/components/WhatsappButton';
import { Company } from '@/lib/api';
import { useState } from 'react';
import { toast } from 'sonner';
import { openLeadModal } from '@/lib/lead-engine';
import { track } from '@/lib/analytics/lazy';
import { useComparison } from '@/hooks/useComparison';

interface CompanyHeroProps {
  company: Company;
  companyStats: {
    rating: number;
    reviewCount: number;
  };
  bannerUrl: string | null;
  bannerError: boolean;
  setBannerError: (error: boolean) => void;
  logoUrl: string | null;
  logoError: boolean;
  setLogoError: (error: boolean) => void;
  ctaEnabled: boolean;
  ctaUrl: string | null;
}

export default function CompanyHero({
  company,
  companyStats,
  bannerUrl,
  bannerError,
  setBannerError,
  logoUrl,
  logoError,
  setLogoError,
  ctaEnabled,
  ctaUrl
}: CompanyHeroProps) {
  const router = useRouter();
  const [isSharing, setIsSharing] = useState(false);
  const { isInComparison, addToComparison, removeFromComparison } = useComparison();
  const inComp = isInComparison(company.id);

  const handleShare = async () => {
    track('company_share_click', {
      company_id: company.id,
      company_name: company.name,
      element_type: 'button',
      action_type: 'click'
    });
    setIsSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: company.name,
          text: company.description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copiado para a área de transferência!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="relative w-full">
      {/* Botão de Voltar */}
      <div className="mb-4">
        <Button
          variant="outline"
          className="group text-muted-foreground hover:text-foreground border-border hover:bg-muted transition-colors"
          onClick={() => {
            track('company_back_click', {
              company_id: company.id,
              company_name: company.name,
              element_type: 'button',
              action_type: 'click'
            });
            router.back();
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Voltar
        </Button>
      </div>

      {/* Banner */}
      <div className="relative w-full mb-8">
        <div className="relative w-full h-[180px] sm:h-[200px] md:h-[220px]">
          <OptimizedImage
            src={bannerUrl || '/images/banner-avalia-solar.png'}
            alt={`${company.name} banner`}
            fill
            priority
            quality={90}
            className="object-cover rounded-2xl shadow-lg"
            containerClassName="h-full"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            fallbackSrc="/images/banner-avalia-solar.png"
            onError={() => {
              console.warn('[CompanyHero] Banner failed to load', {
                company_id: company.id,
                bannerUrl,
              });
              setBannerError(true);
            }}
          />
          {(!bannerUrl || bannerError) && (
            <div className="absolute inset-0 rounded-2xl ring-1 ring-border/50 pointer-events-none">
              <span className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-white/70 backdrop-blur px-2 py-1 rounded">Imagem ilustrativa</span>
            </div>
          )}
        </div>
      </div>

      {/* Info da empresa */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 -mt-16 z-10 relative px-4 sm:px-0">
        <div className="bg-card p-4 rounded-xl shadow-lg border border-border flex flex-col sm:flex-row items-start sm:items-center w-full md:w-auto relative group transition-all hover:shadow-xl">
          <div className="mr-4 mb-3 sm:mb-0 relative">
            <OptimizedImage
              src={logoUrl || "/images/logo-placeholder.svg"}
              alt={company.name}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full border-2 border-white object-cover bg-white shadow-sm"
              fallbackSrc="/images/logo-placeholder.svg"
              onError={() => setLogoError(true)}
            />
            {company.verified && (
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm" title="Empresa Verificada">
                <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-50" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate max-w-[250px] sm:max-w-xs" title={company.name}>
                {company.name}
              </h1>
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-1 max-w-md mb-2">
              {company.description}
            </p>
            
            <div className="flex items-center space-x-3">
              <RatingStars 
                 rating={companyStats.rating} 
                 count={companyStats.reviewCount} 
                 showRatingValue={true}
                 starClassName="w-4 h-4"
                 countClassName="text-sm"
               />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto mt-3 md:mt-0">
          <Button
            variant="outline"
            className="flex-1 sm:flex-none border-border hover:bg-muted"
            onClick={handleShare}
            disabled={isSharing}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>

          <Button
            variant="outline"
            className={cn(
              "flex-1 sm:flex-none border-border hover:bg-muted",
              inComp && "text-primary border-primary/20 bg-primary/5"
            )}
            onClick={() => {
              if (inComp) {
                removeFromComparison(company.id);
              } else {
                addToComparison(company);
              }
              track('company_hero_comparison_toggle', {
                company_id: company.id,
                company_name: company.name,
                status: !inComp ? 'added' : 'removed'
              });
            }}
          >
            <Scale className={cn("h-4 w-4 mr-2", inComp && "fill-current")} />
            {inComp ? 'Comparando' : 'Comparar'}
          </Button>

          {company.buttons && company.buttons.length > 0 ? (
            company.buttons.map((btn, idx) => {
              if (btn.button_type === 'whatsapp') {
                return (
                  <div key={idx} className="flex-1 sm:flex-none">
                    <WhatsappButton
                      size="default"
                      enabled
                      href={btn.url}
                      styles={{ variant: 'solid' }}
                      preset="brandSolid"
                      className="w-full text-foreground shadow-sm hover:shadow-md transition-all font-medium text-sm"
                      label={btn.label}
                      companyId={company.id}
                    />
                  </div>
                );
              }
              
              const isPrimary = btn.button_type === 'primary';
              return (
                <Button
                  key={idx}
                  size="default"
                  variant={isPrimary ? 'default' : 'outline'}
                  className={`flex-1 sm:flex-none transition-all shadow-sm hover:shadow-md gap-1.5 font-medium text-sm ${
                    isPrimary 
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
                      : 'bg-background hover:bg-muted text-foreground border-input'
                  }`}
                  onClick={() => {
                     track('company_custom_button_click', {
                       company_id: company.id,
                       company_name: company.name,
                       button_label: btn.label,
                       button_type: btn.button_type,
                       element_type: 'button',
                       action_type: 'click',
                       destination_url: btn.url
                     });
                     if (btn.url.startsWith('/')) {
                       router.push(btn.url);
                     } else {
                       window.open(btn.url, '_blank');
                     }
                  }}
                >
                  {isPrimary ? <MessageCircle className="h-4 w-4" /> : null}
                  {btn.label}
                </Button>
              );
            })
          ) : (
            <>
              <Button
                size="default"
                className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 transition-all shadow-sm hover:shadow-md text-primary-foreground gap-1.5 font-medium text-sm"
                onClick={() => {
                  track('company_quote_click', {
                    company_id: company.id,
                    company_name: company.name,
                    source: 'company-hero',
                    element_type: 'button',
                    action_type: 'click'
                  });
                  openLeadModal({ preferredCompanyId: company.id, source: 'company-hero', type: 'quick' });
                }}
              >
                <MessageCircle className="h-4 w-4" />
                Orcamento
              </Button>
              {ctaEnabled && ctaUrl && (
                <div className="flex-1 sm:flex-none">
                  <WhatsappButton
                    size="default"
                    enabled
                    href={ctaUrl}
                    styles={{ variant: 'solid' }}
                    preset="brandSolid"
                    className="w-full text-foreground shadow-sm hover:shadow-md transition-all font-medium text-sm"
                    label="WhatsApp"
                    companyId={company.id}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
