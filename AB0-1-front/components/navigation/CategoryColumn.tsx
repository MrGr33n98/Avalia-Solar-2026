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
    <div className="flex flex-col gap-4">
      <Link
        href={`/categories/${category.slug}`}
        className="group flex items-center gap-3 text-lg font-bold text-slate-900 hover:text-primary transition-colors"
      >
        {category.icon_url && (
          <div className="w-8 h-8 relative shrink-0">
            <Image
              src={category.icon_url}
              alt={category.name}
              fill
              className="object-contain"
            />
          </div>
        )}
        <span>{category.name}</span>
        <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
      </Link>

      <ul className="flex flex-col gap-2">
        {category.children.map((child) => (
          <motion.li
            key={child.id}
            whileHover={{ x: 4 }}
            className="transition-all"
          >
            <Link
              href={`/categories/${child.slug}`}
              className="text-sm text-slate-600 hover:text-primary hover:font-medium transition-colors"
            >
              {child.name}
            </Link>
          </motion.li>
        ))}
      </ul>
    </div>
  );
};
