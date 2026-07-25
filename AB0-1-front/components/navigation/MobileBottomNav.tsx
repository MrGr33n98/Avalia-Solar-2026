'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Heart, Home, User } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const BASE_NAV_ITEMS = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/companies', label: 'Empresas', icon: Building2 },
  { href: '/favorites', label: 'Favoritos', icon: Heart },
  { href: '/profile', label: 'Perfil', icon: User },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const navItems = BASE_NAV_ITEMS.map((item) =>
    item.href === '/profile' && user?.role === 'review'
      ? { ...item, href: '/review-dashboard/profile' }
      : item
  );
  const isInternalProfile =
    pathname === '/profile' ||
    pathname === '/review-dashboard' ||
    pathname.startsWith('/review-dashboard/');
  if (isInternalProfile) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[1000] border-t border-slate-200 bg-white px-2 pb-[max(0.5rem,var(--sab,env(safe-area-inset-bottom)))] pt-2 shadow-[0_-12px_32px_-16px_rgba(15,23,42,0.22)] backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-0.5">
        {navItems.map((item) => {
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
                'relative flex min-h-[56px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-[11px] font-bold transition-all',
                active
                  ? 'text-blue-700 bg-blue-50/70 ring-1 ring-blue-500/10'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              )}
            >
              <span className="relative flex h-7 w-7 items-center justify-center">
                <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.5 : 2} />
                {active && (
                  <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-blue-600" />
                )}
              </span>
              <span className="truncate tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
