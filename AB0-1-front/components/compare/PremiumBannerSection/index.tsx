'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Company } from '@/lib/api';
import PremiumBannerDesktop from './PremiumBannerDesktop';
import PremiumBannerMobile from './PremiumBannerMobile';
import { track } from '@/lib/analytics/lazy';

interface PremiumBannerSectionProps {
  company: Company;
  onDismiss?: () => void;
  className?: string;
}

const STORAGE_KEY = 'avalia_premium_banner_dismissed';
const COOLDOWN_DAYS = 7;

export default function PremiumBannerSection({
  company,
  onDismiss,
  className,
}: PremiumBannerSectionProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [viewStartTime] = useState(Date.now());

  useEffect(() => {
    // Check if banner was dismissed recently
    const dismissedData = localStorage.getItem(STORAGE_KEY);
    if (dismissedData) {
      try {
        const { timestamp, companyId } = JSON.parse(dismissedData);
        const daysSinceDismiss = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
        
        if (daysSinceDismiss < COOLDOWN_DAYS && companyId === company.id) {
          setIsDismissed(true);
          return;
        }
      } catch (e) {
        // Invalid data, clear it
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    // Track banner view
    track('premium_banner_viewed', {
      company_id: company.id,
      position: 'comparison_page',
      visible_time: Date.now(),
    });
  }, [company.id]);

  const handleDismiss = () => {
    const timeVisible = Date.now() - viewStartTime;
    
    // Track dismiss event
    track('premium_banner_dismissed', {
      company_id: company.id,
      time_visible_ms: timeVisible,
    });

    // Save dismiss state
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      timestamp: Date.now(),
      companyId: company.id,
    }));

    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        role="complementary"
        aria-label="Empresa patrocinada em destaque"
        aria-describedby="premium-disclaimer"
        className={className}
      >
        <div id="premium-disclaimer" className="sr-only">
          Esta empresa é parceira premium da plataforma Avalia Solar
        </div>

        {/* Desktop */}
        <div className="hidden md:block">
          <PremiumBannerDesktop company={company} onDismiss={handleDismiss} />
        </div>

        {/* Mobile */}
        <div className="md:hidden">
          <PremiumBannerMobile company={company} onDismiss={handleDismiss} />
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
