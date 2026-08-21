"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
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

  /**
   * IMPORTANTE:
   * Não depender obrigatoriamente de slug.
   * Se houver slug, usa.
   * Caso contrário, usa o ID.
   *
   * Confirme que /products/:id é aceito pela rota atual.
   * Se a rota só aceitar slug, remova o fallback e ajuste conforme
   * o contrato canônico do projeto.
   */
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
    <Card
      className="
        group
        flex
        h-full
        min-w-0
        flex-col
        overflow-hidden
        rounded-lg
        border
        border-slate-200
        bg-white
        shadow-none
        transition-colors
        duration-200
        hover:border-blue-200
      "
    >
      {/* Imagem compacta */}
      <div
        className="
          relative
          h-28
          w-full
          overflow-hidden
          border-b
          border-slate-100
          bg-white
          md:h-32
          lg:h-36
        "
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name || "Produto"}
            fill
            sizes="
              (max-width: 767px) 255px,
              (max-width: 1279px) 50vw,
              33vw
            "
            className="
              object-contain
              p-2.5
              transition-transform
              duration-200
              group-hover:scale-[1.02]
            "
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-50">
            <Package className="h-8 w-8 text-slate-300" />
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex flex-1 flex-col p-2.5 md:p-3">
        <div className="flex-1">
          <h4
            className="
              line-clamp-2
              text-xs
              font-bold
              leading-4
              text-slate-900
              md:text-[13px]
            "
          >
            {product.name}
          </h4>

          {product.short_description && (
            <p
              className="
                mt-1
                line-clamp-2
                text-[10px]
                leading-4
                text-slate-500
                md:text-[11px]
              "
            >
              {product.short_description}
            </p>
          )}

          {/* Preço / status */}
          {priceLabel && (
            <div className="mt-1.5">
              <span className="text-[10px] font-semibold text-blue-700">
                {priceLabel}
              </span>
            </div>
          )}
        </div>

        {/* CTA compacto */}
        <Link
          href={productHref}
          className="
            mt-2
            inline-flex
            w-fit
            items-center
            gap-1
            text-[11px]
            font-semibold
            text-blue-600
            transition-colors
            hover:text-blue-700
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-blue-500
            focus-visible:ring-offset-2
          "
        >
          Ver detalhes
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </Card>
  );
}