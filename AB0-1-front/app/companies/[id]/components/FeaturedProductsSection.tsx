"use client";

import { ArrowRight, Star } from "lucide-react";
import { Company, FeaturedProduct } from "@/lib/api";
import FeaturedProductCard from "./FeaturedProductCard";

interface FeaturedProductsSectionProps {
  company: Company;
  products: FeaturedProduct[];
  onTabChange?: (tab: string) => void;
}

export default function FeaturedProductsSection({
  company: _company,
  products,
  onTabChange,
}: FeaturedProductsSectionProps) {
  if (!products || products.length === 0) {
    return null;
  }

  // Seleciona até 4 produtos para a grade compacta de 4 colunas
  const displayProducts = products.slice(0, 4);

  return (
    <div className="relative my-3 md:my-4 overflow-hidden rounded-xl bg-slate-200 p-px shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      {/* Efeito sutil de destaque */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[160%] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_300deg,rgba(59,130,246,0.08)_318deg,rgba(37,99,235,0.38)_326deg,rgba(96,165,250,0.12)_334deg,transparent_346deg)] motion-safe:animate-[spin_16s_linear_infinite]"
      />

      {/* Container principal */}
      <section className="relative z-10 overflow-hidden rounded-[11px] bg-white p-2.5 sm:p-3 md:p-4">
        {/* Cabeçalho Limpo e Compacto */}
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <div className="flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
              <Star aria-hidden="true" className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-blue-50 text-blue-600" />
            </div>

            <h3 className="text-xs sm:text-sm font-bold tracking-tight text-slate-950 md:text-base truncate">
              Produtos e serviços
            </h3>

            <span className="hidden sm:inline-flex items-center rounded-md border border-blue-100 bg-blue-50/60 px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-blue-700">
              Destaque
            </span>
          </div>

          {onTabChange && (
            <button
              type="button"
              onClick={() => onTabChange("products")}
              className="inline-flex shrink-0 items-center gap-1 text-[11px] sm:text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1 py-0.5"
            >
              Ver todos
              <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </button>
          )}
        </div>

        {/* Grade de 4 Cards Lado a Lado (PWA Mobile & Desktop) */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 md:gap-3 w-full overflow-hidden">
          {displayProducts.map((product) => (
            <FeaturedProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}