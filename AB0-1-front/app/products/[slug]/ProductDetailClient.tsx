'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { buildCompanyPath } from '@/lib/slug';
import { Product } from '@/lib/api';

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const companyPath = product.company?.id
    ? buildCompanyPath(product.company.slug, product.company?.name, product.company.id)
    : '/companies';

  return (
    <div className="container mx-auto p-4">
      <Link href="/products">
        <Button className="mb-6" variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Produtos
        </Button>
      </Link>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <div className="flex items-center gap-2 mb-4">
            <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
              {product.status === 'active' ? 'Disponível' : 'Indisponível'}
            </Badge>
            <span className="text-muted-foreground">
              Categoria: {product.category?.name}
            </span>
          </div>
          
          <div className="text-2xl font-bold mb-6">
            R$ {typeof product.price === 'number' 
              ? product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) 
              : parseFloat(String(product.price)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          
          <div className="prose max-w-none">
            <h3 className="text-lg font-semibold">Descrição</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{product.description}</p>
          </div>
        </div>
        
        <div>
          <div className="border rounded-lg p-6 bg-card">
            <h3 className="text-lg font-semibold mb-4">Informações do Vendedor</h3>
            <p className="font-medium text-xl mb-2">{product.company?.name}</p>
            {product.company?.description && (
              <p className="text-sm text-muted-foreground mt-2 mb-4 line-clamp-3">
                {product.company.description}
              </p>
            )}
            <Link href={companyPath}>
              <Button className="w-full mt-2" variant="outline">
                Ver Perfil da Empresa
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
