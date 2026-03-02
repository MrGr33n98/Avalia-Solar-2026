'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, Sun, Wrench, Banknote } from 'lucide-react';
import { track } from '@/lib/analytics/lazy';

const HIGHLIGHTS = [
  {
    id: 'economia',
    title: 'Economia e Tarifas',
    icon: Wallet,
    color: 'text-green-500',
    bg: 'bg-green-50',
    href: '/categories/financiamento-solar' 
  },
  {
    id: 'installation',
    title: 'Instalação Solar',
    icon: Sun,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    href: '/categories/energia-solar-residencial'
  },
  {
    id: 'maintenance',
    title: 'Manutenção',
    icon: Wrench,
    color: 'text-slate-500',
    bg: 'bg-slate-50',
    href: '/categories/limpeza-e-manutencao'
  },
  {
    id: 'financing',
    title: 'Empresas Top Rated',
    icon: Banknote,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    href: '/companies?sort=rating'
  }
];

export function CategoryHighlights() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 my-12">
      {HIGHLIGHTS.map((item) => (
        <Link 
          key={item.id} 
          href={item.href} 
          className="group"
          onClick={() => track('blog_category_click', {
            category_id: item.id,
            category_name: item.title,
            element_type: 'highlight_card'
          })}
        >
          <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white group-hover:-translate-y-1">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-3">
              <span className="font-bold text-slate-700 group-hover:text-primary transition-colors text-lg">
                {item.title}
              </span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
