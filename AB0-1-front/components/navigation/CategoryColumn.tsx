'use client';

import React from 'react';
import Link from 'next/link';
import { CategoryTreeNode } from '@/hooks/useCategoriesTree';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface CategoryColumnProps {
  category: CategoryTreeNode;
}

export const CategoryColumn: React.FC<CategoryColumnProps> = ({ category }) => {
  return (
    <div className="flex flex-col gap-3 min-w-0">
      <Link
        href={`/categories/${category.slug}`}
        className="group flex items-center gap-3 text-base font-bold text-slate-900 hover:text-primary transition-colors leading-tight"
      >
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
        <span className="truncate group-hover:whitespace-normal">{category.name}</span>
        <ChevronRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all shrink-0" />
      </Link>

      <ul className="flex flex-col gap-1.5">
        {category.children.map((child) => (
          <motion.li
            key={child.id}
            whileHover={{ x: 4 }}
            className="transition-all"
          >
            <Link
              href={`/categories/${child.slug}`}
              className="text-xs text-slate-600 hover:text-primary hover:font-medium transition-colors leading-relaxed block"
            >
              {child.name}
            </Link>
          </motion.li>
        ))}
      </ul>
    </div>
  );
};
