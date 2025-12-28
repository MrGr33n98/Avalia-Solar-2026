'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Building2, Package, Info } from 'lucide-react';
import { Category } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const MotionDiv = motion.div;

type Variant = 'minimal' | 'rich' | 'interactive';

interface CategoryCardProps {
  category: Category;
  className?: string;
  variant?: Variant;
  lang?: 'pt-BR' | 'en-US' | 'es-ES';
  highlights?: string[];
  testimonials?: { quote: string; author?: string }[];
  certifications?: string[];
  kpis?: { label: string; value: string }[];
  schemaEnabled?: boolean;
}

export default function CategoryCard({ category, className = "", variant = 'rich', lang = 'pt-BR', highlights = [], testimonials = [], certifications = [], kpis = [], schemaEnabled = true }: CategoryCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Tratamento de dados defensivo
  const displayData = {
    id: category?.id,
    name: category?.name || 'Categoria',
    description: category?.short_description || category?.description || '',
    banner_url: !imageError && category?.banner_url
      ? category.banner_url
      : "/images/category-placeholder.svg", // Certifique-se de ter um placeholder ou use um gradiente fallback
    seo_url: category?.seo_url ? `/${category.seo_url}` : `/categories/${category.id}`,
    companies_count: category?.companies_count ?? category?.companies?.length ?? 0,
    products_count: (category as any)?.products_count ?? category?.products?.length ?? 0
  };

  const i18n = useMemo(() => {
    const dict = {
      'pt-BR': {
        explore: 'Explorar',
        companies: 'empresas',
        benefits: 'Benefícios',
        testimonials: 'Depoimentos',
      },
      'en-US': {
        explore: 'Explore',
        companies: 'companies',
        benefits: 'Benefits',
        testimonials: 'Testimonials',
      },
      'es-ES': {
        explore: 'Explorar',
        companies: 'empresas',
        benefits: 'Beneficios',
        testimonials: 'Testimonios',
      },
    } as const;
    return dict[lang] || dict['pt-BR'];
  }, [lang]);

  const jsonLd = useMemo(() => {
    if (!schemaEnabled) return null;
    const url = displayData.seo_url.startsWith('/') ? displayData.seo_url : `/${displayData.seo_url}`;
    return {
      '@context': 'https://schema.org',
      '@type': 'Thing',
      name: displayData.name,
      description: displayData.description,
      url,
    };
  }, [schemaEnabled, displayData.seo_url, displayData.name, displayData.description]);

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`h-full ${className}`}
    >
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <Link href={displayData.seo_url} prefetch className="block h-full group outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl" aria-label={displayData.name}>
        <Card 
          className="h-full flex flex-col overflow-hidden bg-white border-gray-200 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* 1. Área da Imagem (Header) */}
          <div className={`relative w-full overflow-hidden bg-gray-100 ${variant === 'minimal' ? 'h-40' : variant === 'interactive' ? 'h-56' : 'h-48'}`}>
            {displayData.banner_url && !imageError ? (
              <Image
                src={displayData.banner_url}
                alt={`Categoria: ${displayData.name} - ${displayData.description.slice(0, 50)}...`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className={`object-cover transition-transform duration-300 ease-out ${variant !== 'minimal' ? 'group-hover:scale-105' : ''}`}
                onError={() => setImageError(true)}
                priority={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                <Package className="w-12 h-12 text-blue-200" />
              </div>
            )}
            
            {/* Overlay Gradiente Suave para destacar o conteúdo abaixo se necessário */}
            {variant !== 'minimal' && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}
          </div>

          {/* 2. Corpo do Conteúdo */}
          <div className={`flex flex-col flex-1 ${variant === 'minimal' ? 'p-4' : 'p-5'}`}>
            {/* Cabeçalho do Card */}
            <div className="mb-3">
              <h3 className={`font-bold text-gray-900 leading-tight transition-colors mb-2 ${variant === 'minimal' ? 'text-base' : 'text-lg'} ${variant !== 'minimal' ? 'group-hover:text-blue-600' : ''}`}>
                {displayData.name}
              </h3>
              
              {displayData.description && variant !== 'minimal' && (
                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                  {displayData.description}
                </p>
              )}
            </div>

            <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50">
              {/* Stats / Badges */}
              <div className="flex items-center gap-3">
                {displayData.companies_count > 0 && (
                  <div className="flex items-center text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-md" title={`${displayData.companies_count} empresas nesta categoria`}>
                    <Building2 className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                    {displayData.companies_count}
                  </div>
                )}
                {kpis && kpis.length > 0 && variant === 'rich' && (
                  <div className="flex items-center gap-2">
                    {kpis.slice(0, 2).map((k, i) => (
                      <span key={i} className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md">{k.value}</span>
                    ))}
                  </div>
                )}
              </div>
              {/* Se quiser mostrar produtos também
              {displayData.products_count > 0 && (
                <div className="flex items-center text-xs font-medium text-gray-600">
                  <Package className="w-3.5 h-3.5 mr-1 text-gray-400" />
                  {displayData.products_count}
                </div>
              )}
              */}

              {/* Call to Action Visual */}
              <div className={`flex items-center text-sm font-semibold text-blue-600 transform transition-all duration-300 ${variant === 'interactive' ? (isHovered ? 'translate-x-0 opacity-100' : 'translate-x-2 opacity-0') : ''}`}>
                {i18n.explore} <ArrowRight className="ml-1 w-4 h-4" />
              </div>
            </div>

            {highlights && highlights.length > 0 && variant !== 'minimal' && (
              <div className="mt-3 flex flex-wrap gap-2">
                {highlights.slice(0, 5).map((h, i) => (
                  <span key={i} className="text-xs text-gray-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded-md">{h}</span>
                ))}
              </div>
            )}

            {testimonials && testimonials.length > 0 && variant === 'rich' && (
              <div className="mt-3 space-y-2">
                {testimonials.slice(0, 3).map((t, i) => (
                  <blockquote key={i} className="text-xs text-gray-600 italic">
                    “{t.quote}” {t.author ? <span className="not-italic text-gray-500">— {t.author}</span> : null}
                  </blockquote>
                ))}
              </div>
            )}

            {certifications && certifications.length > 0 && variant !== 'minimal' && (
              <div className="mt-3 flex flex-wrap gap-2">
                {certifications.slice(0, 3).map((c, i) => (
                  <span key={i} className="text-xs text-gray-700 bg-green-50 border border-green-100 px-2 py-1 rounded-md">{c}</span>
                ))}
              </div>
            )}
          </div>
        </Card>
      </Link>
    </MotionDiv>
  );
}
