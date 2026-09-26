'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Building2, Home, MessageCircle, Search } from 'lucide-react';

import { AnimatedCompareIcon } from '@/components/icons/AnimatedCompareIcon';
import { useComparison } from '@/hooks/useComparison';
import { useAuth } from '@/contexts/AuthContext';
import { useVirtualKeyboard } from '@/hooks/useVirtualKeyboard';
import { useMobileNavNotifications } from '@/hooks/useMobileNavNotifications';
import { openComparisonModal } from '@/lib/floating-widget-events';
import { cn } from '@/lib/utils';
import { shouldHideMobileNav, MOBILE_NAV_HEIGHT } from './mobileNavTokens';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const { count } = useComparison();
  const { isAuthenticated } = useAuth();
  const { isKeyboardOpen } = useVirtualKeyboard();
  const { unreadMessagesCount, toggleChat } = useMobileNavNotifications();

  // Estados ativos
  const isHomeActive = pathname === '/';
  const isCompaniesActive =
    (pathname === '/companies' || pathname?.startsWith('/companies/')) &&
    !pathname?.startsWith('/companies/compare');
  const isSearchActive = pathname === '/search' || pathname?.startsWith('/search/');
  const isCompareActive =
    pathname === '/compare' ||
    pathname?.startsWith('/compare/') ||
    pathname?.startsWith('/products/compare');
  const isMessagesActive = pathname === '/messages' || pathname?.startsWith('/messages/');

  // Ações sem dead-actions
  const handleSearchClick = useCallback(() => {
    if (isSearchActive) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const searchInput = document.querySelector<HTMLInputElement>(
        'input[type="search"], input[name="q"], input[placeholder*="Buscar"]'
      );
      if (searchInput) {
        searchInput.focus();
      }
    } else {
      router.push('/search');
    }
  }, [isSearchActive, router]);

  const handleComparisonClick = useCallback(() => {
    if (count > 0) {
      openComparisonModal();
    } else {
      router.push('/compare');
    }
  }, [count, router]);

  const handleMessagesClick = useCallback(() => {
    if (isAuthenticated) {
      toggleChat('expanded');
    } else {
      router.push('/login?redirect=/chat');
    }
  }, [isAuthenticated, router, toggleChat]);

  // Ocultar em rotas específicas (dashboard, reviewer, chat, etc.)
  if (shouldHideMobileNav(pathname)) {
    return null;
  }

  const commonItemClass =
    'group relative flex h-full w-full min-w-0 flex-col items-center justify-center ' +
    'gap-1 py-1 outline-none transition-colors duration-200 ' +
    'focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-1 ' +
    'focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 rounded-xl';

  return (
    <nav
      role="navigation"
      aria-label="Navegação principal"
      data-testid="mobile-bottom-nav"
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 md:hidden',
        'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl',
        'border-t border-slate-200/80 dark:border-slate-800',
        'shadow-[0_-4px_20px_-4px_rgba(15,23,42,0.08)] dark:shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.4)]',
        'transition-transform duration-200 ease-out',
        isKeyboardOpen && 'translate-y-full opacity-0 pointer-events-none'
      )}
    >
      {/* Linha superior com gradiente sutil */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent"
      />

      {/* Grid de 5 colunas com altura fixa e compacta */}
      <div
        className="relative mx-auto grid max-w-md grid-cols-5 items-center px-1"
        style={{ height: `${MOBILE_NAV_HEIGHT}px` }}
      >
        {/* ======================================================
            1. INÍCIO
        ====================================================== */}
        <Link
          href="/"
          aria-current={isHomeActive ? 'page' : undefined}
          aria-label="Ir para a página inicial"
          data-testid="mobile-nav-home"
          className={commonItemClass}
        >
          <Home
            className={cn(
              'h-5 w-5 transition-transform duration-150 group-active:scale-90',
              isHomeActive
                ? 'text-blue-600 dark:text-blue-400 stroke-[2.25]'
                : 'text-slate-500 dark:text-slate-400 stroke-[1.75] group-hover:text-slate-800 dark:group-hover:text-slate-200'
            )}
          />

          <span
            className={cn(
              'truncate text-[11px] leading-tight transition-colors',
              isHomeActive
                ? 'font-semibold text-blue-600 dark:text-blue-400'
                : 'font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'
            )}
          >
            Início
          </span>

          {isHomeActive && (
            <span
              aria-hidden="true"
              className="absolute bottom-1 h-[2.5px] w-4 rounded-full bg-blue-600 dark:bg-blue-400"
            />
          )}
        </Link>

        {/* ======================================================
            2. EMPRESAS
        ====================================================== */}
        <Link
          href="/companies"
          prefetch={true}
          aria-current={isCompaniesActive ? 'page' : undefined}
          aria-label="Explorar empresas de energia solar"
          data-testid="mobile-nav-companies"
          className={commonItemClass}
        >
          <Building2
            className={cn(
              'h-5 w-5 transition-transform duration-150 group-active:scale-90',
              isCompaniesActive
                ? 'text-blue-600 dark:text-blue-400 stroke-[2.25]'
                : 'text-slate-500 dark:text-slate-400 stroke-[1.75] group-hover:text-slate-800 dark:group-hover:text-slate-200'
            )}
          />

          <span
            className={cn(
              'truncate text-[11px] leading-tight transition-colors',
              isCompaniesActive
                ? 'font-semibold text-blue-600 dark:text-blue-400'
                : 'font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'
            )}
          >
            Empresas
          </span>

          {isCompaniesActive && (
            <span
              aria-hidden="true"
              className="absolute bottom-1 h-[2.5px] w-4 rounded-full bg-blue-600 dark:bg-blue-400"
            />
          )}
        </Link>

        {/* ======================================================
            3. BUSCAR
        ====================================================== */}
        <button
          type="button"
          onClick={handleSearchClick}
          aria-label="Buscar empresas, produtos e categorias"
          aria-current={isSearchActive ? 'page' : undefined}
          data-testid="mobile-nav-search"
          className={commonItemClass}
        >
          <Search
            className={cn(
              'h-5 w-5 transition-transform duration-150 group-active:scale-90',
              isSearchActive
                ? 'text-blue-600 dark:text-blue-400 stroke-[2.25]'
                : 'text-slate-500 dark:text-slate-400 stroke-[1.75] group-hover:text-slate-800 dark:group-hover:text-slate-200'
            )}
          />

          <span
            className={cn(
              'truncate text-[11px] leading-tight transition-colors',
              isSearchActive
                ? 'font-semibold text-blue-600 dark:text-blue-400'
                : 'font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'
            )}
          >
            Buscar
          </span>

          {isSearchActive && (
            <span
              aria-hidden="true"
              className="absolute bottom-1 h-[2.5px] w-4 rounded-full bg-blue-600 dark:bg-blue-400"
            />
          )}
        </button>

        {/* ======================================================
            4. COMPARAR
        ====================================================== */}
        <button
          type="button"
          onClick={handleComparisonClick}
          aria-label={`Comparar: ${count} empresas selecionadas`}
          aria-current={isCompareActive ? 'page' : undefined}
          data-testid="mobile-nav-compare"
          className={commonItemClass}
        >
          <span className="relative flex h-5 w-5 items-center justify-center">
            <AnimatedCompareIcon
              size={20}
              variant="default"
              animated
              intensity={count > 0 ? 'strong' : 'subtle'}
              active={isCompareActive}
              aria-hidden="true"
            />

            {count > 0 && (
              <span
                aria-live="polite"
                aria-label={`${count} empresas selecionadas`}
                data-testid="compare-badge"
                className={cn(
                  'absolute -top-1 -right-2 z-10 flex h-4 min-w-4 px-1 items-center justify-center',
                  'rounded-full bg-blue-600 text-white text-[10px] font-bold leading-none',
                  'ring-2 ring-white dark:ring-slate-900 shadow-sm animate-in zoom-in-75 duration-200'
                )}
              >
                {count > 9 ? '9+' : count}
              </span>
            )}
          </span>

          <span
            className={cn(
              'truncate text-[11px] leading-tight transition-colors',
              isCompareActive
                ? 'font-semibold text-blue-600 dark:text-blue-400'
                : 'font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'
            )}
          >
            Comparar
          </span>

          {isCompareActive && (
            <span
              aria-hidden="true"
              className="absolute bottom-1 h-[2.5px] w-4 rounded-full bg-blue-600 dark:bg-blue-400"
            />
          )}
        </button>

        {/* ======================================================
            5. MENSAGENS
        ====================================================== */}
        <button
          type="button"
          onClick={handleMessagesClick}
          aria-label={
            unreadMessagesCount > 0
              ? `Mensagens: ${unreadMessagesCount} não lidas`
              : 'Abrir mensagens e atendimento'
          }
          aria-current={isMessagesActive ? 'page' : undefined}
          data-testid="mobile-nav-messages"
          className={commonItemClass}
        >
          <span className="relative flex h-5 w-5 items-center justify-center">
            <MessageCircle
              className={cn(
                'h-5 w-5 transition-transform duration-150 group-active:scale-90',
                isMessagesActive
                  ? 'text-blue-600 dark:text-blue-400 stroke-[2.25]'
                  : 'text-slate-500 dark:text-slate-400 stroke-[1.75] group-hover:text-slate-800 dark:group-hover:text-slate-200'
              )}
            />

            {unreadMessagesCount > 0 && (
              <span
                aria-live="polite"
                aria-label={`${unreadMessagesCount} mensagens não lidas`}
                data-testid="messages-badge"
                className={cn(
                  'absolute -top-1 -right-2 z-10 flex h-4 min-w-4 px-1 items-center justify-center',
                  'rounded-full bg-blue-600 text-white text-[10px] font-bold leading-none',
                  'ring-2 ring-white dark:ring-slate-900 shadow-sm animate-in zoom-in-75 duration-200'
                )}
              >
                {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
              </span>
            )}
          </span>

          <span
            className={cn(
              'truncate text-[11px] leading-tight transition-colors',
              isMessagesActive
                ? 'font-semibold text-blue-600 dark:text-blue-400'
                : 'font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'
            )}
          >
            Mensagens
          </span>

          {isMessagesActive && (
            <span
              aria-hidden="true"
              className="absolute bottom-1 h-[2.5px] w-4 rounded-full bg-blue-600 dark:bg-blue-400"
            />
          )}
        </button>
      </div>

      {/* Safe Area Spacer: garante continuidade do fundo branco em dispositivos com Home Indicator sem comprimir a barra */}
      <div
        aria-hidden="true"
        className="h-[var(--safe-area-inset-bottom,0px)] w-full pointer-events-none"
      />
    </nav>
  );
}