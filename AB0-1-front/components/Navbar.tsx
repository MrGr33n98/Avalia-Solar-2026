'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import CategoryDropdownItem from './CategoryDropdownItem';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useCategories } from '@/hooks/useCategories';
import { Category } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import SearchBar from './SearchBar'; // Corrected: Removed duplicate import of Button and useState

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { categories, loading, error } = useCategories();
  const { user, isAuthenticated } = useAuth();

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

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        {/* Logo - TAMANHO AUMENTADO */}
        <Link href="/" className="flex items-center space-x-2" aria-label="Home Avalia Solar">
          <Image src="/images/logo.png" alt="Avalia Solar Logo" width={64} height={64} className="h-16 w-auto" priority /> {/* Valores alterados aqui */}
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {/* Categories Dropdown */}
          <div className="relative">
            <Button
              variant="ghost"
              onClick={toggleDropdown}
              className="flex items-center text-sm font-medium text-gray-700 hover:text-primary focus:outline-none"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
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
                  onMouseLeave={() => setIsDropdownOpen(false)} // Close on mouse leave
                >
                  <div className="py-1">
                    {loading ? (
                      <div className="px-4 py-2 text-gray-500">Carregando...</div>
                    ) : error ? (
                      <div className="px-4 py-2 text-red-500">Erro ao carregar categorias.</div>
                    ) : featuredCategories.length > 0 ? (
                      featuredCategories.map((category) => (
                        <CategoryDropdownItem
                          key={category.id}
                          category={category}
                          onSelect={() => setIsDropdownOpen(false)}
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
          <Link href="/plans" className="text-gray-700 hover:text-primary">
            Planos
          </Link>
          {!isAuthenticated && (
            <Button asChild variant="outline">
              <Link href="/login">Login</Link>
            </Button>
          )}
          {isAuthenticated && user?.role === 'user' && (
            <Button asChild variant="ghost">
              <Link href="/reviews/my">Minhas avaliações</Link>
            </Button>
          )}
          {(!isAuthenticated || user?.role !== 'user') && (
            <Button asChild>
              <Link href="/register">Cadastre sua empresa</Link>
            </Button>
          )}
          {isAuthenticated && user?.role === 'company' && (
            <Button asChild variant="outline">
              <Link href="/dashboard/company">Dashboard da empresa</Link>
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
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
              <div className="relative">
                <Button
                  variant="ghost"
                  onClick={toggleDropdown}
                  className="w-full justify-between text-gray-700 hover:text-primary"
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
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
                        <div className="px-4 py-2 text-gray-500">Carregando...</div>
                      ) : error ? (
                        <div className="px-4 py-2 text-red-500">Erro ao carregar categorias.</div>
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
                href="/plans"
                className="block py-2 text-gray-700 hover:text-primary"
                onClick={toggleMobileMenu}
              >
                Planos
              </Link>
              {!isAuthenticated && (
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login" onClick={toggleMobileMenu}>Login</Link>
                </Button>
              )}
              {isAuthenticated && user?.role === 'user' && (
                <Button asChild className="w-full">
                  <Link href="/reviews/my" onClick={toggleMobileMenu}>Minhas avaliações</Link>
                </Button>
              )}
              {(!isAuthenticated || user?.role !== 'user') && (
                <Button asChild className="w-full">
                  <Link href="/register" onClick={toggleMobileMenu}>Cadastre sua empresa</Link>
                </Button>
              )}
              {isAuthenticated && user?.role === 'company' && (
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/company" onClick={toggleMobileMenu}>Dashboard da empresa</Link>
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
