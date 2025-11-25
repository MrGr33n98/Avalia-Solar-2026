'use client';

import { useParams } from 'next/navigation';
import { useProduct } from '@/hooks/useProduct';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const { product, loading, error } = useProduct(slug);

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-6 w-1/4" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>{error || 'Product not found'}</p>
        <Link href="/products">
          <Button className="mt-4" variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Link href="/products">
        <Button className="mb-6" variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
        </Button>
      </Link>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <div className="flex items-center gap-2 mb-4">
            <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
              {product.status === 'active' ? 'Available' : 'Unavailable'}
            </Badge>
            <span className="text-muted-foreground">
              Category: {product.category?.name}
            </span>
          </div>
          
          <div className="text-2xl font-bold mb-6">
            ${typeof product.price === 'number' 
              ? product.price.toFixed(2) 
              : parseFloat(String(product.price)).toFixed(2)}
          </div>
          
          <div className="prose max-w-none">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>
        </div>
        
        <div>
          <div className="border rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold mb-2">Seller Information</h3>
            <p className="font-medium">{product.company?.name}</p>
            {product.company?.description && (
              <p className="text-sm text-muted-foreground mt-2">{product.company.description}</p>
            )}
            <Link href={`/companies/${product.company?.id}`}>
              <Button className="mt-4" variant="outline" size="sm">
                View Seller Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}