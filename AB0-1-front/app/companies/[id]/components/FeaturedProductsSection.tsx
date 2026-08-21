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
    <div
      className="
        relative
        my-4
        overflow-hidden
        rounded-xl
        bg-slate-200
        p-px
        shadow-[0_1px_2px_rgba(15,23,42,0.03)]
      "
    >
      {/*
        Reflexo Enterprise:
        - muito sutil
        - azul frio
        - movimento lento
        - sem efeito neon
      */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -inset-[160%]
          bg-[conic-gradient(from_0deg,transparent_0deg,transparent_300deg,rgba(59,130,246,0.08)_318deg,rgba(37,99,235,0.38)_326deg,rgba(96,165,250,0.12)_334deg,transparent_346deg)]
          motion-safe:animate-[spin_16s_linear_infinite]
        "
      />

      {/* Container principal */}
      <section
        className="
          relative
          z-10
          overflow-hidden
          rounded-[11px]
          bg-white
          p-3
          md:p-4
        "
      >
        {/* Cabeçalho */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {/* Ícone Premium */}
              <div
                className="
                  flex
                  h-6
                  w-6
                  shrink-0
                  items-center
                  justify-center
                  rounded-md
                  border
                  border-slate-200
                  bg-slate-50
                "
              >
                <Star
                  aria-hidden="true"
                  className="
                    h-3.5
                    w-3.5
                    fill-blue-50
                    text-blue-600
                  "
                />
              </div>

              <h3
                className="
                  text-sm
                  font-bold
                  tracking-tight
                  text-slate-950
                  md:text-base
                "
              >
                Produtos & Serviços em Destaque
              </h3>

              {/* Badge mais corporativo */}
              <span
                className="
                  inline-flex
                  items-center
                  rounded-md
                  border
                  border-blue-100
                  bg-blue-50/60
                  px-1.5
                  py-0.5
                  text-[8px]
                  font-bold
                  uppercase
                  tracking-[0.08em]
                  text-blue-700
                  md:text-[9px]
                "
              >
                Premium
              </span>
            </div>

            <p
              className="
                mt-1
                pl-8
                text-[11px]
                font-medium
                leading-4
                text-slate-500
                md:text-xs
              "
            >
              Conheça os principais produtos, serviços e soluções da{" "}
              {company.name}.
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
              <FeaturedProductCard product={product} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}