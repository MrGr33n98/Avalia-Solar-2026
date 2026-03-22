'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Company } from '@/lib/api';
import { openQuoteWizard } from '@/lib/quote-wizard';
import { track } from '@/lib/analytics/lazy';
import WhatsappButton from '@/components/WhatsappButton';
import { cn } from '@/lib/utils';

interface StickyCTAProps {
  company: Company;
  canRequestQuote?: boolean;
  ctaEnabled: boolean;
  ctaUrl: string | null;
}

export default function StickyCTA({ company, canRequestQuote, ctaEnabled, ctaUrl }: StickyCTAProps) {
  const [isVisible, setIsVisible] = useState(false);
  const quoteEnabled = canRequestQuote ?? ((company as any).active_admin === true);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky CTA after scrolling down 400px
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleQuoteClick = () => {
    track('company_sticky_quote_click', {
      company_id: company.id,
      company_name: company.name,
      source: 'sticky-cta',
      element_type: 'button',
      action_type: 'click'
    });
    openQuoteWizard({
      preferredCompanyId: company.id,
      source: 'sticky-cta',
    });
  };

  if (!quoteEnabled) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/60 bg-white/95 px-4 pt-4 pb-[max(1rem,var(--safe-area-inset-bottom))] shadow-[0_-8px_24px_-6px_rgba(15,23,42,0.12)] backdrop-blur-md md:py-3"
        >
          <div className="container mx-auto flex items-center justify-between gap-4">
            <div className="hidden md:flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                {company.logo_url ? (
                  <Image src={company.logo_url} alt={company.name} width={40} height={40} className="h-full w-full object-cover" />
                ) : (
                  <div className="text-slate-400 font-bold text-xs">{company.name.substring(0, 2).toUpperCase()}</div>
                )}
              </div>
              <div>
                <p className="font-bold text-slate-900 leading-none">{company.name}</p>
                <p className="text-xs text-slate-500 mt-1">Solicite um orçamento agora</p>
              </div>
            </div>

            <div className="flex flex-1 md:flex-none items-center gap-2 md:gap-3">
              <Button
                onClick={handleQuoteClick}
                className="flex-1 md:flex-none bg-primary hover:bg-primary/90 text-white font-bold h-11 md:h-10 px-6 shadow-sm"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Pedir Orçamento
              </Button>

              {ctaEnabled && ctaUrl && (
                <div className="flex-1 md:flex-none">
                  <WhatsappButton
                    size="default"
                    enabled
                    href={ctaUrl}
                    styles={{ variant: 'solid', bg_color: '#25D366', hover_bg_color: '#1ebe5d', text_color: '#ffffff', border_color: '#25D366', icon_color: '#ffffff' }}
                    className="w-full h-11 md:h-10 font-bold px-6"
                    label="WhatsApp"
                    companyId={company.id}
                    pagePath={typeof window !== 'undefined' ? window.location.pathname : undefined}
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
