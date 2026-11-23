'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, ChevronDown, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/api';
import { preloadCategoriesTree } from '@/hooks/useCategoriesTree';

const loadCategoriesMegaMenu = () =>
  import('@/components/categories/CategoriesMegaMenu').then((mod) => mod.CategoriesMegaMenu);

const CategoriesMegaMenu = dynamic(loadCategoriesMegaMenu, {
  ssr: false,
  loading: () => null,
});

const MobileCategoriesDrawer = dynamic(
  () =>
    import('@/components/navigation/MobileCategoriesDrawer').then(
      (mod) => mod.MobileCategoriesDrawer
    ),
  { ssr: false, loading: () => null }
);

export interface CategoryRibbonItem {
  id: string;
  name: string;
  href: string;
  iconSrc: string;
  alt: string;
}

export const RIBBON_SHORTCUTS: CategoryRibbonItem[] = [
  {
    id: 'solar',
    name: 'Energia Solar',
    href: '/categories/energia-solar',
    iconSrc: '/3d-refined/A11_energia-solar-256.webp',
    alt: 'Energia Solar',
  },
  {
    id: 'mobilidade',
    name: 'Mobilidade Elétrica',
    href: '/categories/mobilidade-eletrica',
    iconSrc: '/3d-refined/D06_veiculos-eletricos-256.webp',
    alt: 'Mobilidade Elétrica',
  },
  {
    id: 'inversores',
    name: 'Painéis & Inversores',
    href: '/categories/inversores-solares',
    iconSrc: '/3d-refined/A08_inversores-256.webp',
    alt: 'Painéis e Inversores',
  },
  {
    id: 'wallbox',
    name: 'Wallbox & Recarga',
    href: '/categories/carregadores-residenciais',
    iconSrc: '/3d-refined/D02_carregadores-residenciais-wallbox-256.webp',
    alt: 'Wallbox e Recarga',
  },
  {
    id: 'baterias',
    name: 'Baterias & Armazenamento',
    href: '/categories/baterias-armazenamento',
    iconSrc: '/3d-refined/A01_baterias-e-armazenamento-de-energia-256.webp',
    alt: 'Baterias e Armazenamento',
  },
  {
    id: 'mercado-livre',
    name: 'Mercado Livre de Energia',
    href: '/categories/mercado-livre-de-energia',
    iconSrc: '/3d-refined/C01_mercado-livre-de-energia-256.webp',
    alt: 'Mercado Livre de Energia',
  },
  {
    id: 'frotas',
    name: 'Frotas Elétricas',
    href: '/categories/veiculos-eletricos',
    iconSrc: '/3d-refined/B01_frotas-eletricas-corporativas-256.webp',
    alt: 'Frotas Elétricas',
  },
  {
    id: 'offgrid',
    name: 'Casa Sustentável & Off-Grid',
    href: '/categories/kits-offgrid',
    iconSrc: '/3d-refined/G01_kits-solares-para-autossuficiencia-256.webp',
    alt: 'Casa Sustentável e Off-Grid',
  },
  {
    id: 'estruturas',
    name: 'Estruturas & Fixação',
    href: '/categories/estruturas-fixacao',
    iconSrc: '/3d-refined/A12_estruturas-e-fixacao-256.webp',
    alt: 'Estruturas e Fixação',
  },
  {
    id: 'monitoramento',
    name: 'Monitoramento & O&M',
    href: '/categories/monitoramento-operacao-manutencao',
    iconSrc: '/3d-refined/A09_monitoramento-e-o-e-m-256.webp',
    alt: 'Monitoramento e O&M',
  },
  {
    id: 'apps',
    name: 'Apps & Softwares',
    href: '/categories/apps-software-plataformas',
    iconSrc: '/3d-refined/F03_monitoramento-de-energia-solar-256.webp',
    alt: 'Apps e Softwares',
  },
];

export interface HomeCategoryRibbonProps {
  categories?: Category[];
  className?: string;
}

export function HomeCategoryRibbon({ className }: HomeCategoryRibbonProps) {
  const pathname = usePathname();
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const megaMenuContainerRef = React.useRef<HTMLDivElement>(null);
  const categoriesButtonRef = React.useRef<HTMLButtonElement>(null);

  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = React.useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [menuMounted, setMenuMounted] = React.useState(false);

  const prewarmMenu = React.useCallback(() => {
    if (!menuMounted) {
      setMenuMounted(true);
      void loadCategoriesMegaMenu();
      void preloadCategoriesTree();
    }
  }, [menuMounted]);

  const toggleCategories = () => {
    prewarmMenu();
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsDrawerOpen((prev) => !prev);
    } else {
      setIsMegaMenuOpen((prev) => !prev);
    }
  };

  const closeMegaMenu = React.useCallback(() => {
    setIsMegaMenuOpen(false);
    categoriesButtonRef.current?.focus();
  }, []);

  const closeDrawer = React.useCallback(() => {
    setIsDrawerOpen(false);
    categoriesButtonRef.current?.focus();
  }, []);

  const checkScroll = React.useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 6);
  }, []);

  React.useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  React.useEffect(() => {
    if (!isMegaMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        megaMenuContainerRef.current &&
        !megaMenuContainerRef.current.contains(event.target as Node)
      ) {
        setIsMegaMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMegaMenuOpen]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distance = direction === 'left' ? -380 : 380;
    el.scrollBy({ left: distance, behavior: 'smooth' });
  };

  const isTudoActive = pathname === '/';
  const isFavoritesActive = pathname === '/favorites';

  return (
    <div
      ref={megaMenuContainerRef}
      className={cn(
        'relative w-full border-b border-slate-100 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] select-none',
        className
      )}
    >
      <nav
        role="region"
        aria-label="Categorias principais"
        data-testid="home-category-ribbon-shell"
        className="relative mx-auto flex h-[76px] max-w-[1330px] items-center px-3 sm:h-[82px] sm:px-6 md:px-4"
      >
        {/* Seta de navegação esquerda */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="Rolar categorias para esquerda"
            className="absolute left-4 z-20 hidden md:flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition-all hover:bg-slate-50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {/* Gradiente sutil à esquerda */}
        {canScrollLeft && (
          <div
            className="pointer-events-none absolute left-4 top-0 bottom-0 w-10 bg-gradient-to-r from-white via-white/80 to-transparent z-10 hidden md:block"
            aria-hidden="true"
          />
        )}

        {/* Trilho rolável horizontal */}
        <div
          ref={scrollContainerRef}
          tabIndex={0}
          role="region"
          aria-label="Trilho de categorias e atalhos"
          className="flex w-full min-w-0 items-center gap-4 overflow-x-auto scroll-smooth py-1 no-scrollbar sm:gap-6 md:pr-10 lg:gap-7 focus-visible:rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* 1. Categorias ▾ */}
          <button
            ref={categoriesButtonRef}
            type="button"
            onClick={toggleCategories}
            onPointerEnter={prewarmMenu}
            onFocus={prewarmMenu}
            aria-expanded={isMegaMenuOpen || isDrawerOpen}
            aria-haspopup="dialog"
            aria-label="Abrir menu completo de categorias"
            className="group flex flex-col items-center justify-center shrink-0 min-w-[64px] sm:min-w-[70px] max-w-[92px] py-1 text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg transition-transform duration-150 hover:-translate-y-0.5"
          >
            <div className="relative h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center shrink-0">
              <Image
                src="/icones/icone_categorias_avalia_solar.png"
                alt="Ícone de Categorias"
                width={36}
                height={36}
                priority
                className="object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-150"
              />
            </div>
            <div className="mt-1 flex items-center text-[11px] sm:text-xs font-semibold leading-tight text-slate-700 group-hover:text-blue-700 transition-colors">
              <span>Categorias</span>
              <ChevronDown
                className={cn(
                  'ml-0.5 h-3.5 w-3.5 text-slate-500 transition-transform duration-200',
                  (isMegaMenuOpen || isDrawerOpen) && 'rotate-180 text-blue-600'
                )}
                aria-hidden="true"
              />
            </div>
          </button>

          {/* 2. Favoritos */}
          <Link
            href="/favorites"
            aria-current={isFavoritesActive ? 'page' : undefined}
            className={cn(
              'group relative flex flex-col items-center justify-center shrink-0 min-w-[58px] sm:min-w-[66px] max-w-[88px] py-1 text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg transition-transform duration-150 hover:-translate-y-0.5',
              isFavoritesActive &&
                "after:content-[''] after:absolute after:-bottom-[12px] after:left-1 after:right-1 after:h-[2.5px] after:bg-slate-950 after:rounded-full"
            )}
          >
            <div className="relative h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center shrink-0">
              <Heart
                className="h-7 w-7 text-rose-500 fill-rose-500 drop-shadow-sm group-hover:scale-105 transition-transform duration-150"
                aria-hidden="true"
              />
            </div>
            <span
              className={cn(
                'mt-1 text-[11px] sm:text-xs font-semibold leading-tight text-slate-700 group-hover:text-blue-700 transition-colors',
                isFavoritesActive && 'text-slate-950 font-bold'
              )}
            >
              Favoritos
            </span>
          </Link>

          {/* 3. Tudo */}
          <Link
            href="/"
            aria-current={isTudoActive ? 'page' : undefined}
            className={cn(
              'group relative flex flex-col items-center justify-center shrink-0 min-w-[52px] sm:min-w-[60px] max-w-[80px] py-1 text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg transition-transform duration-150 hover:-translate-y-0.5',
              isTudoActive &&
                "after:content-[''] after:absolute after:-bottom-[12px] after:left-1 after:right-1 after:h-[2.5px] after:bg-slate-950 after:rounded-full"
            )}
          >
            <div className="relative h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center shrink-0">
              <Image
                src="/icones/icone_destaques_avalia_solar.png"
                alt="Ícone Tudo"
                width={36}
                height={36}
                priority
                className="object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-150"
              />
            </div>
            <span
              className={cn(
                'mt-1 text-[11px] sm:text-xs font-semibold leading-tight text-slate-700 group-hover:text-blue-700 transition-colors',
                isTudoActive && 'text-slate-950 font-bold'
              )}
            >
              Tudo
            </span>
          </Link>

          {/* 4. Atalhos de Categorias 3D */}
          {RIBBON_SHORTCUTS.map((item, index) => {
            const isActive =
              pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'group relative flex flex-col items-center justify-center shrink-0 min-w-[66px] sm:min-w-[76px] max-w-[98px] py-1 text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg transition-transform duration-150 hover:-translate-y-0.5',
                  isActive &&
                    "after:content-[''] after:absolute after:-bottom-[12px] after:left-1.5 after:right-1.5 after:h-[2.5px] after:bg-slate-950 after:rounded-full"
                )}
              >
                <div className="relative h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center shrink-0">
                  <Image
                    src={item.iconSrc}
                    alt={item.alt}
                    width={36}
                    height={36}
                    priority={index < 5}
                    className="object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-150"
                  />
                </div>
                <span
                  className={cn(
                    'mt-1 text-[11px] sm:text-xs font-semibold leading-tight text-slate-700 group-hover:text-blue-700 transition-colors line-clamp-2 text-center max-w-[94px]',
                    isActive && 'text-slate-950 font-bold'
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Gradiente sutil à direita */}
        {canScrollRight && (
          <div
            className="pointer-events-none absolute right-4 top-0 bottom-0 w-10 bg-gradient-to-l from-white via-white/80 to-transparent z-10 hidden md:block"
            aria-hidden="true"
          />
        )}

        {/* Seta de navegação direita */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="Rolar categorias para direita"
            className="absolute right-4 z-20 hidden md:flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition-all hover:bg-slate-50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </nav>

      {/* Dropdown / MegaMenu no Desktop */}
      {menuMounted && isMegaMenuOpen && (
        <CategoriesMegaMenu
          id="home-ribbon-categories-mega-menu"
          isOpen={isMegaMenuOpen}
          onClose={closeMegaMenu}
        />
      )}

      {/* Drawer Lateral no Mobile / Tablet */}
      {menuMounted && (
        <MobileCategoriesDrawer
          id="home-ribbon-mobile-categories-drawer"
          isOpen={isDrawerOpen}
          onClose={closeDrawer}
        />
      )}
    </div>
  );
}

export default HomeCategoryRibbon;

