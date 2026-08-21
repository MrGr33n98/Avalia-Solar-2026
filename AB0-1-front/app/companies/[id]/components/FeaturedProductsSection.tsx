"use client";

import { Star } from "lucide-react";
import { Company, FeaturedProduct } from "@/lib/api";
import FeaturedProductCard from "./FeaturedProductCard";

interface FeaturedProductsSectionProps {
  company: Company;
  products: FeaturedProduct[];
}

export default function FeaturedProductsSection({
  company,
  products,
}: FeaturedProductsSectionProps) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section
      className="
        my-4
        overflow-hidden
        rounded-xl
        border
        border-violet-200
        bg-white
        p-3
        shadow-[0_1px_3px_rgba(15,23,42,0.04)]
        md:p-4
      "
    >
      {/* Cabeçalho */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Star
              aria-hidden="true"
              className="
                h-4
                w-4
                shrink-0
                fill-violet-50
                text-violet-600
              "
            />

            <h3 className="text-sm font-bold tracking-tight text-slate-950 md:text-base">
              Produtos em Destaque
            </h3>

            <span
              className="
                inline-flex
                items-center
                rounded-full
                border
                border-violet-100
                bg-violet-50
                px-1.5
                py-0.5
                text-[8px]
                font-bold
                uppercase
                tracking-[0.08em]
                text-violet-700
                md:text-[9px]
              "
            >
              Premium
            </span>
          </div>

          <p className="mt-1 text-[11px] font-medium leading-4 text-slate-500 md:text-xs">
            Conheça os principais produtos e soluções da {company.name}.
          </p>
        </div>
      </div>

      {/* Desktop / Tablet */}
      <div
        className="
          hidden
          gap-2.5
          md:grid
          md:grid-cols-2
          xl:grid-cols-3
          xl:gap-3
        "
      >
        {products.slice(0, 3).map((product) => (
          <FeaturedProductCard
            key={product.id}
            product={product}
          />
        ))}
      </div>

      {/* Mobile / PWA */}
      <div
        className="
          flex
          w-full
          snap-x
          snap-mandatory
          gap-2.5
          overflow-x-auto
          pb-1
          pr-3
          md:hidden
          scrollbar-hide
        "
      >
        {products.slice(0, 3).map((product) => (
          <div
            key={product.id}
            className="
              w-[76%]
              max-w-[255px]
              shrink-0
              snap-start
            "
          >
            <FeaturedProductCard
              product={product}
            />
          </div>
        ))}
      </div>
    </section>
  );
}