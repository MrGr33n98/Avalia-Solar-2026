import ProductCard from '@/components/ProductCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { PackageOpen } from 'lucide-react';
import { Product } from '@/lib/api';

interface CompanyProductsProps {
  products: Product[];
  loading: boolean;
}

export default function CompanyProducts({ products, loading }: CompanyProductsProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-muted/20 rounded-2xl border border-dashed border-border/60 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-muted p-6 rounded-full mb-6">
          <PackageOpen className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Nenhum produto cadastrado</h3>
        <p className="text-muted-foreground max-w-sm">
          Esta empresa ainda não cadastrou seus produtos em nosso catálogo.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
