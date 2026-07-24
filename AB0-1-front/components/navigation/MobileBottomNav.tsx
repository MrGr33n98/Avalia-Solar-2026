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
    <nav className="fixed inset-x-0 bottom-0 z-[1000] border-t border-slate-200/80 bg-white/95 px-2 pb-[max(0.25rem,var(--safe-area-inset-bottom))] pt-1 shadow-[0_-10px_28px_-18px_rgba(15,23,42,0.35)] backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4">
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
                'relative flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[10px] font-bold transition-colors',
                active ? 'text-blue-700' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <span className="relative">
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
