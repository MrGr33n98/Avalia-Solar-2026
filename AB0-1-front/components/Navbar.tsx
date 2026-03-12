'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, ChevronDown, LogOut, LayoutDashboard, Search, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import NavbarSearch from './NavbarSearch';
import LocationSearch from './LocationSearch';

import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

const CompanySwitcher = dynamic(() => import('./company/CompanySwitcher').then(mod => ({ default: mod.CompanySwitcher })), {
  ssr: false,
  loading: () => <div className="h-9 w-48 animate-pulse rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10" />
});
const CategoriesMegaMenu = dynamic(
  () => import('./categories/CategoriesMegaMenu').then(mod => mod.CategoriesMegaMenu),
  { ssr: false, loading: () => null }
);
const MobileCategoriesDrawer = dynamic(
  () => import('./navigation/MobileCategoriesDrawer').then(mod => mod.MobileCategoriesDrawer),
  { ssr: false, loading: () => null }
);

export default function Navbar() {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [megaMenuMounted, setMegaMenuMounted] = useState(false);
  const [mobileDrawerMounted, setMobileDrawerMounted] = useState(false);
  const megaMenuRef = useRef<HTMLDivElement | null>(null);
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const logoPriority = pathname === '/';

  const handleMinhaContaClick = (e: React.MouseEvent) => {
    if (user?.role === 'review') {
      e.preventDefault();
      setTimeout(() => {
        router.push('/review-dashboard');
      }, 50);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleLocationSelect = (location: { state: string; city?: string }) => {
    const params = new URLSearchParams();
    if (location.state) params.set('state', location.state);
    if (location.city) params.set('city', location.city);
    router.push(`/companies?${params.toString()}`);
  };

  const openMegaMenu = () => {
    if (!megaMenuMounted) setMegaMenuMounted(true);
    setIsMegaMenuOpen(true);
  };

  const toggleMegaMenu = () => {
    if (!megaMenuMounted) setMegaMenuMounted(true);
    setIsMegaMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
        setIsMegaMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-[1000] border-b border-black/6 bg-background/88 pt-[var(--safe-area-inset-top)] shadow-[0_16px_40px_-34px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/8 dark:bg-[#07111f]/90 dark:shadow-[0_22px_48px_-36px_rgba(0,0,0,0.8)]">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex shrink-0 items-center rounded-[1.35rem] border border-black/8 bg-white/78 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_12px_24px_-22px_rgba(15,23,42,0.38)] transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-brand-blue/25 hover:bg-white dark:border-white/10 dark:bg-[#0b1a2b]/88 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_18px_34px_-24px_rgba(0,0,0,0.82)] dark:hover:border-brand-cyan/30 dark:hover:bg-[#0d2137]"
          aria-label="Home Avalia Solar"
        >
          <div className="flex h-10 items-center justify-center rounded-[1rem] border border-black/6 bg-gradient-to-b from-slate-50 to-white px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] dark:border-white/6 dark:bg-gradient-to-b dark:from-[#102740] dark:to-[#091727] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <Image
              src="/images/logo.png"
              alt="Avalia Solar Logo"
              width={64}
              height={42}
              className="h-7 w-auto object-contain dark:brightness-110"
              priority={logoPriority}
            />
          </div>
        </Link>

        <div className="hidden xl:flex flex-1 items-center gap-5">
          <div className="flex max-w-[580px] flex-1 items-center gap-3">
            <NavbarSearch
              className="flex-1"
              inputClassName="bg-white/78 dark:bg-[#081a2e]/76"
              placeholder="Buscar produtos, serviços..."
            />
            <div className="w-[210px] shrink-0">
              <LocationSearch
                className="w-full bg-white/78 dark:bg-[#081a2e]/76"
                onLocationSelect={handleLocationSelect}
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <div
              className="static"
              ref={megaMenuRef}
              onMouseEnter={openMegaMenu}
              onMouseLeave={() => setIsMegaMenuOpen(false)}
            >
              <Button
                variant="ghost"
                className={cn(
                  "h-10 rounded-full border border-black/8 bg-white/64 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/68 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] transition-all hover:border-brand-blue/20 hover:bg-white hover:text-brand-blue dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:border-brand-cyan/25 dark:hover:bg-white/8 dark:hover:text-white",
                  isMegaMenuOpen
                    ? "border-transparent bg-brand-blue text-white shadow-[0_12px_24px_-18px_rgba(0,86,210,0.7)] dark:bg-brand-blue dark:text-white"
                    : ""
                )}
                onClick={toggleMegaMenu}
              >
                Categorias
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-300", isMegaMenuOpen && "rotate-180")} />
              </Button>

              {megaMenuMounted && (
                <CategoriesMegaMenu
                  isOpen={isMegaMenuOpen}
                  onClose={() => setIsMegaMenuOpen(false)}
                />
              )}
            </div>

            <nav className="flex items-center gap-1">
              {[
                { label: 'Empresas', href: '/companies' },
                { label: 'Produtos', href: '/products' },
                { label: 'Blog', href: '/blog' }
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-3 py-2 text-sm font-semibold text-foreground/62 transition-colors hover:bg-brand-blue/5 hover:text-brand-blue dark:text-white/62 dark:hover:bg-white/6 dark:hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2 border-l border-black/6 pl-4 dark:border-white/10">
              {!isAuthenticated ? (
                <>
                  <Button asChild variant="ghost" size="sm" className="h-10 rounded-full px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-foreground/62 hover:bg-brand-blue/5 hover:text-brand-blue dark:text-white/60 dark:hover:bg-white/6 dark:hover:text-white">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild size="sm" className="h-10 rounded-full border border-white/20 bg-brand-blue px-5 text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_14px_28px_-18px_rgba(0,86,210,0.72)] transition-transform hover:-translate-y-0.5 hover:bg-brand-blue-light">
                    <Link href="/register">Cadastre sua empresa</Link>
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  {user?.role !== 'review' && (
                    <CompanySwitcher className="h-10 w-44" />
                  )}

                  <div className="flex items-center rounded-full border border-black/8 bg-white/68 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                    <Button asChild variant="ghost" size="sm" className="h-8 rounded-full px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-foreground/70 hover:bg-transparent hover:text-brand-blue dark:text-white/65 dark:hover:text-white">
                      <Link
                        href={user?.role === 'review' ? '/review-dashboard' : '/profile'}
                        onClick={handleMinhaContaClick}
                      >
                        <UserIcon className="mr-1.5 h-3.5 w-3.5 opacity-60" />
                        Perfil
                      </Link>
                    </Button>

                    {user?.role === 'company' && (
                      <Button asChild variant="ghost" size="sm" className="h-8 rounded-full border border-brand-blue/10 bg-brand-blue/8 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-blue hover:bg-brand-blue/12 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/14">
                        <Link href="/dashboard/company">
                          <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
                          Painel
                        </Link>
                      </Button>
                    )}

                    <Button variant="ghost" size="sm" onClick={handleLogout} className="h-8 rounded-full px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-red-500 hover:bg-red-500/5 hover:text-red-600">
                      <LogOut className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2 xl:hidden">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-[1.05rem] border border-black/8 bg-white/78 text-foreground/68 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] hover:bg-white hover:text-brand-blue dark:border-white/10 dark:bg-[#0b1a2b]/82 dark:text-white/65 dark:hover:bg-[#10263d] dark:hover:text-white"
          >
            <Link href="/search" aria-label="Buscar">
              <Search className="h-[18px] w-[18px]" />
            </Link>
          </Button>

          <div className="min-w-0 max-w-[170px] flex-1 sm:max-w-[220px]">
            <LocationSearch
              className="max-w-none text-xs sm:text-sm"
              onLocationSelect={handleLocationSelect}
            />
          </div>

          {isAuthenticated && user?.role !== 'review' && (
            <CompanySwitcher className="hidden h-10 w-[132px] md:block" />
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (!mobileDrawerMounted) setMobileDrawerMounted(true);
              setIsMobileDrawerOpen(true);
            }}
            aria-label="Menu"
            className="h-10 w-10 shrink-0 rounded-[1.05rem] border border-black/8 bg-white/78 text-foreground/68 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] hover:bg-white hover:text-brand-blue dark:border-white/10 dark:bg-[#0b1a2b]/82 dark:text-white/65 dark:hover:bg-[#10263d] dark:hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileDrawerMounted && (
        <MobileCategoriesDrawer 
          isOpen={isMobileDrawerOpen} 
          onClose={() => setIsMobileDrawerOpen(false)} 
        />
      )}
    </nav>
  );
}
