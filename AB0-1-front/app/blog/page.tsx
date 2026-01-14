import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import BlogCard from '@/components/BlogCard';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { buildApiUrl, getApiRequestHeaders } from '@/lib/api-config';

export const metadata: Metadata = {
  title: 'Blog Avalia Solar - Notícias e Guia sobre Energia Solar',
  description: 'Fique por dentro das últimas novidades, dicas e guias sobre energia solar, painéis fotovoltaicos e sustentabilidade.',
};

async function getArticles(searchParams: any) {
  try {
    const params = new URLSearchParams();
    if (searchParams?.category) params.append('category_id', searchParams.category);
    if (searchParams?.page) params.append('page', searchParams.page);
    
    const res = await fetch(buildApiUrl(`articles?${params.toString()}`), {
      headers: getApiRequestHeaders(),
      next: { revalidate: 300 } // Revalidate every 5 minutes
    });
    
    if (!res.ok) return { data: [], meta: {} };
    return res.json();
  } catch (error) {
    return { data: [], meta: {} };
  }
}

async function getCategories() {
  try {
    const res = await fetch(buildApiUrl('categories'), {
      headers: getApiRequestHeaders(),
      next: { revalidate: 3600 }
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function BlogIndexPage({ searchParams }: { searchParams: any }) {
  const { data: articles, meta } = await getArticles(searchParams);
  const categories = await getCategories();

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Hero Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Blog Avalia Solar
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Tudo o que você precisa saber sobre energia solar, economia e sustentabilidade.
          </p>
          
          <div className="mt-8 max-w-md mx-auto">
             <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <Search className="h-5 w-5 text-gray-400" />
               </div>
               <Input 
                 type="text" 
                 placeholder="Buscar artigos..." 
                 className="pl-10" 
               />
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Categories Filter */}
        <div className="flex overflow-x-auto pb-4 gap-2 mb-8 no-scrollbar">
          <Button variant={!searchParams.category ? "default" : "outline"} asChild>
            <Link href="/blog">
              <span>Todos</span>
            </Link>
          </Button>
          {categories.map((cat: any) => (
            <Button 
              key={cat.id} 
              variant={searchParams.category === String(cat.id) ? "default" : "outline"} 
              asChild
            >
              <Link href={`/blog?category=${cat.id}`}>
                <span>{cat.name}</span>
              </Link>
            </Button>
          ))}
        </div>

        {/* Featured Post (First one if on page 1) */}
        {!searchParams.page && articles.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Destaque</h2>
            {/* We could use a special FeaturedBlogCard here, reusing BlogCard for now but larger */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
               {/* Placeholder for featured image/content layout */}
               <BlogCard article={articles[0]} />
            </div>
          </div>
        )}

        {/* Articles Grid */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {searchParams.category ? 'Artigos da Categoria' : 'Últimos Artigos'}
        </h2>
        
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article: any) => (
              <BlogCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Nenhum artigo encontrado.
          </div>
        )}

        {/* Pagination (Simple Implementation) */}
        {meta?.pagination && meta.pagination.total_pages > 1 && (
          <div className="mt-12 flex justify-center space-x-2">
            {/* Add pagination logic here */}
            <Button variant="outline" disabled={meta.pagination.current_page === 1}>Anterior</Button>
            <Button variant="outline" disabled={meta.pagination.current_page === meta.pagination.total_pages}>Próxima</Button>
          </div>
        )}
      </div>
    </div>
  );
}
