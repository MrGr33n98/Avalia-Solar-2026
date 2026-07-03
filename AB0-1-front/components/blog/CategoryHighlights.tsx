'use client';

import * as React from 'react';
import Link from 'next/link';
import { track } from '@/lib/analytics/lazy';

const HIGHLIGHTS = [
  { id: 'todos', title: 'Todos os Artigos', href: '/blog' },
  { id: 'economia', title: 'Economia & Tarifas', href: '/blog?category=financiamento-energia-solar' },
  { id: 'instalacao', title: 'Instalação Solar', href: '/blog?category=energia-solar-residencial' },
  { id: 'manutencao', title: 'Manutenção', href: '/blog?category=limpeza-e-manutencao' },
  { id: 'mobilidade', title: 'Mobilidade Elétrica', href: '/blog?category=mobilidade-eletrica' },
  { id: 'empresas', title: 'Top Rated', href: '/companies?sort=rating' },
];

export function CategoryHighlights() {
  return (
    <div className="bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav
          className="flex items-center overflow-x-auto scrollbar-hide -mb-px"
          aria-label="Categorias do blog"
        >
          {HIGHLIGHTS.map((item, i) => (
            <React.Fragment key={item.id}>
              {i > 0 && (
                <span
                  className="h-3.5 w-px bg-gray-200 shrink-0 mx-0.5"
                  aria-hidden="true"
                />
              )}
              <Link
                href={item.href}
                className="
                  whitespace-nowrap px-4 py-3.5 text-sm text-gray-500
                  hover:text-gray-900 font-medium border-b-2 border-transparent
                  hover:border-blue-500 transition-colors duration-150 shrink-0
                "
                onClick={() =>
                  track('blog_category_click', {
                    category_id: item.id,
                    category_name: item.title,
                    element_type: 'highlight_tab',
                  })
                }
              >
                {item.title}
              </Link>
            </React.Fragment>
          ))}
        </nav>
      </div>
    </div>
  );
}
