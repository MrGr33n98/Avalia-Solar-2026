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

        <ScrollArea className="flex-1 px-6 py-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-10 text-slate-500">
              Erro ao carregar categorias.
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {categories.map((category) => (
                <AccordionItem key={category.id} value={`item-${category.id}`} className="border-slate-100">
                  <AccordionTrigger className="text-base font-semibold text-slate-800 hover:text-primary transition-colors py-4">
                    <div className="flex items-center gap-3">
                      {category.icon_url && (
                        <div className="w-6 h-6 relative shrink-0">
                          <Image
                            src={category.icon_url}
                            alt={category.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                      )}
                      <span>{category.name}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-1 pl-4 pb-4">
                      <Link
                        href={`/categories/${category.slug}`}
                        onClick={onClose}
                        className="text-sm font-medium text-primary py-2"
                      >
                        Ver tudo em {category.name}
                      </Link>
                      {category.children.map((child) => (
                        <Link
                          key={child.id}
                          href={`/categories/${child.slug}`}
                          onClick={onClose}
                          className="text-sm text-slate-600 hover:text-primary py-2 transition-colors"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
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
