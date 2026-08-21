"use client";

import { Company, FeaturedProduct } from "@/lib/api";
import FeaturedProductCard from "./FeaturedProductCard";

interface FeaturedProductsSectionProps {
  company: Company;
  products: FeaturedProduct[];
}

export default function FeaturedProductsSection({ company, products }: FeaturedProductsSectionProps) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 mt-6">
      {/* Cabeçalho da Seção */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Produtos em Destaque
          </h3>
          <p className="text-sm text-slate-500 font-medium">
           Conheça os principais produtos e soluções da {company.name}.
          </p>
        </div>
      </div>

      {/* Grid de Produtos - Desktop/Tablet */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <FeaturedProductCard 
            key={product.id} 
            product={product} 
          />
        ))}
      </div>

      {/* Carrossel Horizontal - Mobile */}
      <div className="flex w-full snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:hidden scrollbar-hide">
        {products.map((product) => (
          <div 
            key={product.id} 
            className="w-[85%] snap-center shrink-0 first:pl-1 last:pr-1"
          >
            <FeaturedProductCard 
              product={product} 
            />
          </div>
        ))}
      </div>
    </div>
  );
}