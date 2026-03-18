'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Building2,
  MessageSquare,
  Share2,
  ShieldCheck,
  Tag,
  Hash,
  ChevronRight,
  FileText,
  Wrench,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { buildCompanyPath } from '@/lib/slug';
import { Product } from '@/lib/api';
import { track } from '@/lib/analytics/lazy';

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [imageError, setImageError] = useState(false);
  const [copied, setCopied] = useState(false);

  const companyPath = product.company?.id
    ? buildCompanyPath(product.company.slug, product.company?.name, product.company.id)
    : '/companies';

  const priceValue =
    typeof product.price === 'number'
      ? product.price
      : parseFloat(String(product.price) || '0');

  const categoryName =
    (product as any).categories?.[0]?.name || product.category?.name || 'Geral';

  const displayImage =
    !imageError && product.image_url
      ? product.image_url
      : '/images/product-placeholder.svg';

  const isAvailable = product.status === 'active';

  const sortedSpecs = [...(product.specs || [])].sort(
    (a: any, b: any) => (b.seo_weight || 0) - (a.seo_weight || 0)
  );

  // Track product view on mount
  useEffect(() => {
    track('product_view', {
      product_id: product.id,
      product_name: product.name,
      category: categoryName,
      company_id: product.company?.id,
      company_name: product.company?.name,
      price: priceValue,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const handleShare = useCallback(async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    track('product_share', {
      product_id: product.id,
      product_name: product.name,
    });
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: product.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // user cancelled share or clipboard not available
    }
  }, [product.id, product.name]);

  const handleBudgetClick = () => {
    track('product_cta_click', {
      product_id: product.id,
      product_name: product.name,
      cta: 'budget',
      company_id: product.company?.id,
    });
  };

  const handleCompanyClick = () => {
    track('product_company_click', {
      product_id: product.id,
      company_id: product.company?.id,
      company_name: product.company?.name,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
            <Link href="/" className="hover:text-foreground transition-colors">
              Início
            </Link>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            <Link href="/products" className="hover:text-foreground transition-colors">
              Produtos
            </Link>
            {categoryName !== 'Geral' && (
              <>
                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{categoryName}</span>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-foreground font-medium line-clamp-1 max-w-[200px] sm:max-w-none">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Main content — extra bottom padding on mobile for sticky CTA */}
      <div className="container mx-auto px-4 py-6 lg:py-10 pb-28 lg:pb-10">
        {/* Back button — mobile only */}
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 lg:hidden"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Produtos
        </Link>

        {/* Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 lg:gap-10">
          {/* Image panel */}
          <div className="order-1">
            <div className="relative bg-white rounded-2xl border border-slate-200 overflow-hidden aspect-[4/3] lg:aspect-[16/10]">
              <Image
                src={displayImage}
                alt={product.name}
                fill
                className="object-contain p-6 lg:p-10"
                onError={() => setImageError(true)}
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority
              />

              {/* Status badge */}
              <div className="absolute top-3 left-3">
                <Badge
                  variant={isAvailable ? 'default' : 'secondary'}
                  className="shadow-sm text-xs"
                >
                  {isAvailable ? 'Disponível' : 'Indisponível'}
                </Badge>
              </div>

              {/* Share button */}
              <button
                onClick={handleShare}
                className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/90 backdrop-blur border border-slate-200 shadow-sm flex items-center justify-center hover:bg-white hover:border-slate-300 transition-all"
                aria-label="Compartilhar produto"
              >
                {copied ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <Share2 className="w-4 h-4 text-slate-600" />
                )}
              </button>
            </div>
          </div>

          {/* Info + Actions panel */}
          <div className="order-2 flex flex-col gap-5">
            {/* Category + Title */}
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                <Tag className="w-3 h-3" />
                <span className="uppercase tracking-wider font-medium">{categoryName}</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 leading-snug">
                {product.name}
              </h1>
              {product.sku && (
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Hash className="w-3 h-3" />
                  <span>SKU: {product.sku}</span>
                </div>
              )}
            </div>

            {/* Price block */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 rounded-xl p-4 border border-blue-100">
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">
                Preço
              </p>
              <div className="text-3xl font-bold text-blue-700">
                R${' '}
                {priceValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-blue-400 mt-1.5">
                * Sujeito a alteração. Solicite um orçamento personalizado.
              </p>
            </div>

            {/* CTA — desktop only (mobile has sticky bar) */}
            <div className="hidden lg:flex flex-col gap-3">
              <Button
                size="lg"
                className="w-full h-12 gap-2 text-base bg-blue-600 hover:bg-blue-700 shadow-md"
                onClick={handleBudgetClick}
              >
                <MessageSquare className="w-5 h-5" />
                Solicitar Orçamento
              </Button>
            </div>

            <Separator className="hidden lg:block" />

            {/* Company card */}
            <div className="border border-slate-200 rounded-xl bg-white p-4 hover:border-blue-200 transition-colors">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">
                Vendedor
              </p>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                  {product.company?.logo_url ? (
                    <Image
                      src={product.company.logo_url}
                      alt={product.company.name || ''}
                      width={48}
                      height={48}
                      className="object-contain rounded-full"
                    />
                  ) : (
                    <Building2 className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <p className="font-semibold text-slate-900 truncate">
                      {product.company?.name || 'Fornecedor'}
                    </p>
                    <ShieldCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground">Fornecedor Verificado</p>
                  {product.company?.description && (
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                      {product.company.description}
                    </p>
                  )}
                </div>
              </div>
              <Link href={companyPath} onClick={handleCompanyClick}>
                <Button variant="outline" size="sm" className="w-full mt-3 gap-2">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Ver Perfil da Empresa
                </Button>
              </Link>
            </div>

            {/* Back link — desktop */}
            <Link
              href="/products"
              className="hidden lg:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para Produtos
            </Link>
          </div>
        </div>

        {/* Tabs: Descrição + Especificações */}
        <div className="mt-8 lg:mt-12">
          <Tabs defaultValue="description">
            <TabsList className="w-full justify-start bg-white border border-slate-200 rounded-xl p-1 h-auto gap-1">
              <TabsTrigger
                value="description"
                className="flex items-center gap-2 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white px-4 py-2.5 text-sm font-medium transition-all"
              >
                <FileText className="w-4 h-4" />
                Descrição
              </TabsTrigger>
              {sortedSpecs.length > 0 && (
                <TabsTrigger
                  value="specs"
                  className="flex items-center gap-2 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white px-4 py-2.5 text-sm font-medium transition-all"
                >
                  <Wrench className="w-4 h-4" />
                  Especificações Técnicas
                  <span className="ml-1 text-xs bg-slate-100 rounded-full px-1.5 py-0.5 tabular-nums">
                    {sortedSpecs.length}
                  </span>
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="description" className="mt-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8">
                {product.short_description && (
                  <p className="text-base font-medium text-slate-700 mb-4 leading-relaxed border-b pb-4">
                    {product.short_description}
                  </p>
                )}
                <p className="text-slate-600 whitespace-pre-wrap leading-relaxed text-sm lg:text-base">
                  {product.description || 'Sem descrição disponível.'}
                </p>
              </div>
            </TabsContent>

            {sortedSpecs.length > 0 && (
              <TabsContent value="specs" className="mt-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {sortedSpecs.map((spec: any) => (
                      <div
                        key={spec.key}
                        className="p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-colors"
                      >
                        <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-1">
                          {spec.label}
                        </p>
                        <p className="text-sm font-bold text-slate-800">
                          {spec.value}
                          {spec.unit ? ` ${spec.unit}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      {/* Sticky Mobile CTA bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 backdrop-blur-sm border-t border-slate-200 px-4 py-3 flex gap-3 safe-area-inset-bottom">
        <Link href={companyPath} onClick={handleCompanyClick} className="flex-1">
          <Button variant="outline" className="w-full h-12 gap-2 border-slate-300">
            <Building2 className="w-4 h-4" />
            Ver Empresa
          </Button>
        </Link>
        <Button
          className="flex-1 h-12 gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg"
          onClick={handleBudgetClick}
        >
          <MessageSquare className="w-4 h-4" />
          Orçamento
        </Button>
      </div>

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.description,
            image: displayImage,
            sku: product.sku,
            brand: {
              '@type': 'Brand',
              name: product.company?.name,
            },
            offers: {
              '@type': 'Offer',
              priceCurrency: 'BRL',
              price: priceValue,
              availability: isAvailable
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
              seller: {
                '@type': 'Organization',
                name: product.company?.name,
              },
            },
            additionalProperty: sortedSpecs.map((spec: any) => ({
              '@type': 'PropertyValue',
              name: spec.label,
              value: spec.value,
              unitCode: spec.unit,
            })),
          }),
        }}
      />
    </div>
  );
}
