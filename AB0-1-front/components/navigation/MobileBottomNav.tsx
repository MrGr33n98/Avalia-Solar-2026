'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeftRight, Building2, Home, MessageCircle, Search } from 'lucide-react';
import { useComparison } from '@/hooks/useComparison';
import { openComparisonModal } from '@/lib/floating-widget-events';
import { useNotificationStore } from '@/store/notificationStore';
import { cn } from '@/lib/utils';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { count, maxComparison } = useComparison();
  const { unreadMessagesCount, toggleChat } = useNotificationStore();

  const handleComparisonClick = () => {
    if (count > 0) openComparisonModal();
  };

  const isInternalProfile =
    pathname === '/profile' ||
    pathname === '/review-dashboard' ||
    pathname.startsWith('/review-dashboard/');
  if (isInternalProfile) return null;
  if (pathname?.startsWith('/dashboard')) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[1000] border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,var(--sab,env(safe-area-inset-bottom)))] pt-2 shadow-[0_-12px_32px_-16px_rgba(15,23,42,0.22)] backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-0.5 items-center">
        {/* 1. Início */}
        <Link
          href="/"
          className={cn(
            'relative flex min-h-[52px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1 text-[10px] font-extrabold transition-all',
            pathname === '/'
              ? 'text-blue-700 bg-blue-50/70 ring-1 ring-blue-500/10'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          )}
        >
          <Home className="h-5 w-5" strokeWidth={pathname === '/' ? 2.5 : 2} />
          <span className="truncate">Início</span>
        </Link>

        {/* 2. Empresas */}
        <Link
          href="/companies"
          className={cn(
            'relative flex min-h-[52px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1 text-[10px] font-extrabold transition-all',
            pathname.startsWith('/companies')
              ? 'text-blue-700 bg-blue-50/70 ring-1 ring-blue-500/10'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          )}
        >
          <Building2 className="h-5 w-5" strokeWidth={pathname.startsWith('/companies') ? 2.5 : 2} />
          <span className="truncate">Empresas</span>
        </Link>

        {/* 3. FAB Central Elevado - Buscar */}
        <div className="relative flex flex-col items-center justify-center">
          <button
            type="button"
            onClick={() => router.push('/companies?focus=search')}
            aria-label="Buscar empresas e categorias"
            className="absolute -top-6 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-4 ring-white active:scale-95 transition-transform"
          >
            <Search className="h-6 w-6" strokeWidth={2.5} />
          </button>
          <span className="mt-7 text-[10px] font-black text-blue-700">Buscar</span>
        </div>

        {/* 4. Comparar */}
        <button
          type="button"
          onClick={handleComparisonClick}
          aria-label={`Comparar: ${count} de ${maxComparison} empresas selecionadas`}
          aria-disabled={count === 0}
          className={cn(
            'relative flex min-h-[52px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1 text-[10px] font-extrabold transition-all',
            pathname.startsWith('/products/compare')
              ? 'text-blue-700 bg-blue-50/70 ring-1 ring-blue-500/10'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          )}
        >
          <ArrowLeftRight className="h-5 w-5" strokeWidth={pathname.startsWith('/products/compare') ? 2.5 : 2} />
          <span className="truncate">Comparar</span>
          {count > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-black text-white ring-2 ring-white" aria-live="polite">
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
            'relative flex min-h-[52px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1 text-[10px] font-extrabold transition-all',
            pathname.startsWith('/messages')
              ? 'text-blue-700 bg-blue-50/70 ring-1 ring-blue-500/10'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          )}
        >
          <MessageCircle className="h-5 w-5" strokeWidth={pathname.startsWith('/messages') ? 2.5 : 2} />
          <span className="truncate">Mensagens</span>
          {unreadMessagesCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white ring-2 ring-white" aria-live="polite">
              {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}

