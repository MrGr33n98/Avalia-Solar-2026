'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Heart, Home, Scale, User } from 'lucide-react';

import { useComparison } from '@/hooks/useComparison';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/companies', label: 'Empresas', icon: Building2 },
  { href: '/compare', label: 'Comparar', icon: Scale, badge: 'comparison' },
  { href: '/favorites', label: 'Favoritos', icon: Heart },
  { href: '/profile', label: 'Perfil', icon: User },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { count } = useComparison();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/95 px-2 pb-[max(0.5rem,var(--safe-area-inset-bottom))] pt-2 shadow-[0_-10px_28px_-18px_rgba(15,23,42,0.35)] backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-bold transition-colors',
                active ? 'text-blue-700' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <span className="relative">
                <Icon className="h-6 w-6" strokeWidth={active ? 2.5 : 2} />
                {item.badge === 'comparison' && count > 0 && (
                  <span className="absolute -right-2.5 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-black leading-none text-white">
                    {count}
                  </span>
                )}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
