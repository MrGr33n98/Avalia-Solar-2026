'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import SearchBar from './SearchBar';
import NavbarSearch from './NavbarSearch';
import LocationSearch from './LocationSearch';

import { MegaMenuCategories } from './navigation/MegaMenuCategories';
import { MobileCategoriesDrawer } from './navigation/MobileCategoriesDrawer';

export default function Navbar() {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const megaMenuRef = useRef<HTMLDivElement | null>(null);
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

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
    <nav className="sticky top-0 z-[1000] bg-white border-b border-gray-200 shadow-sm">
      {/* Top Row: Logo, Search, Auth */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-8 h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 shrink-0" aria-label="Home Avalia Solar">
          <Image 
            src="/images/logo.png" 
            alt="Avalia Solar Logo" 
            width={64} 
            height={64} 
            className="h-12 w-auto object-contain" 
            priority 
          />
        </Link>

        {/* Desktop Search Section */}
        <div className="hidden md:flex flex-1 items-center gap-2 max-w-[700px]">
           <NavbarSearch className="flex-1" placeholder="Buscar produtos, serviços..." />
           <LocationSearch className="w-[200px] shrink-0" onLocationSelect={handleLocationSelect} />
        </div>

        {/* Desktop Auth Section */}
        <div className="hidden md:flex items-center gap-3 ml-auto">
          {!isAuthenticated ? (
            <>
              <Button asChild variant="ghost" size="sm" className="font-medium">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm" className="font-bold px-6">
                <Link href="/register">Cadastre sua empresa</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="font-medium">
                <Link href="/profile">Minha conta</Link>
              </Button>
              {user?.role === 'company' && (
                <Button asChild variant="outline" size="sm" className="font-medium border-primary text-primary hover:bg-primary/5">
                  <Link href="/dashboard/company">Dashboard</Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500">
                Sair
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center ml-auto gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileDrawerOpen(true)}
            aria-label="Menu"
            className="text-gray-600 hover:bg-gray-100"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Bottom Row: Navigation Links (Desktop Only) */}
      <div className="hidden md:block border-t border-gray-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-10 gap-8">
          {/* Mega Menu Trigger */}
          <div className="relative h-full flex items-center" ref={megaMenuRef}>
            <Button
              variant="ghost"
              size="sm"
              className={`h-full px-4 flex items-center gap-2 font-bold text-sm transition-all rounded-none border-b-2 ${
                isMegaMenuOpen 
                  ? 'text-primary border-primary bg-white' 
                  : 'text-slate-700 border-transparent hover:text-primary hover:bg-slate-100/50'
              }`}
              onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
              onMouseEnter={() => setIsMegaMenuOpen(true)}
            >
              <Menu className="h-4 w-4" />
              Categorias
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isMegaMenuOpen ? 'rotate-180' : ''}`} />
            </Button>
            
            <div onMouseLeave={() => setIsMegaMenuOpen(false)}>
              <MegaMenuCategories isOpen={isMegaMenuOpen} />
            </div>
          </div>

          <div className="flex items-center gap-6 h-full">
            <Link 
              href="/companies" 
              className="text-xs font-bold text-slate-600 hover:text-primary transition-colors uppercase tracking-wider"
            >
              Empresas
            </Link>
            <Link 
              href="/products" 
              className="text-xs font-bold text-slate-600 hover:text-primary transition-colors uppercase tracking-wider"
            >
              Produtos
            </Link>
            <Link 
              href="/blog" 
              className="text-xs font-bold text-slate-600 hover:text-primary transition-colors uppercase tracking-wider"
            >
              Blog
            </Link>
          </div>

          <div className="ml-auto">
             <p className="text-[10px] font-bold text-primary/70 uppercase tracking-[0.2em]">
                O Maior Marketplace Solar do Brasil
             </p>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <MobileCategoriesDrawer 
        isOpen={isMobileDrawerOpen} 
        onClose={() => setIsMobileDrawerOpen(false)} 
      />
    </nav>
  );
}
