import React, { useState } from 'react';
import Link from 'next/link';
import { Category } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface CategoryDropdownItemProps {
  category: Category;
  onSelect: () => void;
}

const CategoryDropdownItem: React.FC<CategoryDropdownItemProps> = ({
  category,
  onSelect,
}) => {
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);

  const hasSubcategories = category.subcategories && category.subcategories.length > 0;

  return (
    <div
      className="relative"
      onMouseEnter={() => hasSubcategories && setIsSubMenuOpen(true)}
      onMouseLeave={() => isSubMenuOpen && setIsSubMenuOpen(false)}
    >
      <Link
        href={`/categories/${category.seo_url}`}
        className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        onClick={onSelect}
      >
        {category.name}
        {hasSubcategories && (
          <ChevronRight className={`h-4 w-4 transition-transform ${isSubMenuOpen ? 'rotate-90' : ''}`} />
        )}
      </Link>

      <AnimatePresence>
        {isSubMenuOpen && hasSubcategories && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute left-full top-0 mt-0 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
          >
            <div className="py-1">
              {category.subcategories?.map((sub: Category) => (
                <Link
                  key={sub.id}
                  href={`/categories/${sub.seo_url}`}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={onSelect}
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoryDropdownItem;