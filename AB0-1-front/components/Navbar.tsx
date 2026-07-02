'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, ChevronDown, LogOut, LayoutDashboard, Search, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import NavbarSearch from './NavbarSearch';
import LocationSearch from './LocationSearch';
import { BrandLogo } from './brand/BrandLogo';

import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { getFullImageUrl } from '@/utils/image';

const CompanySwitcher = dynamic(
  () => import('./company/CompanySwitcher').then((mod) => ({ default: mod.CompanySwitcher })),
  {
    ssr: false,
    loading: () => (
      <div className="h-9 w-48 animate-pulse rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10" />
    ),
  }
);
const CategoriesMegaMenu = dynamic(
  () => import('./categories/CategoriesMegaMenu').then((mod) => mod.CategoriesMegaMenu),
  { ssr: false, loading: () => null }
);
const MobileCategoriesDrawer = dynamic(
  () => import('./navigation/MobileCategoriesDrawer').then((mod) => mod.MobileCategoriesDrawer),
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
  const isChatRoute = pathname === '/chat' || pathname?.startsWith('/chat/');
  const hideNavbar =
    pathname === '/profile' ||
    pathname?.startsWith('/f/') ||
    pathname === '/review-dashboard' ||
    pathname?.startsWith('/review-dashboard/');

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

  const handleSearch = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}&sort=rating&page=1`);
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

  if (hideNavbar) {
    return null;
  }

  if (pathname === '/') {
    return (
      <nav className="sticky top-0 z-[1000] border-b border-slate-200 bg-white/95 pt-[var(--safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex shrink-0 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ml-2 md:ml-4"
            aria-label="Home Avalia Solar"
          >
            <BrandLogo className="h-8 sm:h-9" priority />
          </Link>

          <div className="hidden lg:flex flex-1 max-w-[500px] items-center gap-2 mx-4">
            <NavbarSearch
              className="min-w-[8rem] flex-1"
              inputClassName="bg-slate-50 border-slate-200"
              placeholder="Buscar empresas, produtos..."
              onSearch={handleSearch}
            />
            <div className="w-[140px] shrink-0">
              <LocationSearch
                className="w-full bg-slate-50 border-slate-200"
                onLocationSelect={handleLocationSelect}
              />
            </div>
          </div>

          <div className="hidden items-center gap-1 lg:flex">
            <Link
              href="/companies"
              className="rounded-lg px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-700"
            >
              Empresas
            </Link>
            <div
              className="static"
              ref={megaMenuRef}
              onMouseEnter={openMegaMenu}
              onMouseLeave={() => setIsMegaMenuOpen(false)}
            >
              <Button
                type="button"
                variant="ghost"
                className="h-10 rounded-lg px-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-700"
                onClick={toggleMegaMenu}
              >
                Categorias{' '}
                <ChevronDown
                  className={cn(
                    'ml-1 h-4 w-4 transition-transform',
                    isMegaMenuOpen && 'rotate-180'
                  )}
                />
              </Button>
              {megaMenuMounted ? (
                <CategoriesMegaMenu
                  isOpen={isMegaMenuOpen}
                  onClose={() => setIsMegaMenuOpen(false)}
                />
              ) : null}
            </div>
            <Link
              href="/#como-funciona"
              className="rounded-lg px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-700"
            >
              Como funciona
            </Link>
            <Link
              href="/blog"
              className="rounded-lg px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-700"
            >
              Conteúdo
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {!isAuthenticated ? (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="hidden h-10 rounded-lg px-3 text-sm font-bold text-slate-600 sm:inline-flex"
                >
                  <Link href="/login">
                    <UserIcon className="mr-1.5 h-4 w-4" /> Entrar
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="hidden h-10 rounded-lg border-blue-300 bg-white px-4 text-sm font-bold text-blue-700 hover:bg-blue-50 sm:inline-flex"
                >
                  <Link href="/register">Para empresas</Link>
                </Button>
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="hidden h-10 rounded-lg text-sm font-bold text-slate-600 sm:inline-flex"
                >
                  <Link
                    href={user?.role === 'review' ? '/review-dashboard' : '/profile'}
                    onClick={handleMinhaContaClick}
                    className="flex items-center"
                  >
                    {user?.avatar_url ? (
                      <img
                        src={getFullImageUrl(user.avatar_url)}
                        alt={user.name || 'Avatar'}
                        className="mr-1.5 h-5 w-5 rounded-full object-cover border border-slate-200"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <UserIcon className="mr-1.5 h-4 w-4" />
                    )}
                    Minha conta
                  </Link>
                </Button>
                {user?.role === 'company' ? (
                  <Button
                    asChild
                    className="hidden h-10 bg-blue-600 font-bold text-white hover:bg-blue-700 sm:inline-flex"
                  >
                    <Link href="/dashboard">
                      <LayoutDashboard className="mr-1.5 h-4 w-4" /> Painel
                    </Link>
                  </Button>
                ) : null}
              </>
            )}

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                if (!mobileDrawerMounted) setMobileDrawerMounted(true);
                setIsMobileDrawerOpen(true);
              }}
              aria-label="Abrir menu"
              className="h-10 w-10 rounded-lg border-slate-300 text-slate-700 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {mobileDrawerMounted ? (
          <MobileCategoriesDrawer
            isOpen={isMobileDrawerOpen}
            onClose={() => setIsMobileDrawerOpen(false)}
          />
        ) : null}
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-[1000] border-b border-brand-borderSoft bg-[#F8FAFC]/95 pt-[var(--safe-area-inset-top)] backdrop-blur-xl dark:border-white/10 dark:bg-[#020617]/95">
      <div
        className={cn(
          'mx-auto flex max-w-[86rem] items-center px-2 sm:px-4 lg:px-4 xl:px-5',
          isChatRoute ? 'h-16 gap-1 md:h-[4.5rem] md:gap-1.5' : 'h-[4.5rem] gap-1.5'
        )}
      >
        <Link
          href="/"
          className="group ml-2 md:ml-4 flex shrink-0 items-center gap-1.5 rounded-xl px-0 py-1 transition-transform duration-200 hover:-translate-y-0.5"
          aria-label="Home Avalia Solar"
        >
          <BrandLogo
            className={cn(
              'transition-transform duration-200 group-hover:scale-[1.02]',
              'dark:rounded-md dark:bg-white dark:px-1 dark:py-0.5',
              isChatRoute ? 'h-6 sm:h-8' : 'h-6 sm:h-9'
            )}
            priority={logoPriority}
          />
        </Link>

        <div className="hidden lg:flex flex-1 items-center gap-4">
          <div className="flex min-w-0 max-w-[900px] flex-[1.4] items-center gap-2.5">
            <NavbarSearch
              className="min-w-[10rem] flex-[1.45]"
              inputClassName="bg-white dark:bg-[#081a2e]/82 border-brand-border"
              placeholder="Buscar empresas, produtos e serviços"
              onSearch={handleSearch}
            />
            <div className="w-[156px] shrink-0">
              <LocationSearch
                className="w-full bg-white dark:bg-[#081a2e]/82 border-brand-border"
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
                  'h-10 rounded-xl border border-brand-border bg-white px-4 text-xs font-bold uppercase tracking-[0.12em] text-slate-600 transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/8 dark:hover:text-white',
                  isMegaMenuOpen ? 'border-transparent bg-brand-blue text-white shadow-none' : ''
                )}
                onClick={toggleMegaMenu}
              >
                Categorias
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 transition-transform duration-300',
                    isMegaMenuOpen && 'rotate-180'
                  )}
                />
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
                { label: 'Blog', href: '/blog' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-600 transition-colors hover:bg-slate-100 hover:text-brand-blue dark:text-white/62 dark:hover:bg-white/6 dark:hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2 border-l border-brand-borderSoft pl-4 dark:border-white/10">
              {!isAuthenticated ? (
                <>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-10 rounded-xl px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600 hover:bg-slate-100 dark:text-white/60"
                  >
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    className="h-10 rounded-xl bg-brand-blue hover:bg-brand-blue/90 px-5 text-[11px] font-bold uppercase tracking-[0.12em] text-white shadow-none"
                  >
                    <Link href="/register">Cadastre sua empresa</Link>
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  {user?.role !== 'review' && <CompanySwitcher className="h-10 w-44" />}

                  <div className="flex items-center rounded-xl border border-brand-border bg-white p-1 dark:border-white/10 dark:bg-white/5">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-lg px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600 hover:bg-transparent hover:text-brand-blue dark:text-white/65 dark:hover:text-white"
                    >
                      <Link
                        href={user?.role === 'review' ? '/review-dashboard' : '/profile'}
                        onClick={handleMinhaContaClick}
                        className="flex items-center"
                      >
                        {user?.avatar_url ? (
                          <img
                            src={getFullImageUrl(user.avatar_url)}
                            alt={user.name || 'Avatar'}
                            className="mr-1.5 h-5 w-5 rounded-full object-cover border border-slate-200 dark:border-white/10"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <UserIcon className="mr-1.5 h-3.5 w-3.5 opacity-60" />
                        )}
                        Perfil
                      </Link>
                    </Button>

                    {user?.role === 'company' && (
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-lg border border-brand-blue/10 bg-brand-blue/8 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-blue hover:bg-brand-blue/12 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/14"
                      >
                        <Link href="/dashboard">
                          <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
                          Painel
                        </Link>
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="h-8 rounded-lg px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-red-500 hover:bg-red-500/5 hover:text-red-700"
                    >
                      <LogOut className="h-4 w-4" />
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
            className={cn(
              'shrink-0 border border-brand-border bg-white px-3 text-sm font-semibold text-slate-600 shadow-none hover:bg-slate-50 hover:text-brand-blue dark:border-white/10 dark:bg-[#0b1a2b]/82 dark:text-white/65 dark:hover:bg-[#10263d] dark:hover:text-white',
              isChatRoute ? 'h-10 rounded-xl' : 'h-11 rounded-xl'
            )}
          >
            <Link href="/search" aria-label="Buscar">
              <Search className="mr-2 h-[18px] w-[18px]" />
              <span>Buscar</span>
            </Link>
          </Button>

          <div
            className={cn(
              'min-w-0 flex-1',
              isChatRoute ? 'max-w-[190px] sm:max-w-[230px]' : 'max-w-[220px] sm:max-w-[250px]'
            )}
          >
            <LocationSearch
              className="max-w-none text-xs sm:text-sm border-brand-border rounded-xl"
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
            className={cn(
              'shrink-0 border border-brand-border bg-white text-slate-600 shadow-none hover:bg-slate-50 hover:text-brand-blue dark:border-white/10 dark:bg-[#0b1a2b]/82 dark:text-white/65 dark:hover:bg-[#10263d] dark:hover:text-white',
              isChatRoute ? 'h-10 w-10 rounded-xl' : 'h-11 w-11 rounded-xl'
            )}
          >
            <Menu className={cn(isChatRoute ? 'h-5 w-5' : 'h-6 w-6')} />
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
