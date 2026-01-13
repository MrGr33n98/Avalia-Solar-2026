'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import CategoryDropdownItem from './CategoryDropdownItem';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useCategories } from '@/hooks/useCategories';
import { Category } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import SearchBar from './SearchBar'; // Corrected: Removed duplicate import of Button and useState
import NavbarSearch from './NavbarSearch';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const mobileDropdownRef = useRef<HTMLDivElement | null>(null);
  const { categories, loading, error, refresh } = useCategories(true);
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  // Since we're already filtering for featured categories in the API call,
  // let's not filter again here unless absolutely necessary
  const featuredCategories = categories;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsDropdownOpen(false); // Close dropdown when mobile menu toggles
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => setIsDropdownOpen(false);

  const activeDropdownRef = useMemo(() => {
    return isMobileMenuOpen ? mobileDropdownRef : dropdownRef;
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Close mobile menu and dropdown on route change (if using next/router)
  // Or simply close on any click outside if not using next/router for simplicity
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

  useEffect(() => {
    if (!isDropdownOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const el = activeDropdownRef.current;
      if (!el) return;
      if (event.target instanceof Node && el.contains(event.target)) return;
      closeDropdown();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDropdown();
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [activeDropdownRef, isDropdownOpen]);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4 h-16">
        {/* Logo - TAMANHO AUMENTADO */}
        <Link href="/" className="flex items-center space-x-2" aria-label="Home Avalia Solar">
          <Image src="/images/logo.png" alt="Avalia Solar Logo" width={64} height={64} className="h-16" style={{ width: 'auto' }} priority /> {/* Valores alterados aqui */}
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex flex-1 items-center gap-4">
          <NavbarSearch className="flex-1 max-w-[520px]" />

          <div className="flex items-center space-x-6 ml-auto">
          {/* Categories Dropdown */}
          <div className="relative" ref={dropdownRef} data-testid="categories-dropdown-desktop">
            <Button
              variant="ghost"
              onClick={toggleDropdown}
              className="flex items-center text-sm font-medium text-gray-700 hover:text-primary focus:outline-none"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
              data-testid="categories-dropdown-trigger"
            >
              Categorias
              <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </Button>
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                  data-testid="categories-dropdown-menu"
                >
                  <div className="py-1 max-h-96 overflow-y-auto">
                    {loading ? (
                      <div className="px-4 py-2 text-gray-500">Carregando...</div>
                    ) : error ? (
                      <div className="px-4 py-2 text-red-500">
                        Erro ao carregar categorias.
                        <Button variant="link" className="text-blue-600 ml-2" onClick={() => refresh()}>Tentar novamente</Button>
                      </div>
                    ) : featuredCategories.length > 0 ? (
                      featuredCategories.map((category) => (
                        <CategoryDropdownItem
                          key={category.id}
                          category={category}
                          onSelect={closeDropdown}
                        />
                      ))
                    ) : (
                      <div className="px-4 py-2 text-gray-500">Nenhuma categoria encontrada.</div>
                    )}
                    <Link
                      href="/categories"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Ver Todas as Categorias <ChevronRight className="inline-block h-4 w-4 ml-1" />
                      </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link href="/companies" className="text-gray-700 hover:text-primary">
            Empresas
          </Link>
          <Link href="/products" className="text-gray-700 hover:text-primary">
            Produtos
          </Link>
          <Link href="/blog" className="text-gray-700 hover:text-primary">
            Blog
          </Link>
          {!isAuthenticated && (
            <>
              <Button asChild variant="outline">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Cadastre sua empresa</Link>
              </Button>
            </>
          )}
          {isAuthenticated && (
            <>
              <Button asChild variant="ghost">
                <Link href="/profile">Minha conta</Link>
              </Button>
              {user?.role === 'company' && (
                <Button asChild variant="outline">
                  <Link href="/dashboard/company">Dashboard da empresa</Link>
                </Button>
              )}
              <Button variant="outline" onClick={handleLogout}>
                Sair
              </Button>
            </>
          )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center ml-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            // ADDED/CONFIRMED: aria-label for accessibility
            aria-label="Menu"
            data-testid="mobile-menu-button"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10"
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
            className="md:hidden bg-white shadow-lg pb-4 overflow-hidden"
            data-testid="mobile-menu"
          >
            <div className="px-4 py-2">
              <SearchBar fullWidth onClose={toggleMobileMenu} />
            </div>
            <div className="flex flex-col space-y-2 px-4 mt-2">
              {/* Mobile Categories Dropdown */}
              <div className="relative" ref={mobileDropdownRef} data-testid="categories-dropdown-mobile">
                <Button
                  variant="ghost"
                  onClick={toggleDropdown}
                  className="w-full justify-between text-gray-700 hover:text-primary"
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                  data-testid="categories-dropdown-trigger-mobile"
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
                      className="bg-gray-50 rounded-md mt-1 max-h-96 overflow-y-auto"
                      data-testid="categories-dropdown-menu-mobile"
                    >
                      {loading ? (
                        <div className="px-4 py-2 text-gray-500">Carregando...</div>
                      ) : error ? (
                        <div className="px-4 py-2 text-red-500">
                          Erro ao carregar categorias.
                          <Button variant="link" className="text-blue-600 ml-2" onClick={() => refresh()}>Tentar novamente</Button>
                        </div>
                      ) : (
                        featuredCategories.map((category) => (
                          <CategoryDropdownItem
                            key={category.id}
                            category={category}
                            onSelect={toggleMobileMenu} // Close both menus
                          />
                        ))
                      )}
                      <Link
                        href="/categories"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={toggleMobileMenu}
                      >
                        Ver Todas as Categorias <ChevronRight className="inline-block h-4 w-4 ml-1" />
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link
                href="/companies"
                className="block py-2 text-gray-700 hover:text-primary"
                onClick={toggleMobileMenu}
              >
                Empresas
              </Link>
              <Link
                href="/products"
                className="block py-2 text-gray-700 hover:text-primary"
                onClick={toggleMobileMenu}
              >
                Produtos
              </Link>
              <Link
                href="/blog"
                className="block py-2 text-gray-700 hover:text-primary"
                onClick={toggleMobileMenu}
              >
                Blog
              </Link>
              {!isAuthenticated && (
                <>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/login" onClick={toggleMobileMenu}>Login</Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/register" onClick={toggleMobileMenu}>Cadastre sua empresa</Link>
                  </Button>
                </>
              )}
              {isAuthenticated && (
                <>
                  <Button asChild className="w-full">
                    <Link href="/profile" onClick={toggleMobileMenu}>Minha conta</Link>
                  </Button>
                  {user?.role === 'company' && (
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/dashboard/company" onClick={toggleMobileMenu}>Dashboard da empresa</Link>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => { handleLogout(); toggleMobileMenu(); }}
                  >
                    Sair
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

