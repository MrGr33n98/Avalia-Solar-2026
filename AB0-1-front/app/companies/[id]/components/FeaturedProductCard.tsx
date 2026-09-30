"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { FeaturedProduct } from "@/lib/api";
import { getFullImageUrl } from "@/utils/image";

interface FeaturedProductCardProps {
  product: FeaturedProduct;
}

export default function FeaturedProductCard({
  product,
}: FeaturedProductCardProps) {
  const imageUrl = product.image_url
    ? getFullImageUrl(product.image_url)
    : null;

  const productHref = product.slug
    ? `/products/${product.slug}`
    : `/products/${product.id}`;

  const priceLabel =
    product.price_mode === "on_request"
      ? "Sob consulta"
      : product.price_mode === "starting_at"
        ? "A partir de"
        : null;

  return (
    <Link
      href={productHref}
      className="group block h-full w-full min-w-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <Card
        className="
          flex
          h-full
          w-full
          min-w-0
          flex-col
          overflow-hidden
          rounded-lg
          border
          border-slate-200
          bg-white
          shadow-none
          transition-all
          duration-150
          group-hover:border-blue-300
          group-hover:shadow-sm
          active:scale-[0.98]
        "
      >
        {/* Container da Imagem Compacta */}
        <div
          className="
            relative
            h-14
            xs:h-16
            sm:h-20
            md:h-28
            w-full
            shrink-0
            overflow-hidden
            border-b
            border-slate-100
            bg-slate-50/50
          "
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name || "Produto"}
              fill
              sizes="(max-width: 767px) 25vw, 25vw"
              className="
                object-contain
                p-1
                sm:p-1.5
                md:p-2.5
                transition-transform
                duration-200
                group-hover:scale-105
              "
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-50">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-slate-300" />
            </div>
          )}
        </div>

        {/* Conteúdo Textual Compacto */}
        <div className="flex flex-1 flex-col justify-between p-1.5 sm:p-2 md:p-2.5 min-w-0">
          <div className="min-w-0">
            <h4
              className="
                line-clamp-2
                text-[10px]
                leading-[1.25]
                font-semibold
                text-slate-900
                sm:text-[11px]
                md:text-xs
                group-hover:text-blue-600
                transition-colors
                break-words
              "
              title={product.name}
            >
              {product.name}
            </h4>

            {/* Descrição Visível Apenas em Telas Maiores */}
            {product.short_description && (
              <p
                className="
                  mt-1
                  hidden
                  line-clamp-2
                  text-[10px]
                  leading-4
                  text-slate-500
                  md:block
                "
              >
                {product.short_description}
              </p>
            )}

            {/* Preço / Status em Telas Maiores ou quando disponível */}
            {priceLabel && (
              <div className="mt-1 hidden sm:block">
                <span className="text-[9px] font-medium text-blue-700 truncate block">
                  {priceLabel}
                </span>
              </div>
            )}
          </div>

          {/* Chevron Indicador no Rodapé do Card */}
          <div className="mt-1 flex items-center justify-end">
            <ChevronRight className="h-3 w-3 shrink-0 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </Card>
    </Link>
  );
}