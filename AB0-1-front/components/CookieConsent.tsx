'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { hasAnalyticsConsent, optIn } from '@/lib/analytics/consent';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import Link from 'next/link';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if consent already given
    const consent = localStorage.getItem('avaliasolar_consent');
    if (!consent) {
      // Small delay to not annoy immediately
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    optIn();
    setShowBanner(false);
  };

  const handleDecline = () => {
    // We still save the preference as false to not show the banner again
    localStorage.setItem('avaliasolar_consent', JSON.stringify({
      analytics: false,
      marketing: false,
      lastUpdated: Date.now()
    }));
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50"
        >
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                <Cookie className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Cookies & Privacidade</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Utilizamos cookies para melhorar sua experiência e analisar o tráfego do site. 
                  Ao clicar em "Aceitar", você concorda com o uso de cookies conforme nossa{' '}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Política de Privacidade
                  </Link>.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={handleAccept} className="flex-1">
                    Aceitar Tudo
                  </Button>
                  <Button onClick={handleDecline} variant="outline" className="flex-1">
                    Recusar
                  </Button>
                </div>
              </div>
              <button 
                onClick={() => setShowBanner(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
