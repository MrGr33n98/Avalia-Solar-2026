'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { MoreHorizontal, X } from 'lucide-react';
import { mobileBottomNavItems, mobileDrawerItems, isNavItemActive } from '../reviewerNavigation';

export function ReviewerMobileNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Bottom navigation bar */}
      <nav
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 lg:hidden',
          'pb-[max(0px,env(safe-area-inset-bottom,0px))]'
        )}
        aria-label="Navegação do painel"
      >
        <div className="flex h-14 items-center justify-around px-1">
          {mobileBottomNavItems.map((item) => {
            const Icon = item.icon;
            const active = isNavItemActive(pathname, item);
            const labelText = item.shortLabel || item.label;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'relative flex flex-col items-center justify-center flex-1 py-1 min-w-[48px] min-h-[44px] transition-colors group',
                  active
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
                )}
              >
                {/* Indicador de aba ativa no topo */}
                {active && (
                  <span
                    className="absolute top-0 h-0.5 w-6 rounded-full bg-blue-600 dark:bg-blue-400"
                    aria-hidden="true"
                  />
                )}

                {/* Caixa dimensional rígida para os ícones ficarem no mesmo centro vertical */}
                <div className="flex h-6 w-6 items-center justify-center">
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-transform duration-150',
                      active
                        ? 'stroke-[2.2] scale-105'
                        : 'stroke-[1.6] group-hover:scale-105'
                    )}
                  />
                </div>

                <span className="text-[10px] leading-tight tracking-tight whitespace-nowrap truncate max-w-[68px]">
                  {labelText}
                </span>
              </Link>
            );
          })}

          {/* "Mais" button */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={cn(
              'relative flex flex-col items-center justify-center flex-1 py-1 min-w-[48px] min-h-[44px] transition-colors group',
              drawerOpen
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
            )}
          >
            {drawerOpen && (
              <span
                className="absolute top-0 h-0.5 w-6 rounded-full bg-blue-600 dark:bg-blue-400"
                aria-hidden="true"
              />
            )}

            <div className="flex h-6 w-6 items-center justify-center">
              <MoreHorizontal
                className={cn(
                  'h-5 w-5 transition-transform duration-150',
                  drawerOpen ? 'stroke-[2.2] scale-105' : 'stroke-[1.6] group-hover:scale-105'
                )}
              />
            </div>
            <span className="text-[10px] leading-tight tracking-tight whitespace-nowrap">
              Mais
            </span>
          </button>
        </div>
      </nav>

      {/* Drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-2xl transition-transform duration-300 lg:hidden',
          'pb-[var(--safe-area-inset-bottom)]',
          drawerOpen ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <span className="text-base font-semibold text-slate-900">Mais opções</span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="min-h-11 min-w-11 rounded-lg p-2 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <nav className="px-3 py-2" aria-label="Mais opções do painel">
          <ul className="space-y-0.5">
            {mobileDrawerItems.map((item) => {
              const Icon = item.icon;
              const active = isNavItemActive(pathname, item);
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                      active ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <Icon className={cn('h-5 w-5', active ? 'text-blue-600' : 'text-slate-400')} />
                    <span>{item.label}</span>
                    {item.badge === 'dot' && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-blue-600" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
}
