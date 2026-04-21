'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { openSignupGate } from '@/lib/signup-gate';

interface ReviewIdentityModalTriggerProps {
  activeTab: string;
}

export default function ReviewIdentityModalTrigger({ activeTab }: ReviewIdentityModalTriggerProps) {
  const { isAuthenticated, loading } = useAuth();
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Show modal if user switches to reviews tab, is NOT authenticated, and hasn't seen it in this session
    if (activeTab === 'reviews' && !loading && !isAuthenticated && !hasShown) {
      // Delay slightly for better UX (let the tab content render)
      const timer = setTimeout(() => {
        setHasShown(true);

        openSignupGate({
          source: 'review_tab',
          returnTo: `${window.location.pathname}${window.location.search}`,
          title: 'Quer ver todas as avaliações?',
          description: 'Crie sua conta para acessar o histórico completo de performance, elogios e pontos de atenção.',
        });
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [activeTab, hasShown, isAuthenticated, loading]);

  return null;
}
