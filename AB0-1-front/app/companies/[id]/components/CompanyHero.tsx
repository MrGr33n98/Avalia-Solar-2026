'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MessageCircle, Star, BadgeCheck, Share2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import WhatsappButton from '@/components/WhatsappButton';
import { Company } from '@/lib/api';
import { useState } from 'react';
import { toast } from 'sonner';

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

  const handleShare = async () => {
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
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Voltar
        </Button>
      </div>

      {/* Banner */}
      <div className="relative w-full mb-8">
        <div className="relative w-full h-[180px] sm:h-[200px] md:h-[220px]">
          <Image
            src={!bannerUrl || bannerError ? '/images/avalia-solar-place-holder.PNG' : bannerUrl}
            alt={!bannerUrl || bannerError ? `Banner padrão da empresa ${company.name}` : `${company.name} banner`}
            fill
            priority
            className="object-cover rounded-2xl shadow-lg"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setBannerError(true)}
          />
          {(!bannerUrl || bannerError) && (
            <div className="absolute inset-0 rounded-2xl ring-1 ring-border/50 pointer-events-none">
              <span className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-white/70 backdrop-blur px-2 py-1 rounded">Imagem ilustrativa</span>
            </div>
          )}
        </div>
      </div>

      {/* Info da empresa */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 -mt-24 z-10 relative px-4 sm:px-0">
        <div className="bg-card p-6 rounded-2xl shadow-xl border border-border flex flex-col sm:flex-row items-start sm:items-center w-full md:w-auto relative group transition-all hover:shadow-2xl">
          <div className="mr-6 mb-4 sm:mb-0 relative">
            {logoUrl && !logoError ? (
              <Image
                src={logoUrl}
                alt={company.name}
                width={96}
                height={96}
                className="w-24 h-24 rounded-full border-4 border-white object-cover bg-white shadow-md"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="w-24 h-24 rounded-full mr-3 bg-gray-100 flex items-center justify-center border-4 border-white shadow-md">
                <Image
                  src="/images/logo-placeholder.svg"
                  alt="Logo placeholder"
                  width={48}
                  height={48}
                  className="w-12 h-12 opacity-50"
                />
              </div>
            )}
            {company.verified && (
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm" title="Empresa Verificada">
                <BadgeCheck className="w-6 h-6 text-blue-500 fill-blue-50" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground truncate max-w-[300px] sm:max-w-md" title={company.name}>
                {company.name}
              </h1>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={handleShare}
                title="Compartilhar perfil"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-lg text-muted-foreground line-clamp-1 max-w-lg mb-3">
              {company.description}
            </p>
            
            {company.project_types && company.project_types.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {company.project_types.slice(0, 3).map((t) => (
                  <Badge key={t} variant="secondary" className="font-normal bg-secondary/50 hover:bg-secondary">
                    {t}
                  </Badge>
                ))}
                {company.project_types.length > 3 && (
                  <Badge variant="outline" className="font-normal text-muted-foreground">
                    +{company.project_types.length - 3}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="flex items-center mr-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(companyStats.rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-200 fill-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xl font-bold text-foreground">
                  {companyStats.rating.toFixed(1)}
                </span>
                <span className="text-muted-foreground ml-1 text-sm">
                  ({companyStats.reviewCount} avaliações)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-4 md:mt-0">
          {company.buttons && company.buttons.length > 0 ? (
            company.buttons.map((btn, idx) => {
              if (btn.button_type === 'whatsapp') {
                return (
                  <div key={idx} className="flex-1 sm:flex-none">
                    <WhatsappButton
                      size="lg"
                      enabled
                      href={btn.url}
                      styles={{ variant: 'solid' }}
                      preset="brandSolid"
                      className="w-full text-foreground shadow-md hover:shadow-lg transition-all font-semibold"
                      label={btn.label}
                    />
                  </div>
                );
              }
              
              const isPrimary = btn.button_type === 'primary';
              return (
                <Button
                  key={idx}
                  size="lg"
                  variant={isPrimary ? 'default' : 'outline'}
                  className={`flex-1 sm:flex-none transition-all shadow-md hover:shadow-lg gap-2 font-semibold ${
                    isPrimary 
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
                      : 'bg-background hover:bg-muted text-foreground border-input'
                  }`}
                  onClick={() => {
                     if (btn.url.startsWith('/')) {
                       router.push(btn.url);
                     } else {
                       window.open(btn.url, '_blank');
                     }
                  }}
                >
                  {isPrimary ? <MessageCircle className="h-5 w-5" /> : null}
                  {btn.label}
                </Button>
              );
            })
          ) : (
            <>
              <Button
                size="lg"
                className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 transition-all shadow-md hover:shadow-lg text-primary-foreground gap-2 font-semibold"
                onClick={() => router.push(`/companies/${company.id}/quote`)}
              >
                <MessageCircle className="h-5 w-5" />
                Solicitar Orçamento
              </Button>
              {ctaEnabled && ctaUrl && (
                <div className="flex-1 sm:flex-none">
                  <WhatsappButton
                    size="lg"
                    enabled
                    href={ctaUrl}
                    styles={{ variant: 'solid' }}
                    preset="brandSolid"
                    className="w-full text-foreground shadow-md hover:shadow-lg transition-all font-semibold"
                    label="WhatsApp"
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
