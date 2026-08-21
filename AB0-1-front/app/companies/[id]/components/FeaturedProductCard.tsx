"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FeaturedProduct } from "@/lib/api";
import { getFullImageUrl } from "@/utils/image";

interface FeaturedProductCardProps {
  product: FeaturedProduct;
}

export default function FeaturedProductCard({ product }: FeaturedProductCardProps) {
  const imageUrl = product.image_url ? getFullImageUrl(product.image_url) : null;

  return (
    <Card className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md hover:border-blue-100 h-full">
      {/* Imagem do Produto */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-50">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name || "Produto"}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-12 w-12 text-slate-300" />
          </div>
        )}
      </div>

      {/* Conteúdo do Card */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex-1">
          <h4 className="mb-1 line-clamp-2 text-sm font-bold text-slate-900">
            {product.name}
          </h4>
          {product.short_description && (
            <p className="line-clamp-2 text-xs text-slate-500">
              {product.short_description}
            </p>
          )}
        </div>

        {/* Preço / Modo de Preço */}
        {product.price_mode && product.price_mode !== 'hidden' && (
          <div className="mt-3 mb-2">
            <span className="text-xs font-bold text-blue-700">
              {product.price_mode === 'on_request' ? 'Sob consulta' : 
               product.price_mode === 'starting_at' ? 'A partir de' : ''}
            </span>
          </div>
        )}

        {/* CTA */}
        <Button 
          asChild 
          variant="outline" 
          size="sm" 
          className="mt-auto w-full rounded-xl border-slate-200 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
        >
          <Link href={`/products/${product.slug}`}>
            Ver detalhes
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}