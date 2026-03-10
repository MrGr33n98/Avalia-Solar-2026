'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import SearchBar from './SearchBar';
import NavbarSearch from './NavbarSearch';
import LocationSearch from './LocationSearch';

import dynamic from 'next/dynamic';

const CompanySwitcher = dynamic(() => import('./company/CompanySwitcher').then(mod => ({ default: mod.CompanySwitcher })), {
  ssr: false,
  loading: () => <div className="h-9 w-48 animate-pulse rounded-md bg-muted/50" />
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
      console.log('[Navbar] Redirecting review user to dashboard');
      // Adicionamos um pequeno delay para garantir que o estado e os cookies estejam sincronizados
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

  // Close mega menu on click outside
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
    <nav className="sticky top-0 z-[1000] border-b border-clay-shadow-light bg-clay-bg pt-[var(--safe-area-inset-top)] clay-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4 h-16 relative">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 shrink-0 clay-surface clay-convex p-2 rounded-clay-md" aria-label="Home Avalia Solar">
          <Image 
            src="/images/logo.png" 
            alt="Avalia Solar Logo" 
            width={84} 
            height={56} 
            sizes="84px"
            className="h-10 w-[70px] object-contain" 
            priority={logoPriority}
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex flex-1 items-center gap-6">
          
          {/* Search Section */}
          <div className="flex flex-1 items-center gap-2 max-w-[600px]">
             <NavbarSearch className="flex-1" placeholder="Buscar produtos, serviços..." />
             <LocationSearch className="w-[200px] shrink-0" onLocationSelect={handleLocationSelect} />
          </div>

          <div className="flex items-center space-x-6 ml-auto">
            {/* Mega Menu Trigger */}
            <div 
              className="static" 
              ref={megaMenuRef}
              onMouseEnter={openMegaMenu}
              onMouseLeave={() => setIsMegaMenuOpen(false)}
            >
              <Button
                variant="ghost"
                className={`clay-chip smooth-transition flex items-center gap-1 font-medium ${
                  isMegaMenuOpen ? 'text-primary bg-clay-surface-raised active' : 'text-gray-700 hover:text-primary'
                }`}
                onClick={toggleMegaMenu}
              >
                Categorias
                <ChevronDown className={`h-4 w-4 smooth-transition ${isMegaMenuOpen ? 'rotate-180' : ''}`} />
              </Button>

              {megaMenuMounted && (
                <CategoriesMegaMenu 
                  isOpen={isMegaMenuOpen} 
                  onClose={() => setIsMegaMenuOpen(false)} 
                />
              )}
            </div>

            <Link href="/companies" className="text-sm font-medium text-gray-700 hover:text-primary smooth-transition clay-chip px-3 py-1.5">
              Empresas
            </Link>
            <Link href="/products" className="text-sm font-medium text-gray-700 hover:text-primary smooth-transition clay-chip px-3 py-1.5">
              Produtos
            </Link>
            <Link href="/blog" className="text-sm font-medium text-gray-700 hover:text-primary smooth-transition clay-chip px-3 py-1.5">
              Blog
            </Link>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3 pl-2 border-l border-clay-shadow-light">
              {!isAuthenticated ? (
                <>
                  <Button asChild variant="ghost" size="sm" className="clay-chip">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild size="sm" className="clay-btn-primary">
                    <Link href="/register">Cadastre sua empresa</Link>
                  </Button>
                </>
              ) : (
                <>
                  {user?.role !== 'review' && (
                    <div className="mr-2">
                      <CompanySwitcher className="w-48" />
                    </div>
                  )}
                  <Button asChild variant="ghost" size="sm" className="clay-chip">
                    <Link 
                      href={user?.role === 'review' ? '/review-dashboard' : '/profile'}
                      onClick={handleMinhaContaClick}
                    >
                      Minha conta
                    </Link>
                  </Button>
                  {user?.role === 'company' && (
                    <Button asChild variant="outline" size="sm" className="clay-chip">
                      <Link href="/dashboard/company">Dashboard</Link>
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="clay-chip">
                    Sair
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center ml-auto gap-2">
          {isAuthenticated && user?.role !== 'review' && (
            <div className="mr-1">
              <CompanySwitcher className="w-[140px]" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (!mobileDrawerMounted) setMobileDrawerMounted(true);
              setIsMobileDrawerOpen(true);
            }}
            aria-label="Menu"
            className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
          >
            <Menu className="h-6 w-6" />
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
