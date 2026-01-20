'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCategoriesQuery } from '@/hooks/useCategoriesQuery';
import { Loader2, Filter } from 'lucide-react';
import { BlogPromoBanner } from './BlogPromoBanner';

export function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: categoriesData, isLoading } = useCategoriesQuery();
  const categories = categoriesData?.data || [];
  
  const selectedCategoryIds = React.useMemo(() => {
    const catParam = searchParams.get('category');
    if (!catParam) return [];
    return catParam.split(',').map(id => Number(id));
  }, [searchParams]);

  const handleCategoryChange = (categoryId: number, checked: boolean) => {
    const current = new Set(selectedCategoryIds);
    if (checked) {
      current.add(categoryId);
    } else {
      current.delete(categoryId);
    }

    const params = new URLSearchParams(searchParams.toString());
    if (current.size > 0) {
      params.set('category', Array.from(current).join(','));
    } else {
      params.delete('category');
    }
    
    // Reset page when filtering
    params.delete('page');
    
    router.push(`/blog?${params.toString()}`);
  };

  return (
    <Card className="border-none shadow-sm bg-white">
      <CardHeader className="pb-3 border-b border-slate-100 mb-2">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          Filtrar por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="px-6 pb-2">
          <BlogPromoBanner
            type="informative"
            title="Dica"
            message="Use os filtros para encontrar o que precisa."
            className="mb-2"
          />
        </div>
        <ScrollArea className="h-[300px] px-6 pb-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id={`category-${category.id}`} 
                      checked={selectedCategoryIds.includes(category.id)}
                      onCheckedChange={(checked) => handleCategoryChange(category.id, checked as boolean)}
                    />
                    <Label 
                      htmlFor={`category-${category.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-slate-600"
                    >
                      {category.name}
                    </Label>
                  </div>
                  {/* Mock count or real count if available */}
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-slate-100 text-slate-500 hover:bg-slate-200">
                    {Math.floor(Math.random() * 50) + 1}
                  </Badge>
                </div>
              ))}
              
              {categories.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">
                  Nenhuma categoria encontrada.
                </p>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
