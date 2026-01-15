import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, Building2, ShieldCheck, ShoppingCart, Info } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/api';

interface ProductQuickViewProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductQuickView({ product, open, onOpenChange }: ProductQuickViewProps) {
  const priceValue = typeof product.price === 'number' ? product.price : parseFloat(product.price || '0');
  const companyName = product.company?.name || 'Fornecedor não informado';
  const displayImage = product.image_url || '/images/product-placeholder.svg';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] overflow-hidden p-0 gap-0">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image Side */}
          <div className="relative h-[300px] md:h-full bg-slate-50 p-6 flex items-center justify-center">
            <div className="relative w-full h-full">
                <Image
                src={displayImage}
                alt={product.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 400px"
                />
            </div>
          </div>

          {/* Content Side */}
          <div className="p-6 flex flex-col h-full max-h-[90vh] overflow-y-auto">
            <DialogHeader className="mb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <Badge variant="outline" className="mb-2 w-fit">
                        {(product as any).categories?.[0]?.name || product.category?.name || 'Geral'}
                    </Badge>
                    <DialogTitle className="text-xl font-bold leading-tight">
                        {product.name}
                    </DialogTitle>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 space-y-6">
                {/* Price & Status */}
                <div>
                    <div className="text-3xl font-bold text-primary">
                        R$ {priceValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1 text-green-600">
                            <Check className="w-4 h-4" /> Em estoque
                        </span>
                        <span>•</span>
                        <span className="text-slate-500">SKU: {(product as any).sku || 'N/A'}</span>
                    </div>
                </div>

                <Separator />

                {/* Description */}
                <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4" /> Sobre o produto
                    </h4>
                    <DialogDescription className="text-base text-slate-600 leading-relaxed">
                        {product.short_description || product.description || 'Sem descrição detalhada disponível.'}
                    </DialogDescription>
                </div>

                {/* Company Info */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-white border flex items-center justify-center shadow-sm">
                            <Building2 className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-900">{companyName}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-blue-500" /> Fornecedor Verificado
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-8 grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Continuar navegando
                </Button>
                <Button className="w-full gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Solicitar Orçamento
                </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
