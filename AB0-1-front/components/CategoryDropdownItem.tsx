'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Category } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { buildCategoryPath } from '@/lib/slug';
import { ChevronRight } from 'lucide-react';
import { getCategoryVisualAsset } from '@/lib/categoryVisualAssets';

interface CategoryDropdownItemProps {
  category: Category;
  onSelect: () => void;
}

const CategoryDropdownItem: React.FC<CategoryDropdownItemProps> = ({ category, onSelect }) => {
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hoverTimerRef = useRef<number | null>(null);

  const hasSubcategories = category.subcategories && category.subcategories.length > 0;
  const iconSrc = getCategoryVisualAsset(category.seo_url, category.name);
  const categoryKey = String(category.seo_url ?? category.id ?? category.name)
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-');
  const submenuId = `submenu-${categoryKey}`;
  const dropdownEventName = 'category-dropdown:open';

  const openSubMenu = useCallback(() => {
    setIsSubMenuOpen(true);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(dropdownEventName, { detail: { id: submenuId } }));
    }
  }, [submenuId]);

  const closeSubMenu = useCallback(() => {
    setIsSubMenuOpen(false);
  }, []);

  const handleToggle = useCallback(() => {
    if (!hasSubcategories) return;
    if (isSubMenuOpen) {
      closeSubMenu();
      return;
    }
    openSubMenu();
  }, [closeSubMenu, hasSubcategories, isSubMenuOpen, openSubMenu]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleToggle();
      }
    },
    [handleToggle]
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !hasSubcategories) return;

    const handleOtherDropdownOpen = (event: Event) => {
      const customEvent = event as CustomEvent<{ id?: string }>;
      if (customEvent.detail?.id && customEvent.detail.id !== submenuId) {
        setIsSubMenuOpen(false);
      }
    };

    window.addEventListener(dropdownEventName, handleOtherDropdownOpen as EventListener);
    return () => {
      window.removeEventListener(dropdownEventName, handleOtherDropdownOpen as EventListener);
    };
  }, [hasSubcategories, submenuId]);

  useEffect(() => {
    if (typeof document === 'undefined' || !hasSubcategories || !isSubMenuOpen) return;

    const handlePointerDownOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current?.contains(event.target as Node)) return;
      closeSubMenu();
    };

    document.addEventListener('mousedown', handlePointerDownOutside);
    document.addEventListener('touchstart', handlePointerDownOutside);

    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside);
      document.removeEventListener('touchstart', handlePointerDownOutside);
    };
  }, [closeSubMenu, hasSubcategories, isSubMenuOpen]);

  useEffect(() => {
    if (typeof window === 'undefined' || !hasSubcategories || !containerRef.current) return;

    const node = containerRef.current;
    const hoverMediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

    const handleMouseEnter = () => {
      if (!hoverMediaQuery.matches) return;
      if (hoverTimerRef.current) {
        window.clearTimeout(hoverTimerRef.current);
      }
      hoverTimerRef.current = window.setTimeout(() => openSubMenu(), 150);
    };

    const handleMouseLeave = () => {
      if (!hoverMediaQuery.matches) return;
      if (hoverTimerRef.current) {
        window.clearTimeout(hoverTimerRef.current);
      }
      closeSubMenu();
    };

    node.addEventListener('mouseenter', handleMouseEnter);
    node.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      node.removeEventListener('mouseenter', handleMouseEnter);
      node.removeEventListener('mouseleave', handleMouseLeave);
      if (hoverTimerRef.current) {
        window.clearTimeout(hoverTimerRef.current);
      }
    };
  }, [closeSubMenu, hasSubcategories, openSubMenu]);

  return (
    <div ref={containerRef} className="relative" data-testid={`category-dropdown-${categoryKey}`}>
      {hasSubcategories ? (
        <button
          type="button"
          data-testid={`category-${categoryKey}`}
          aria-expanded={isSubMenuOpen}
          aria-controls={submenuId}
          aria-haspopup="true"
          className="flex min-h-12 w-full touch-manipulation items-center justify-between rounded-md px-4 py-3 text-left text-sm text-gray-700 transition-colors duration-150 hover:bg-gray-100 active:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
        >
          <span className="flex min-w-0 items-center gap-2 pr-3 font-medium">
            {iconSrc ? (
              <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
                <Image
                  src={iconSrc}
                  alt={`Ícone de ${category.name}`}
                  fill
                  sizes="32px"
                  className="object-contain p-1"
                />
              </span>
            ) : null}
            <span className="truncate">{category.name}</span>
          </span>
          <ChevronRight
            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isSubMenuOpen ? 'rotate-90 text-primary' : ''}`}
          />
        </button>
      ) : (
        <Link
          href={buildCategoryPath(category.seo_url, category.id)}
          className="flex min-h-12 items-center justify-between rounded-md px-4 py-3 text-sm text-gray-700 transition-colors duration-150 hover:bg-gray-100 active:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          onClick={onSelect}
        >
          <span className="flex min-w-0 items-center gap-2">
            {iconSrc ? (
              <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
                <Image
                  src={iconSrc}
                  alt={`Ícone de ${category.name}`}
                  fill
                  sizes="32px"
                  className="object-contain p-1"
                />
              </span>
            ) : null}
            <span className="truncate">{category.name}</span>
          </span>
        </Link>
      )}
      <AnimatePresence>
        {isSubMenuOpen && hasSubcategories && (
          <motion.div
            id={submenuId}
            data-testid={submenuId}
            role="region"
            aria-label={`Subcategorias de ${category.name}`}
            aria-hidden={!isSubMenuOpen}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="overflow-hidden rounded-md bg-gray-50/80"
          >
            <div className="space-y-1 px-2 py-2">
              <Link
                href={buildCategoryPath(category.seo_url, category.id)}
                className="block rounded-md px-4 py-3 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-white active:bg-white"
                onClick={onSelect}
              >
                Ver {category.name}
              </Link>
              {category.subcategories?.map((sub: Category) => {
                const subIconSrc = getCategoryVisualAsset(sub.seo_url, sub.name);

                return (
                  <Link
                    key={sub.id}
                    href={buildCategoryPath(sub.seo_url, sub.id)}
                    className="flex items-center gap-2 rounded-md px-4 py-3 text-sm text-gray-700 transition-colors duration-150 hover:bg-white active:bg-white"
                    onClick={onSelect}
                  >
                    {subIconSrc ? (
                      <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
                        <Image
                          src={subIconSrc}
                          alt=""
                          fill
                          sizes="28px"
                          className="object-contain p-0.5"
                        />
                      </span>
                    ) : null}
                    <span className="truncate">{sub.name}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoryDropdownItem;
