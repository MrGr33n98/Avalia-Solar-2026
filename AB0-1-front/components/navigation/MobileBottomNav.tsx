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
    'group relative flex min-w-0 flex-col items-center justify-center ' +
    'gap-[2px] outline-none transition-all duration-200 ' +
    'focus-visible:ring-2 focus-visible:ring-blue-500/40 ' +
    'focus-visible:ring-offset-1 focus-visible:ring-offset-white';

  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        'fixed inset-x-0 bottom-0 z-[1000] md:hidden',

        /*
         * FooterBar branca, limpa e premium.
         */
        'h-[64px]',
        'bg-white/95',
        'border-t border-slate-200/80',
        'backdrop-blur-xl',

        /*
         * Sombra leve para separar do conteúdo.
         */
        'shadow-[0_-8px_30px_-18px_rgba(15,23,42,0.32)]',

        /*
         * Safe area para iOS / PWA.
         */
        'pb-[max(0.125rem,var(--sab,env(safe-area-inset-bottom)))]'
      )}
    >
      {/* Linha superior sutil */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-x-0 top-0 h-px
          bg-gradient-to-r
          from-transparent
          via-slate-300/60
          to-transparent
        "
      />

      <div
        className="
          relative
          mx-auto
          grid
          h-full
          max-w-md
          grid-cols-5
          items-end
          px-2
        "
      >
        {/* ======================================================
            1. INÍCIO
        ====================================================== */}
        <Link
          href="/"
          aria-current={isHomeActive ? 'page' : undefined}
          className={cn(
            commonItemClass,
            'h-[56px] rounded-xl pb-[6px] pt-[7px]',

            isHomeActive
              ? 'text-blue-600'
              : 'text-slate-600 hover:text-slate-950'
          )}
        >
          <Home
            className="h-[20px] w-[20px]"
            strokeWidth={isHomeActive ? 2.25 : 1.8}
          />

          <span
            className={cn(
              'truncate text-[9px] leading-none',

              isHomeActive
                ? 'font-semibold text-blue-600'
                : 'font-medium text-slate-600'
            )}
          >
            Início
          </span>

          {isHomeActive && (
            <span
              aria-hidden="true"
              className="
                absolute
                bottom-[1px]
                h-[2px]
                w-[14px]
                rounded-full
                bg-blue-600
              "
            />
          )}
        </Link>

        {/* ======================================================
            2. EMPRESAS
        ====================================================== */}
        <Link
          href="/companies"
          aria-current={isCompaniesActive ? 'page' : undefined}
          className={cn(
            commonItemClass,
            'h-[56px] rounded-xl pb-[6px] pt-[7px]',

            isCompaniesActive
              ? 'text-blue-600'
              : 'text-slate-600 hover:text-slate-950'
          )}
        >
          <Building2
            className="h-[20px] w-[20px]"
            strokeWidth={isCompaniesActive ? 2.25 : 1.8}
          />

          <span
            className={cn(
              'truncate text-[9px] leading-none',

              isCompaniesActive
                ? 'font-semibold text-blue-600'
                : 'font-medium text-slate-600'
            )}
          >
            Empresas
          </span>

          {isCompaniesActive && (
            <span
              aria-hidden="true"
              className="
                absolute
                bottom-[1px]
                h-[2px]
                w-[14px]
                rounded-full
                bg-blue-600
              "
            />
          )}
        </Link>

        {/* ======================================================
            3. BUSCAR
            ÚNICA ASSIMETRIA DA FOOTERBAR
        ====================================================== */}
        <div
          className="
            relative
            flex
            h-[64px]
            min-w-0
            flex-col
            items-center
          "
        >
          {/*
            Peça branca que cria o efeito de encaixe/curva
            exclusivamente no Buscar.
          */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -top-[17px]

              h-[66px]
              w-[78px]

              rounded-[50%]

              bg-white

              border-t
              border-slate-200/80

              shadow-[0_-5px_14px_-12px_rgba(15,23,42,0.20)]
            "
          />

          <button
            type="button"
            onClick={() =>
              router.push('/companies?focus=search')
            }
            aria-label="Buscar empresas e categorias"
            className={cn(
              'absolute -top-[10px] z-10',

              'flex h-[48px] w-[48px]',
              'items-center justify-center',

              'rounded-full',

              'bg-gradient-to-b',
              'from-[#3B82F6]',
              'via-[#2563EB]',
              'to-[#1D4ED8]',

              'text-white',

              /*
               * Ring branco integra o FAB à FooterBar.
               */
              'ring-[4px] ring-white',

              /*
               * Sombra azul controlada.
               */
              'shadow-[0_7px_18px_rgba(37,99,235,0.30)]',

              'outline-none',

              'transition-[transform,box-shadow] duration-200 ease-out',

              'hover:shadow-[0_9px_22px_rgba(37,99,235,0.36)]',

              'active:scale-[0.94]',

              'focus-visible:outline',
              'focus-visible:outline-2',
              'focus-visible:outline-offset-2',
              'focus-visible:outline-blue-500'
            )}
          >
            <Search
              className="h-[21px] w-[21px]"
              strokeWidth={2.25}
            />

            {/* Reflexo superior */}
            <span
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                left-[12px]
                right-[12px]
                top-[5px]
                h-px
                rounded-full
                bg-white/35
              "
            />
          </button>

          <span
            className="
              absolute
              bottom-[6px]
              text-[9px]
              font-semibold
              leading-none
              text-slate-900
            "
          >
            Buscar
          </span>
        </div>

        {/* ======================================================
            4. COMPARAR
            Circunferência menor, sem interferir na label.
        ====================================================== */}
        <button
          type="button"
          onClick={handleComparisonClick}
          aria-label={`Comparar: ${count} de ${maxComparison} empresas selecionadas`}
          aria-disabled={count === 0}
          className={cn(
            commonItemClass,
            'h-[56px] rounded-xl pb-[6px] pt-[7px]',

            isCompareActive
              ? 'text-blue-600'
              : 'text-slate-600 hover:text-slate-950'
          )}
        >
          <span
            className="
              relative
              mb-[2px]
              flex
              h-[22px]
              w-[30px]
              items-center
              justify-center
            "
          >
            <AnimatedCompareIcon
              size={22}
              variant="default"
              animated
              intensity={count > 0 ? 'strong' : 'subtle'}
              active={isCompareActive}
              aria-hidden="true"
            />

            {/* Badge menor e mais próximo do ícone */}
            {count > 0 && (
              <span
                aria-live="polite"
                className="
                  absolute
                  -right-[2px]
                  -top-[4px]

                  z-20

                  flex
                  h-[13px]
                  min-w-[13px]
                  items-center
                  justify-center

                  rounded-full

                  bg-blue-600
                  px-[2px]

                  text-[7px]
                  font-bold
                  leading-none
                  text-white

                  ring-[1.5px]
                  ring-white

                  shadow-[0_2px_5px_rgba(37,99,235,0.22)]
                "
              >
                {count}
              </span>
            )}
          </span>

          <span
            className={cn(
              'truncate text-[9px] leading-none',

              isCompareActive
                ? 'font-semibold text-blue-600'
                : 'font-medium text-slate-600'
            )}
          >
            Comparar
          </span>

          {isCompareActive && (
            <span
              aria-hidden="true"
              className="
                absolute
                bottom-[1px]
                h-[2px]
                w-[14px]
                rounded-full
                bg-blue-600
              "
            />
          )}
        </button>

        {/* ======================================================
            5. MENSAGENS
        ====================================================== */}
        <button
          type="button"
          onClick={() => toggleChat('expanded')}
          aria-label="Abrir mensagens"
          className={cn(
            commonItemClass,
            'h-[56px] rounded-xl pb-[6px] pt-[7px]',

            isMessagesActive
              ? 'text-blue-600'
              : 'text-slate-600 hover:text-slate-950'
          )}
        >
          <span
            className="
              relative
              flex
              h-[22px]
              w-[28px]
              items-center
              justify-center
            "
          >
            <MessageCircle
              className="h-[20px] w-[20px]"
              strokeWidth={isMessagesActive ? 2.25 : 1.8}
            />

            {unreadMessagesCount > 0 && (
              <span
                aria-live="polite"
                aria-label={`${unreadMessagesCount} mensagens não lidas`}
                className="
                  absolute
                  -right-[1px]
                  -top-[1px]

                  h-[6px]
                  w-[6px]

                  rounded-full

                  bg-blue-600

                  ring-[1.5px]
                  ring-white
                "
              />
            )}
          </span>

          <span
            className={cn(
              'truncate text-[9px] leading-none',

              isMessagesActive
                ? 'font-semibold text-blue-600'
                : 'font-medium text-slate-600'
            )}
          >
            Mensagens
          </span>

          {isMessagesActive && (
            <span
              aria-hidden="true"
              className="
                absolute
                bottom-[1px]
                h-[2px]
                w-[14px]
                rounded-full
                bg-blue-600
              "
            />
          )}
        </button>
      </div>
    </nav>
  );
}