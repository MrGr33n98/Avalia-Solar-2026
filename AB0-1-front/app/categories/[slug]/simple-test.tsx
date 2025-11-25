'use client';

import { useState, useEffect } from 'react';
import { fetchCategoryBySlug, Category } from '@/lib/api';

export default function SimpleTest({ params }: { params: { slug: string } }) {
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategory = async () => {
      try {
        console.log('Loading category with slug:', params.slug);
        const categoryData = await fetchCategoryBySlug(params.slug);
        console.log('Category loaded:', categoryData);
        setCategory(categoryData);
      } catch (err: any) {
        console.error('Error loading category:', err);
        setError(err.message || 'Erro ao carregar categoria');
      } finally {
        setLoading(false);
      }
    };

    loadCategory();
  }, [params.slug]);

  if (loading) {
    return <div className="p-8">Carregando categoria...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Erro: {error}</div>;
  }

  if (!category) {
    return <div className="p-8">Categoria não encontrada</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">{category.name}</h1>
      <p className="text-gray-600 mb-4">{category.description || category.short_description}</p>
      {category.banner_url && (
        <div className="mb-4">
          <p className="text-sm text-green-600">✅ Banner URL disponível</p>
          <img 
            src={category.banner_url} 
            alt={`Banner ${category.name}`}
            className="w-full max-w-md h-32 object-cover rounded"
            onError={(e) => console.error('Error loading banner:', e)}
          />
        </div>
      )}
      <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
        {JSON.stringify(category, null, 2)}
      </pre>
    </div>
  );
}