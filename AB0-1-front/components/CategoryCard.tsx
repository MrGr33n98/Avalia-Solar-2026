'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';

import styles from './CategoryCard.module.css';
import { Category } from '@/lib/api';

interface CategoryCardProps {
  category: Category;
  className?: string;
}

export default function CategoryCard({ category, className = "" }: CategoryCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const displayData = {
    id: category?.id,
    name: category?.name || 'Nome da Categoria',
    description: category?.short_description || category?.description || 'Categoria de energia solar.',
    banner_url: !imageError && category?.banner_url
      ? category.banner_url
      : "/images/category-placeholder.svg",
    seo_url: category?.seo_url ? `categories/${category.seo_url}` : `categories/${category.id}`,
    featured: category?.featured || false,
    status: category?.status || 'active',
    companies_count: category?.companies_count ?? category?.companies?.length ?? 0,
    products_count: (category as any)?.products_count ?? category?.products?.length ?? 0
  };

  return (
    <motion.div
      className={`${styles.root} ${className}`}
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* UI simplificada: manter funcionalidade (clique/navegação + fallback), exibindo apenas o banner */}
      <div className={styles.banner}>
        {displayData.banner_url && !imageError ? (
          <Image
            src={displayData.banner_url}
            alt={`Banner da categoria ${displayData.name}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={styles.bannerImage}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={styles.fallback}>{displayData.name.charAt(0)}</div>
        )}
      </div>

      {/* Clickable Overlay (preserva comportamento existente) */}
      <Link
        href={`/${displayData.seo_url}`}
        className={styles.linkOverlay}
        aria-label={`Ver detalhes da categoria ${displayData.name}`}
      />
    </motion.div>
  );
}
