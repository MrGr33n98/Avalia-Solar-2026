'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/contexts/AuthContext';
import SearchBar from './SearchBar';
import NavbarSearch from './NavbarSearch';
import CategoryDropdown from './CategoryDropdown';
import LocationSearch from './LocationSearch';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Only for mobile now
  const mobileDropdownRef = useRef<HTMLDivElement | null>(null);
  const { categories, loading, error, refresh } = useCategories(true);
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  // Since we're already filtering for featured categories in the API call,
  // let's not filter again here unless absolutely necessary
  const featuredCategories = categories;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsDropdownOpen(false);
  };

  const toggleMobileDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleLocationSelect = (location: { state: string; city?: string }) => {
    // Construct search URL with location params
    const params = new URLSearchParams();
    if (location.state) params.set('state', location.state);
    if (location.city) params.set('city', location.city);
    // Preserve existing query if needed, or just navigate to search/companies
    router.push(`/companies?${params.toString()}`);
  };

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md breakpoint
        setIsMobileMenuOpen(false);
        setIsDropdownOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <nav className="sticky top-0 z-[1000] bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4 h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 shrink-0" aria-label="Home Avalia Solar">
          <Image 
            src="/images/logo.png" 
            alt="Avalia Solar Logo" 
            width={64} 
            height={64} 
            className="h-14 w-auto object-contain" 
            priority 
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
            {/* New Category Dropdown */}
            <CategoryDropdown />

            <Link href="/companies" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
              Empresas
            </Link>
            <Link href="/products" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
              Produtos
            </Link>
            <Link href="/blog" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
              Blog
            </Link>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
              {!isAuthenticated ? (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/register">Cadastre sua empresa</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/profile">Minha conta</Link>
                  </Button>
                  {user?.role === 'company' && (
                    <Button asChild variant="outline" size="sm">
                      <Link href="/dashboard/company">Dashboard</Link>
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    Sair
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center ml-auto gap-2">
          {/* Mobile Search Icon? Or just rely on the menu */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            aria-label="Menu"
            data-testid="mobile-menu-button"
            className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white shadow-lg border-t border-gray-100 overflow-hidden"
            data-testid="mobile-menu"
          >
            <div className="px-4 py-4 space-y-4">
              {/* Mobile Search */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">Busca</label>
                <SearchBar fullWidth onClose={toggleMobileMenu} />
                <LocationSearch className="w-full justify-between" onLocationSelect={(loc) => {
                  handleLocationSelect(loc);
                  toggleMobileMenu();
                }} />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase px-2">Navegação</label>
                {/* Mobile Categories Dropdown */}
                <div className="relative" ref={mobileDropdownRef} data-testid="categories-dropdown-mobile">
                  <Button
                    variant="ghost"
                    onClick={toggleMobileDropdown}
                    className="w-full justify-between text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary"
                    aria-expanded={isDropdownOpen}
                  >
                    Categorias
                    <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </Button>
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-gray-50 rounded-md mt-1 overflow-hidden"
                      >
                        {loading ? (
                          <div className="px-4 py-3 text-sm text-gray-500">Carregando...</div>
                        ) : error ? (
                          <div className="px-4 py-3 text-sm text-red-500">
                            Erro ao carregar.
                            <Button variant="link" className="text-blue-600 p-0 h-auto ml-1" onClick={() => refresh()}>Tentar novamente</Button>
                          </div>
                        ) : (
                          <div className="py-1">
                             {featuredCategories.map((category) => (
                              <Link
                                key={category.id}
                                href={`/categories/${category.seo_url || category.id}`}
                                className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-primary"
                                onClick={toggleMobileMenu}
                              >
                                {category.name}
                              </Link>
                            ))}
                            <Link
                              href="/categories"
                              className="block px-4 py-2 text-sm font-medium text-primary hover:bg-gray-100"
                              onClick={toggleMobileMenu}
                            >
                              Ver todas as categorias →
                            </Link>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link
                  href="/companies"
                  className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary rounded-md"
                  onClick={toggleMobileMenu}
                >
                  Empresas
                </Link>
                <Link
                  href="/products"
                  className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary rounded-md"
                  onClick={toggleMobileMenu}
                >
                  Produtos
                </Link>
                <Link
                  href="/blog"
                  className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary rounded-md"
                  onClick={toggleMobileMenu}
                >
                  Blog
                </Link>
              </div>

              {/* Mobile Auth */}
              <div className="pt-4 border-t border-gray-100 space-y-2">
                {!isAuthenticated ? (
                  <>
                    <Button asChild variant="outline" className="w-full justify-center">
                      <Link href="/login" onClick={toggleMobileMenu}>Login</Link>
                    </Button>
                    <Button asChild className="w-full justify-center">
                      <Link href="/register" onClick={toggleMobileMenu}>Cadastre sua empresa</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="px-2 pb-2 text-sm text-gray-500">
                      Logado como <span className="font-medium text-gray-900">{user?.name}</span>
                    </div>
                    <Button asChild className="w-full justify-start" variant="ghost">
                      <Link href="/profile" onClick={toggleMobileMenu}>Minha conta</Link>
                    </Button>
                    {user?.role === 'company' && (
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link href="/dashboard/company" onClick={toggleMobileMenu}>Dashboard da empresa</Link>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => { handleLogout(); toggleMobileMenu(); }}
                    >
                      Sair
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
