'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Menu, Search, User as UserIcon, Bell, MessageSquare } from 'lucide-react';

import { BrandLogo } from '@/components/brand/BrandLogo';
import LocationSearch from '@/components/LocationSearch';
import NavbarSearch from '@/components/NavbarSearch';
import { UserAvatarDropdown } from '@/components/navigation/UserAvatarDropdown';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/store/notificationStore';

const CompanySwitcher = dynamic(
  () => import('./company/CompanySwitcher').then((mod) => ({ default: mod.CompanySwitcher })),
  {
    ssr: false,
    loading: () => (
      <div className="h-9 w-40 animate-pulse rounded-lg border border-black/5 bg-black/5" />
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

const primaryLinks = [
  { label: 'Empresas', href: '/companies' },
  { label: 'Como funciona', href: '/#como-funciona' },
  { label: 'Conteúdo', href: '/blog' },
] as const;

export default function Navbar() {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [megaMenuMounted, setMegaMenuMounted] = useState(false);
  const [mobileDrawerMounted, setMobileDrawerMounted] = useState(false);
  const megaMenuRef = useRef<HTMLDivElement | null>(null);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const categoriesMegaMenuId = 'categories-mega-menu';
  const mobileCategoriesDrawerId = 'mobile-categories-drawer';

  const { unreadCount, unreadMessagesCount, fetchUnreadCount, fetchUnreadMessagesCount, toggleChat } = useNotificationStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      fetchUnreadMessagesCount();
    }
  }, [isAuthenticated, fetchUnreadCount, fetchUnreadMessagesCount]);

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
    setIsMegaMenuOpen((current) => !current);
  };

  const openMobileDrawer = () => {
    if (!mobileDrawerMounted) setMobileDrawerMounted(true);
    setIsMobileDrawerOpen(true);
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

  if (pathname?.startsWith('/f/')) return null;
  if (pathname?.startsWith('/dashboard')) return null;

  return (
    <nav className="sticky top-0 z-[1000] border-b border-brand-borderSoft bg-white pt-[var(--safe-area-inset-top)] max-w-full overflow-x-clip">
      <div className="mx-auto flex h-[56px] max-w-[1280px] items-center gap-2 px-3 sm:px-4 xl:h-[60px] xl:gap-4 xl:px-5 min-w-0">
        <Link
          href="/"
          aria-label="Home Avalia Solar"
          className="flex shrink-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
        >
          <BrandLogo
            className="h-7 sm:h-8 xl:h-[30px]"
            priority={pathname === '/'}
          />
        </Link>

        <div className="hidden min-w-0 flex-1 items-center gap-3 xl:flex">
          <NavbarSearch
            className="w-[280px] min-w-0 2xl:w-[360px]"
            inputClassName="border-brand-border bg-slate-50"
            placeholder="Buscar empresas, produtos..."
            onSearch={handleSearch}
          />

          <div className="w-[176px] shrink-0 2xl:w-[200px]">
            <LocationSearch
              className="w-full border-brand-border bg-slate-50"
              onLocationSelect={handleLocationSelect}
            />
          </div>

          <div className="ml-auto flex h-full shrink-0 items-center gap-1" aria-label="Navegação principal">
            <Link
              href={primaryLinks[0].href}
              className="inline-flex h-[40px] items-center whitespace-nowrap rounded-md px-2.5 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              {primaryLinks[0].label}
            </Link>

            <div
              ref={megaMenuRef}
              className="static"
              onMouseEnter={openMegaMenu}
              onMouseLeave={() => setIsMegaMenuOpen(false)}
            >
              <Button
                type="button"
                variant="ghost"
                className={cn(
                  'h-[40px] whitespace-nowrap rounded-md px-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-blue',
                  isMegaMenuOpen && 'bg-slate-50 text-brand-blue'
                )}
                onClick={toggleMegaMenu}
                aria-expanded={isMegaMenuOpen}
                aria-controls={megaMenuMounted ? categoriesMegaMenuId : undefined}
                aria-haspopup="menu"
              >
                Categorias
                <ChevronDown
                  className={cn('ml-1 h-3.5 w-3.5 transition-transform', isMegaMenuOpen && 'rotate-180')}
                  aria-hidden="true"
                />
              </Button>

              {megaMenuMounted ? (
                <CategoriesMegaMenu
                  id={categoriesMegaMenuId}
                  isOpen={isMegaMenuOpen}
                  onClose={() => setIsMegaMenuOpen(false)}
                />
              ) : null}
            </div>

            {primaryLinks.slice(1).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex h-[40px] items-center whitespace-nowrap rounded-md px-2.5 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-1.5 border-l border-brand-borderSoft pl-3">
            {!isAuthenticated ? (
              <>
                <Button asChild variant="ghost" className="h-[40px] rounded-md px-2.5 text-[13px] font-semibold text-slate-700">
                  <Link href="/login">
                    <UserIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    Entrar
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-[40px] rounded-md border-blue-300 px-3 text-xs font-semibold text-blue-700 shadow-none">
                  <Link href="/register">Para empresas</Link>
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                {user?.role !== 'review' ? <CompanySwitcher className="hidden h-9 w-40 lg:block" /> : null}
                
                <button
                  className="relative rounded-full bg-slate-100 p-2 text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-600"
                  aria-label="Mensagens"
                  onClick={() => toggleChat()}
                >
                  <div className="relative">
                    <MessageSquare className="h-5 w-5 text-slate-800" />
                    {unreadMessagesCount > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white shadow-md ring-1 ring-white">
                        {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                      </span>
                    )}
                  </div>
                </button>

                {/* Notification Icon */}
                <Link
                  href={user?.role === 'review' ? '/review-dashboard/notifications' : '/dashboard/notifications'}
                  className="relative flex items-center justify-center p-2 text-slate-700 transition-colors hover:bg-slate-100 hover:text-blue-600 rounded-lg focus:outline-none"
                  aria-label="Notificações"
                >
                  <div className="relative">
                    <Bell className="h-5 w-5 text-slate-800" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white shadow-md ring-1 ring-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                </Link>

                <UserAvatarDropdown />
              </div>
            )}
          </div>
        </div>

        <div className="ml-auto flex min-w-0 items-center justify-end gap-2 xl:hidden">
          <Button asChild variant="outline" size="icon" className="h-[44px] w-[44px] shrink-0 rounded-lg border-brand-border bg-white text-slate-700 shadow-none">
            <Link href="/search" aria-label="Buscar no site">
              <Search className="h-5 w-5" aria-hidden="true" />
            </Link>
          </Button>

          <div className="hidden w-[190px] min-w-0 sm:block md:w-[220px]">
            <LocationSearch
              className="h-[44px] w-full border-brand-border bg-white"
              onLocationSelect={handleLocationSelect}
            />
          </div>

          {isAuthenticated ? (
            <UserAvatarDropdown />
          ) : (
            <Button
              asChild
              variant="ghost"
              className="h-[44px] rounded-lg px-2 text-xs font-semibold text-slate-700 sm:px-3 sm:text-sm hover:bg-slate-50 shadow-none border-0"
            >
              <Link href="/login" className="inline-flex items-center">
                <UserIcon className="mr-1 h-4 w-4" aria-hidden="true" />
                Entrar
              </Link>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={openMobileDrawer}
            aria-label={isMobileDrawerOpen ? 'Fechar menu principal' : 'Abrir menu principal'}
            aria-expanded={isMobileDrawerOpen}
            aria-controls={mobileDrawerMounted ? mobileCategoriesDrawerId : undefined}
            className="h-[44px] w-[44px] shrink-0 rounded-lg border-brand-border bg-white text-slate-700 shadow-none"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {mobileDrawerMounted ? (
        <MobileCategoriesDrawer
          id={mobileCategoriesDrawerId}
          isOpen={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
        />
      ) : null}
    </nav>
  );
}
