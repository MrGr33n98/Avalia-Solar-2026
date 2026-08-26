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
          'fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 lg:hidden',
          'pb-[var(--safe-area-inset-bottom)]'
        )}
        aria-label="Navegação do painel"
      >
        <div className="flex min-h-16 items-center justify-around">
          {mobileBottomNavItems.map((item) => {
            const Icon = item.icon;
            const active = isNavItemActive(pathname, item);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-w-[48px] min-h-[48px]',
                  active ? 'text-blue-600' : 'text-slate-400'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* "Mais" button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-w-[48px] min-h-[48px]',
              drawerOpen ? 'text-blue-600' : 'text-slate-400'
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] font-medium">Mais</span>
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
