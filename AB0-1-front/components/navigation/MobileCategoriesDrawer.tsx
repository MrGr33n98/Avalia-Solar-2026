'use client';

import React from 'react';
import { useCategoriesTree } from '@/hooks/useCategoriesTree';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { getPreferredCategoryIcon } from '@/components/categories/categoryIcons';
import { Zap, RefreshCw } from 'lucide-react';

interface MobileCategoriesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileCategoriesDrawer: React.FC<MobileCategoriesDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const { categories, loading, error } = useCategoriesTree();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0 flex flex-col">
        <SheetHeader className="p-6 border-b border-slate-100">
          <SheetTitle className="text-xl font-bold text-slate-900">Categorias</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4 py-2">
          {loading ? (
            <div className="space-y-4 px-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-50 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-1/2" />
                    <div className="h-3 bg-slate-50 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : error && categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="bg-amber-50 text-amber-500 p-5 rounded-3xl mb-6 ring-8 ring-amber-50/50">
                <Zap className="h-10 w-10" />
              </div>
              <h3 className="text-slate-900 text-lg font-bold mb-2">Ops! Menu em Manutenção</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                Estamos ajustando as categorias. Tente recarregar ou explore todas as opções no link abaixo.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-white border-2 border-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
              >
                <RefreshCw className="h-4 w-4 text-blue-500" />
                Recarregar Menu
              </button>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full px-2">
              {categories.map((category) => {
                const iconSrc = getPreferredCategoryIcon(category.slug, category.icon_url);
                return (
                <AccordionItem key={category.id} value={`item-${category.id}`} className="border-slate-50 last:border-0">
                  <AccordionTrigger className="text-[15px] font-bold text-slate-900 hover:no-underline py-5 group">
                    <div className="flex items-center justify-between w-full pr-2">
                      <div className="flex items-center gap-4">
                        <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 overflow-hidden">
                          {iconSrc ? (
                            <div className="w-full h-full relative">
                              <Image src={iconSrc} alt={category.name} fill className="object-contain" />
                            </div>
                          ) : (
                            <Zap className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex flex-col items-start gap-0.5">
                          <span>{category.name}</span>
                          {category.companies_count > 0 && (
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                              {category.companies_count} Empresas
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="flex flex-col gap-1.5 pl-14 pr-2">
                      <Link
                        href={`/categories/${category.slug}`}
                        onClick={onClose}
                        className="text-sm font-bold text-blue-600 py-3 px-4 bg-blue-50/50 rounded-xl flex items-center justify-between active:scale-95 transition-transform"
                      >
                        <span>Ver tudo em {category.name}</span>
                      </Link>
                      {category.children.map((child) => (
                        <Link
                          key={child.id}
                          href={`/categories/${child.slug}`}
                          onClick={onClose}
                          className="text-sm font-medium text-slate-600 py-3 px-4 hover:bg-slate-50 rounded-xl transition-colors flex items-center justify-between active:bg-slate-100"
                        >
                          <span>{child.name}</span>
                          {child.companies_count > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-400">
                              {child.companies_count}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </ScrollArea>

        <div className="p-6 bg-slate-50 border-t border-slate-100 mt-auto">
          <Link
            href="/categories"
            onClick={onClose}
            className="flex items-center justify-center w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all"
          >
            Todas as Categorias
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
};
