'use client';

import { useEffect, useRef } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuth } from '@/contexts/AuthContext';

const REFRESH_INTERVAL_MS = 45000; // 45 segundos quando a tela está visível

/**
 * Hook de sincronização de mensagens não lidas em tempo real para a barra de navegação móvel.
 * - Busca inicial no mount se autenticado.
 * - Atualização ao focar no app (retorno de background no PWA/mobile).
 * - Intervalo periódico de sincronização leve.
 */
export function useMobileNavNotifications() {
  const { isAuthenticated } = useAuth();
  const { unreadMessagesCount, fetchUnreadMessagesCount, chatState, toggleChat } =
    useNotificationStore();

  const fetchRef = useRef(fetchUnreadMessagesCount);
  useEffect(() => {
    fetchRef.current = fetchUnreadMessagesCount;
  }, [fetchUnreadMessagesCount]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Busca inicial
    fetchRef.current();

    // Atualiza ao retornar ao app/aba
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchRef.current();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    // Polling suave enquanto ativo
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchRef.current();
      }
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  return {
    unreadMessagesCount,
    chatState,
    toggleChat,
  };
}
