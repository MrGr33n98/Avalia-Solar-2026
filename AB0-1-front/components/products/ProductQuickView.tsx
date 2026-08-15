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
import { Check, Building2, Info } from 'lucide-react';
import Image from 'next/image';
import type { Product } from '@/lib/api';
import { QuoteCTA } from '@/components/quote/QuoteCTA';
import { track } from '@/lib/analytics/lazy';

interface ProductQuickViewProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductQuickView({ product, open, onOpenChange }: ProductQuickViewProps) {
  const priceValue = typeof product.price === 'number' ? product.price : parseFloat(product.price || '0');
  const priceAvailable = Number.isFinite(priceValue) && priceValue > 0;
  const companyName = product.company?.name || 'Fornecedor não informado';
  const displayImage = product.image_url || '';
  const companyLocation = [product.company?.city, product.company?.state].filter(Boolean).join(', ');

  const handleQuoteRequest = () => {
    track('product_cta_click', {
      product_id: product.id,
      product_name: product.name,
      company_id: product.company?.id,
      company_name: product.company?.name,
      click_type: 'quick_view_budget',
      price_available: priceAvailable,
    });
    openQuoteWizard({
      preferredCompanyId: product.company?.id,
      source: 'product_quick_view',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] overflow-hidden p-0 gap-0">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image Side */}
          <div className="relative h-[300px] md:h-full bg-slate-50 p-6 flex items-center justify-center">
            <div className="relative w-full h-full">
                {displayImage ? (
                  <Image
                    src={displayImage}
                    alt={product.name}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white text-sm font-semibold text-slate-400">
                    Imagem indisponível
                  </div>
                )}
            </div>
          </div>

          {/* Content Side */}
          <div className="p-6 flex flex-col h-full max-h-[90vh] overflow-y-auto">
            <DialogHeader className="mb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <Badge variant="outline" className="mb-2 w-fit">
                        {product.categories?.[0]?.name || product.category?.name || 'Geral'}
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
                        {priceAvailable ? `R$ ${priceValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Consultar preço'}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        {product.stock !== undefined && product.stock !== null && product.stock > 0 && (
                          <>
                            <span className="flex items-center gap-1 text-green-600">
                                <Check className="w-4 h-4" /> Em estoque
                            </span>
                            <span>•</span>
                          </>
                        )}
                        <span className="text-slate-500">SKU: {product.sku || 'N/A'}</span>
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
                            {companyLocation && <p className="text-xs text-slate-500">{companyLocation}</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-8 grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Continuar navegando
                </Button>
                <QuoteCTA context="card" source="product-quick-view" onRequest={handleQuoteRequest} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
