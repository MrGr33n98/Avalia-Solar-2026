'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, ChevronDown, LogOut, LayoutDashboard, User as UserIcon } from 'lucide-react';
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
    <nav className="sticky top-0 z-[1000] border-b border-black/5 dark:border-white/10 bg-background/80 backdrop-blur-md pt-[var(--safe-area-inset-top)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4 h-16 relative">
        {/* Logo with Precision Claymorphism - Responsive Theme */}
        <Link 
          href="/" 
          className="flex items-center space-x-2 shrink-0 clay-precision p-1.5 rounded-xl bg-white dark:bg-[#0F172A] hover:scale-[1.02] transition-transform" 
          aria-label="Home Avalia Solar"
        >
          <div className="bg-[#002B4D] rounded-lg p-1.5 flex items-center justify-center">
            <Image 
              src="/images/logo.png" 
              alt="Avalia Solar Logo" 
              width={64} 
              height={42} 
              className="h-7 w-auto object-contain brightness-0 invert" 
              priority={logoPriority}
            />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex flex-1 items-center gap-6">
          
          {/* Search Section with Inset Clay */}
          <div className="flex flex-1 items-center gap-2 max-w-[500px]">
             <div className="relative flex-1 group">
               <NavbarSearch className="flex-1 clay-precision-input bg-black/[0.02] dark:bg-black/20" placeholder="Buscar produtos, serviços..." />
             </div>
             <div className="relative w-[180px] shrink-0">
               <LocationSearch className="w-full clay-precision-input bg-black/[0.02] dark:bg-black/20" onLocationSelect={handleLocationSelect} />
             </div>
          </div>

          <div className="flex items-center space-x-4 ml-auto">
            {/* Mega Menu Trigger */}
            <div 
              className="static" 
              ref={megaMenuRef}
              onMouseEnter={openMegaMenu}
              onMouseLeave={() => setIsMegaMenuOpen(false)}
            >
              <Button
                variant="ghost"
                className={cn(
                  "clay-precision-chip h-9 gap-1.5 font-bold transition-all",
                  isMegaMenuOpen 
                    ? "bg-brand-blue text-white border-transparent" 
                    : "text-foreground/60 hover:bg-brand-blue/5 hover:text-brand-blue"
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
                  className="text-[11px] uppercase tracking-widest font-bold text-foreground/60 hover:text-brand-blue px-3 py-2 rounded-lg transition-colors hover:bg-brand-blue/5"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center gap-2 pl-4 border-l border-black/5 dark:border-white/10">
              {!isAuthenticated ? (
                <>
                  <Button asChild variant="ghost" size="sm" className="text-[11px] font-bold uppercase tracking-widest text-foreground/60 hover:text-brand-blue">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild size="sm" className="clay-precision-btn h-9 rounded-xl px-4 text-xs font-bold uppercase tracking-widest">
                    <Link href="/register">Cadastre sua empresa</Link>
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  {user?.role !== 'review' && (
                    <CompanySwitcher className="w-44 h-9" />
                  )}
                  
                  <div className="flex items-center bg-black/[0.03] dark:bg-white/5 rounded-xl p-0.5 border border-black/5 dark:border-white/10">
                    <Button asChild variant="ghost" size="sm" className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider px-3">
                      <Link 
                        href={user?.role === 'review' ? '/review-dashboard' : '/profile'}
                        onClick={handleMinhaContaClick}
                      >
                        <UserIcon className="h-3.5 w-3.5 mr-1.5 opacity-60" />
                        Perfil
                      </Link>
                    </Button>
                    
                    {user?.role === 'company' && (
                      <Button asChild variant="ghost" size="sm" className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider px-3 bg-white dark:bg-white/10 shadow-sm border border-black/5 dark:border-white/5">
                        <Link href="/dashboard/company">
                          <LayoutDashboard className="h-3.5 w-3.5 mr-1.5 text-brand-blue" />
                          Painel
                        </Link>
                      </Button>
                    )}
                    
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider px-3 text-red-500 hover:text-red-600 hover:bg-red-500/5">
                      <LogOut className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center ml-auto gap-2">
          {isAuthenticated && user?.role !== 'review' && (
            <CompanySwitcher className="w-[120px] h-8" />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (!mobileDrawerMounted) setMobileDrawerMounted(true);
              setIsMobileDrawerOpen(true);
            }}
            aria-label="Menu"
            className="clay-precision h-9 w-9 rounded-xl bg-white dark:bg-white/5 text-foreground/60"
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
