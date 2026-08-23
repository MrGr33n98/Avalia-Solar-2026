'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Home,
  MessageCircle,
  Search,
} from 'lucide-react';
import {
  usePathname,
  useRouter,
} from 'next/navigation';

import { AnimatedCompareIcon } from '@/components/icons/AnimatedCompareIcon';
import { useComparison } from '@/hooks/useComparison';
import { openComparisonModal } from '@/lib/floating-widget-events';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/store/notificationStore';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const {
    count,
    maxComparison,
  } = useComparison();

  const {
    unreadMessagesCount,
    fetchUnreadMessagesCount,
    toggleChat,
  } = useNotificationStore();

  useEffect(() => {
    fetchUnreadMessagesCount();
  }, [fetchUnreadMessagesCount]);

  const handleComparisonClick = () => {
    if (count > 0) {
      openComparisonModal();
    }
  };

  const isInternalProfile =
    pathname === '/profile' ||
    pathname === '/review-dashboard' ||
    pathname.startsWith('/review-dashboard/') ||
    pathname === '/creator-studio' ||
    pathname.startsWith('/creator-studio/');

  if (isInternalProfile) {
    return null;
  }

  if (pathname?.startsWith('/dashboard')) {
    return null;
  }

  if (
    pathname === '/review-dashboard' ||
    pathname?.startsWith('/review-dashboard/')
  ) {
    return null;
  }

  const isHomeActive = pathname === '/';

  const isCompaniesActive =
    pathname.startsWith('/companies');

  const isCompareActive =
    pathname.startsWith('/products/compare') ||
    pathname === '/compare' ||
    pathname.startsWith('/compare/');

  const isMessagesActive =
    pathname.startsWith('/messages');

  const commonItemClass =
    'group relative flex min-w-0 flex-col items-center justify-center gap-[3px] ' +
    'outline-none transition-colors duration-200 ' +
    'focus-visible:ring-2 focus-visible:ring-blue-400/60 ' +
    'focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F18]';

  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        'fixed inset-x-0 bottom-0 z-[1000] md:hidden',

        /*
         * Superfície premium dark.
         * Somente a FooterBar é escura.
         */
        'border-t border-white/[0.07]',
        'bg-[#090E16]/[0.985]',
        'shadow-[0_-10px_32px_-15px_rgba(2,6,23,0.55)]',
        'backdrop-blur-xl',

        /*
         * Altura útil + safe-area.
         */
        'h-[72px]',
        'pb-[max(0.25rem,var(--sab,env(safe-area-inset-bottom)))]'
      )}
    >
      {/* Highlight superior quase imperceptível */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent"
      />

      {/* Gradiente interno para profundidade */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.025] via-transparent to-black/10"
      />

      <div className="relative mx-auto grid h-full max-w-md grid-cols-5 items-end px-2">
        {/* ======================================================
            1. INÍCIO
        ====================================================== */}
        <Link
          href="/"
          aria-current={
            isHomeActive
              ? 'page'
              : undefined
          }
          className={cn(
            commonItemClass,
            'h-[62px] rounded-2xl pb-[9px] pt-[7px]',

            isHomeActive
              ? 'text-blue-400'
              : 'text-slate-400 hover:text-slate-200'
          )}
        >
          <span
            className={cn(
              'relative flex h-7 w-9 items-center justify-center rounded-xl transition-all duration-200',

              isHomeActive &&
                'bg-blue-500/[0.08]'
            )}
          >
            <Home
              className="h-[21px] w-[21px]"
              strokeWidth={
                isHomeActive
                  ? 2.35
                  : 1.8
              }
            />
          </span>

          <span
            className={cn(
              'max-w-full truncate text-[10px] leading-none tracking-[-0.01em]',

              isHomeActive
                ? 'font-semibold text-blue-400'
                : 'font-medium text-slate-400'
            )}
          >
            Início
          </span>

          {isHomeActive && (
            <span
              aria-hidden="true"
              className="absolute bottom-[3px] h-[3px] w-[3px] rounded-full bg-blue-400 shadow-[0_0_7px_rgba(96,165,250,0.8)]"
            />
          )}
        </Link>

        {/* ======================================================
            2. EMPRESAS
        ====================================================== */}
        <Link
          href="/companies"
          aria-current={
            isCompaniesActive
              ? 'page'
              : undefined
          }
          className={cn(
            commonItemClass,
            'h-[62px] rounded-2xl pb-[9px] pt-[7px]',

            isCompaniesActive
              ? 'text-blue-400'
              : 'text-slate-400 hover:text-slate-200'
          )}
        >
          <span
            className={cn(
              'relative flex h-7 w-9 items-center justify-center rounded-xl transition-all duration-200',

              isCompaniesActive &&
                'bg-blue-500/[0.08]'
            )}
          >
            <Building2
              className="h-[21px] w-[21px]"
              strokeWidth={
                isCompaniesActive
                  ? 2.35
                  : 1.8
              }
            />
          </span>

          <span
            className={cn(
              'max-w-full truncate text-[10px] leading-none tracking-[-0.01em]',

              isCompaniesActive
                ? 'font-semibold text-blue-400'
                : 'font-medium text-slate-400'
            )}
          >
            Empresas
          </span>

          {isCompaniesActive && (
            <span
              aria-hidden="true"
              className="absolute bottom-[3px] h-[3px] w-[3px] rounded-full bg-blue-400 shadow-[0_0_7px_rgba(96,165,250,0.8)]"
            />
          )}
        </Link>

        {/* ======================================================
            3. BUSCAR

            ÚNICO elemento que rompe verticalmente a silhueta.
        ====================================================== */}
        <div className="relative flex h-[72px] min-w-0 flex-col items-center">
          {/*
           * Halo recortado.
           *
           * Tem a mesma cor da FooterBar para criar o efeito
           * de notch/assimetria SOMENTE na busca.
           */}
          <div
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute -top-[18px]',
              'h-[72px] w-[72px] rounded-full',
              'bg-[#090E16]',
              'ring-1 ring-white/[0.06]'
            )}
          />

          <button
            type="button"
            onClick={() =>
              router.push(
                '/companies?focus=search'
              )
            }
            aria-label="Buscar empresas e categorias"
            className={cn(
              'absolute -top-[14px] z-10',
              'flex h-[58px] w-[58px] items-center justify-center',
              'rounded-full',

              /*
               * Azul Prime com profundidade.
               */
              'border border-blue-300/20',
              'bg-gradient-to-b from-[#3982FF] via-[#2563EB] to-[#1D4ED8]',
              'text-white',

              /*
               * Ring escuro conecta o botão à barra.
               */
              'ring-[5px] ring-[#090E16]',

              /*
               * Glow controlado.
               */
              'shadow-[0_10px_28px_rgba(37,99,235,0.38),0_0_20px_rgba(59,130,246,0.12)]',

              'outline-none',
              'transition-[transform,box-shadow] duration-200 ease-out',
              'active:scale-[0.94]',
              'hover:shadow-[0_12px_30px_rgba(37,99,235,0.44),0_0_24px_rgba(59,130,246,0.15)]',
              'focus-visible:ring-[5px] focus-visible:ring-[#090E16]',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400'
            )}
          >
            <Search
              className="h-[26px] w-[26px]"
              strokeWidth={2.15}
            />

            {/* reflexo premium */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-[14px] top-[6px] h-px rounded-full bg-white/30"
            />
          </button>

          <span className="absolute bottom-[7px] text-[10px] font-semibold leading-none tracking-[-0.01em] text-blue-400">
            Buscar
          </span>
        </div>

        {/* ======================================================
            4. COMPARAR

            Circunferência animada, mas NÃO rompe a FooterBar.
        ====================================================== */}
        <button
          type="button"
          onClick={handleComparisonClick}
          aria-label={`Comparar: ${count} de ${maxComparison} empresas selecionadas`}
          aria-disabled={
            count === 0
          }
          className={cn(
            commonItemClass,
            'h-[62px] rounded-2xl pb-[9px] pt-[7px]',

            isCompareActive
              ? 'text-amber-300'
              : count > 0
                ? 'text-amber-200'
                : 'text-slate-400 hover:text-slate-200'
          )}
        >
          <span className="relative flex h-7 w-10 items-center justify-center">
            {/*
             * Glow externo.
             * Não muda dimensões/layout da barra.
             */}
            {count > 0 && (
              <span
                aria-hidden="true"
                className={cn(
                  'pointer-events-none absolute h-[38px] w-[38px] rounded-full',
                  'border border-amber-400/15',
                  'shadow-[0_0_16px_rgba(250,204,21,0.07)]',

                  'motion-safe:animate-pulse motion-reduce:animate-none'
                )}
              />
            )}

            <AnimatedCompareIcon
              size={32}
              variant="solar"
              animated
              intensity={
                count > 0
                  ? 'strong'
                  : 'subtle'
              }
              active={isCompareActive}
              aria-hidden="true"
            />

            {/* Contador */}
            {count > 0 && (
              <span
                aria-live="polite"
                className={cn(
                  'absolute -right-[3px] -top-[6px] z-20',
                  'flex h-[17px] min-w-[17px] items-center justify-center',
                  'rounded-full px-1',
                  'bg-amber-400',
                  'text-[9px] font-extrabold leading-none text-[#111827]',
                  'ring-[2px] ring-[#090E16]',
                  'shadow-[0_2px_8px_rgba(245,158,11,0.35)]'
                )}
              >
                {count}
              </span>
            )}
          </span>

          <span
            className={cn(
              'max-w-full truncate text-[10px] leading-none tracking-[-0.01em]',

              isCompareActive || count > 0
                ? 'font-semibold text-amber-300'
                : 'font-medium text-slate-400'
            )}
          >
            Comparar
          </span>

          {isCompareActive && (
            <span
              aria-hidden="true"
              className="absolute bottom-[3px] h-[3px] w-[3px] rounded-full bg-amber-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]"
            />
          )}
        </button>

        {/* ======================================================
            5. MENSAGENS
        ====================================================== */}
        <button
          type="button"
          onClick={() =>
            toggleChat('expanded')
          }
          aria-label="Abrir mensagens"
          className={cn(
            commonItemClass,
            'h-[62px] rounded-2xl pb-[9px] pt-[7px]',

            isMessagesActive
              ? 'text-blue-400'
              : 'text-slate-400 hover:text-slate-200'
          )}
        >
          <span className="relative flex h-7 w-9 items-center justify-center">
            <MessageCircle
              className="h-[21px] w-[21px]"
              strokeWidth={
                isMessagesActive
                  ? 2.35
                  : 1.8
              }
            />

            {unreadMessagesCount > 0 && (
              <span
                aria-live="polite"
                aria-label={`${unreadMessagesCount} mensagens não lidas`}
                className={cn(
                  'absolute -right-[1px] top-[1px]',
                  'h-[7px] w-[7px] rounded-full',
                  'bg-blue-500',
                  'ring-2 ring-[#090E16]',
                  'shadow-[0_0_8px_rgba(59,130,246,0.75)]'
                )}
              />
            )}
          </span>

          <span
            className={cn(
              'max-w-full truncate text-[10px] leading-none tracking-[-0.01em]',

              isMessagesActive
                ? 'font-semibold text-blue-400'
                : 'font-medium text-slate-400'
            )}
          >
            Mensagens
          </span>

          {isMessagesActive && (
            <span
              aria-hidden="true"
              className="absolute bottom-[3px] h-[3px] w-[3px] rounded-full bg-blue-400 shadow-[0_0_7px_rgba(96,165,250,0.8)]"
            />
          )}
        </button>
      </div>
    </nav>
  );
}