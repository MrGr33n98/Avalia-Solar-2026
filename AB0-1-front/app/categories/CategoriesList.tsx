'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCategories } from '@/hooks/useCategories';
import CategoryCard from '@/components/CategoryCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function CategoriesList() {
  const { categories, loading } = useCategories(true); // Pass true to fetch all categories

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto py-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            Todas as Categorias
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Explore todas as categorias de produtos e serviços de energia solar disponíveis em nossa plataforma.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))}
          </div>
        ) : categories && categories.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {categories.map((category) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CategoryCard category={category} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <p className="text-xl text-gray-500">
              Nenhuma categoria encontrada.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}