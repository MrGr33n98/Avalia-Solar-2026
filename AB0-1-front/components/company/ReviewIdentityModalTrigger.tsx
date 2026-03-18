'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import IdentityBridgeModal from '@/components/ui/IdentityBridgeModal';
import { track } from '@/lib/analytics';

interface ReviewIdentityModalTriggerProps {
  activeTab: string;
}

export default function ReviewIdentityModalTrigger({ activeTab }: ReviewIdentityModalTriggerProps) {
  const { isAuthenticated } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Show modal if user switches to reviews tab, is NOT authenticated, and hasn't seen it in this session
    if (activeTab === 'reviews' && !isAuthenticated && !hasShown) {
      const shownInStorage = localStorage.getItem('review_identity_modal_shown');
      
      if (!shownInStorage) {
        // Delay slightly for better UX (let the tab content render)
        const timer = setTimeout(() => {
          setShowModal(true);
          setHasShown(true);
          localStorage.setItem('review_identity_modal_shown', 'true');
          
          track('review_gating_modal_triggered', {
            context: 'reviews_tab_click',
            timestamp: new Date().toISOString()
          });
        }, 1200);

        return () => clearTimeout(timer);
      }
    }
  }, [activeTab, isAuthenticated, hasShown]);

  return (
    <IdentityBridgeModal
      isOpen={showModal}
      onClose={() => {
        setShowModal(false);
        track('review_gating_modal_dismissed', {
          action: 'close'
        });
      }}
      onLogin={() => {
        setShowModal(false);
        track('review_gating_conversion_click', {
          target: 'login_page'
        });
        window.location.href = '/login';
      }}
      title="Quer ver todas as avaliações?"
      description="Identifique-se para acessar o histórico completo de performance, elogios e pontos de atenção desta empresa reportados pela comunidade."
    />
  );
}
