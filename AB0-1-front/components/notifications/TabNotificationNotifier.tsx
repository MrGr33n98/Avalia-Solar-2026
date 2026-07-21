'use client';

import { useEffect, useRef } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuth } from '@/contexts/AuthContext';

/**
 * TabNotificationNotifier
 * 
 * Atualiza dinamicamente o título da aba do navegador (document.title) com a contagem de
 * notificações e mensagens não lidas no formato `(N) Título da Página | Avalia Solar`.
 * 
 * Requisitos atendidos:
 * 1. Prepend de `(1)`, `(2)`, `(99+)` quando há notificações ou mensagens pendentes.
 * 2. Suporte total à navegação do Next.js App Router usando MutationObserver.
 * 3. Polling em segundo plano (30s) para manter a contagem atualizada mesmo em abas inativas.
 * 4. Restauração automática do título limpo quando não há mais pendências.
 */
export function TabNotificationNotifier() {
  const { isAuthenticated } = useAuth();
  const { unreadCount, unreadMessagesCount, fetchUnreadCount, fetchUnreadMessagesCount } =
    useNotificationStore();

  const originalTitleRef = useRef<string>('');

  // 1. Polling em segundo plano a cada 30s se autenticado
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchUnreadCount();
    fetchUnreadMessagesCount();

    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchUnreadMessagesCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchUnreadCount, fetchUnreadMessagesCount]);

  // 2. Atualização dinâmica do document.title
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const totalUnread = (unreadCount || 0) + (unreadMessagesCount || 0);

    const applyBadgeToTitle = () => {
      const rawTitle = document.title || 'Avalia Solar';

      // Captura o título base sem o prefixo (N)
      const cleanTitle = rawTitle.replace(/^\(\d+\+?\)\s*/, '');
      if (cleanTitle && !cleanTitle.startsWith('(')) {
        originalTitleRef.current = cleanTitle;
      }

      const baseTitle = originalTitleRef.current || cleanTitle || 'Avalia Solar';

      if (totalUnread > 0) {
        const badge = totalUnread > 99 ? '(99+)' : `(${totalUnread})`;
        const newTitle = `${badge} ${baseTitle}`;
        if (document.title !== newTitle) {
          document.title = newTitle;
        }
      } else {
        if (document.title !== baseTitle && document.title.startsWith('(')) {
          document.title = baseTitle;
        }
      }
    };

    applyBadgeToTitle();

    // 3. Observer para capturar mudanças no <title> causadas por trocas de rota no Next.js
    const titleElement = document.querySelector('title');
    if (!titleElement) return;

    const observer = new MutationObserver(() => {
      const currentTitle = document.title;
      // Se o Next.js alterou o título para algo sem prefixo de badge, atualizamos o título base
      if (!currentTitle.startsWith('(')) {
        originalTitleRef.current = currentTitle;
        applyBadgeToTitle();
      }
    });

    observer.observe(titleElement, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [unreadCount, unreadMessagesCount]);

  return null;
}

export default TabNotificationNotifier;
