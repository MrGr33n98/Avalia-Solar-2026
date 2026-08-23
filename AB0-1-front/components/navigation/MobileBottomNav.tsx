'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Building2, Home, MessageCircle, Search } from 'lucide-react';
import { AnimatedCompareIcon } from '@/components/icons/AnimatedCompareIcon';
import { useComparison } from '@/hooks/useComparison';
import { openComparisonModal } from '@/lib/floating-widget-events';
import { useNotificationStore } from '@/store/notificationStore';
import { cn } from '@/lib/utils';

import { useEffect } from 'react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { count, maxComparison } = useComparison();
  const { unreadMessagesCount, fetchUnreadMessagesCount, toggleChat } = useNotificationStore();

  useEffect(() => {
    fetchUnreadMessagesCount();
  }, [fetchUnreadMessagesCount]);

  const handleComparisonClick = () => {
    if (count > 0) openComparisonModal();
  };

  const isInternalProfile =
    pathname === '/profile' ||
    pathname === '/review-dashboard' ||
    pathname.startsWith('/review-dashboard/') ||
    pathname === '/creator-studio' ||
    pathname.startsWith('/creator-studio/');
  if (isInternalProfile) return null;
  if (pathname?.startsWith('/dashboard')) return null;
  if (pathname === '/review-dashboard' || pathname?.startsWith('/review-dashboard/')) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[1000] border-t border-slate-200 bg-white/95 px-2 pb-[max(0.125rem,var(--sab,env(safe-area-inset-bottom)))] pt-0.5 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.15)] backdrop-blur-xl md:hidden h-[52px]">
      <div className="mx-auto grid max-w-md grid-cols-5 items-center h-full">
        {/* 1. Início */}
        <Link
          href="/"
          className={cn(
            'relative flex h-10 min-h-10 min-w-0 flex-col items-center justify-center rounded-xl px-1 text-[10px] font-semibold leading-none transition-all',
            pathname === '/'
              ? 'text-blue-700 bg-blue-50/70 ring-1 ring-blue-500/10'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          )}
        >
          <Home className="h-[20px] w-[20px]" strokeWidth={pathname === '/' ? 2.5 : 2} />
          <span className="truncate mt-0.5 text-[10px]">Início</span>
        </Link>

        {/* 2. Empresas */}
        <Link
          href="/companies"
          className={cn(
            'relative flex h-10 min-h-10 min-w-0 flex-col items-center justify-center rounded-xl px-1 text-[10px] font-semibold leading-none transition-all',
            pathname.startsWith('/companies')
              ? 'text-blue-700 bg-blue-50/70 ring-1 ring-blue-500/10'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          )}
        >
          <Building2
            className="h-[20px] w-[20px]"
            strokeWidth={pathname.startsWith('/companies') ? 2.5 : 2}
          />
          <span className="truncate mt-0.5 text-[10px]">Empresas</span>
        </Link>

        {/* 3. FAB Central Elevado - Buscar */}
        <div className="relative flex flex-col items-center justify-center h-full">
          <button
            type="button"
            onClick={() => router.push('/companies?focus=search')}
            aria-label="Buscar empresas e categorias"
            className="absolute -top-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-[2.5px] ring-white transition-transform active:scale-95"
          >
            <Search className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <span className="mt-7 text-[10px] font-bold leading-none text-blue-700">Buscar</span>
        </div>

        {/* 4. Comparar */}
        <button
          type="button"
          onClick={handleComparisonClick}
          aria-label={`Comparar: ${count} de ${maxComparison} empresas selecionadas`}
          aria-disabled={count === 0}
          className={cn(
            'relative flex h-10 min-h-10 min-w-0 flex-col items-center justify-center rounded-xl px-1 text-[10px] font-semibold leading-none transition-all',
            pathname.startsWith('/products/compare')
              ? 'text-blue-700 bg-blue-50/70 ring-1 ring-blue-500/10'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          )}
        >
          <AnimatedCompareIcon
            size={19}
            active={pathname.startsWith('/products/compare')}
            aria-hidden="true"
          />
          <span className="truncate mt-0.5 text-[10px]">Comparar</span>
          {count > 0 && (
            <span
              className="absolute right-1 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-blue-600 px-0.5 text-[8px] font-black leading-none text-white ring-2 ring-white"
              aria-live="polite"
            >
              {count}
            </span>
          )}
        </button>

        {/* 5. Mensagens */}
        <button
          type="button"
          onClick={() => toggleChat('expanded')}
          aria-label="Abrir mensagens"
          className={cn(
            'relative flex h-10 min-h-10 min-w-0 flex-col items-center justify-center rounded-xl px-1 text-[10px] font-semibold leading-none transition-all',
            pathname.startsWith('/messages')
              ? 'text-blue-700 bg-blue-50/70 ring-1 ring-blue-500/10'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          )}
        >
          <MessageCircle
            className="h-[20px] w-[20px]"
            strokeWidth={pathname.startsWith('/messages') ? 2.5 : 2}
          />
          <span className="truncate mt-0.5 text-[10px]">Mensagens</span>
          {unreadMessagesCount > 0 && (
            <span
              className="absolute right-1 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-600 px-0.5 text-[8px] font-black leading-none text-white ring-2 ring-white"
              aria-live="polite"
            >
              {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
