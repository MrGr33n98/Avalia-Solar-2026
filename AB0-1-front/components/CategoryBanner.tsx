'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Users, Package, TrendingUp } from 'lucide-react';
import { Category } from '@/lib/api';

interface CategoryBannerProps {
  category: Category;
  companiesCount?: number;
  productsCount?: number;
  height?: string; // Nova prop para controlar altura
}

const CategoryBanner = ({ 
  category, 
  companiesCount = 0, 
  productsCount = 0,
  height = "h-24 sm:h-28 md:h-32 lg:h-36" // Valor padrão
}: CategoryBannerProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      // largura controlada e centralizada - altura reduzida para ficar igual aos outros banners
      className={`relative w-auto max-w-5xl mx-auto ${height} rounded-xl overflow-hidden shadow-lg`}
    >
      {/* Background Image or Gradient */}
      <div className="absolute inset-0">
        {category.banner_url && !imageError ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 animate-pulse" />
            )}
            <img
              src={category.banner_url}
              alt={`${category.name} Banner`}
              className={`w-full h-full object-cover transition-opacity duration-500 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onError={() => setImageError(true)}
              onLoad={() => setImageLoaded(true)}
            />
            <div className="absolute inset-0 bg-black/40" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800" />
        )}
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 h-full flex items-center p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between w-full gap-4">
          {/* Left Content */}
          <div className="flex-1 text-white">
            {category.featured && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 mb-2"
              >
                <Sparkles className="h-4 w-4 text-yellow-300" />
                <span className="text-xs font-medium">Categoria em Destaque</span>
              </motion.div>
            )}

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-2xl lg:text-3xl font-bold leading-tight mb-1"
            >
              {category.name}
            </motion.h1>

            {category.short_description && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="hidden sm:block text-sm text-gray-200 max-w-xl"
              >
                {category.short_description}
              </motion.p>
            )}
          </div>

          {/* Right Stats */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex gap-3"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-center min-w-[90px]">
              <Users className="h-4 w-4 text-blue-300 mx-auto mb-1" />
              <span className="text-sm font-bold text-white">{companiesCount}</span>
              <p className="text-[10px] text-gray-300">{companiesCount === 1 ? 'Empresa' : 'Empresas'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-center min-w-[90px]">
              <Package className="h-4 w-4 text-green-300 mx-auto mb-1" />
              <span className="text-sm font-bold text-white">{productsCount}</span>
              <p className="text-[10px] text-gray-300">{productsCount === 1 ? 'Produto' : 'Produtos'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-center min-w-[90px]">
              <TrendingUp className="h-4 w-4 text-yellow-300 mx-auto mb-1" />
              <span className="text-sm font-bold text-white">{category.featured ? '★' : '↗'}</span>
              <p className="text-[10px] text-gray-300">{category.featured ? 'Destaque' : 'Crescendo'}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default CategoryBanner;
