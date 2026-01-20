import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import BlogCard from '@/components/BlogCard';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { buildApiUrl, getApiRequestHeaders } from '@/lib/api-config';
import { getFullImageUrl } from '@/utils/image';

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

  // Get featured article (first one) and remaining articles
  const featuredArticle = !searchParams.page && articles.length > 0 ? articles[0] : null;
  const gridArticles = !searchParams.page && articles.length > 0 ? articles.slice(1) : articles;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Hero Section with Background Image Overlay */}
      <div className="relative bg-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/images/solar-panels-hero.jpg" // Placeholder or dynamic hero image
            alt="Solar Panels Background"
            fill
            className="object-cover opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold sm:text-5xl sm:tracking-tight lg:text-6xl mb-6">
            Blog Avalia Solar
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-200">
            Tudo o que você precisa saber sobre energia solar, economia e sustentabilidade.
          </p>
          
          <div className="mt-10 max-w-lg mx-auto">
             <div className="relative group">
               <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                 <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
               </div>
               <Input 
                 type="text" 
                 placeholder="Buscar artigos..." 
                 className="pl-11 h-12 bg-white/95 border-0 text-gray-900 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-primary shadow-xl rounded-full" 
               />
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {/* Categories Filter */}
        <div className="flex overflow-x-auto pb-4 gap-2 mb-12 no-scrollbar justify-start md:justify-center">
          <Button 
            variant={!searchParams.category ? "default" : "secondary"} 
            className={`rounded-full px-6 ${!searchParams.category ? 'bg-primary hover:bg-primary/90' : 'bg-white hover:bg-gray-100 text-gray-700 shadow-sm'}`}
            asChild
          >
            <Link href="/blog">
              <span>Todos</span>
            </Link>
          </Button>
          {categories.map((cat: any) => (
            <Button 
              key={cat.id} 
              variant={searchParams.category === String(cat.id) ? "default" : "secondary"} 
              className={`rounded-full px-6 ${searchParams.category === String(cat.id) ? 'bg-primary hover:bg-primary/90' : 'bg-white hover:bg-gray-100 text-gray-700 shadow-sm'}`}
              asChild
            >
              <Link href={`/blog?category=${cat.id}`}>
                <span>{cat.name}</span>
              </Link>
            </Button>
          ))}
        </div>

        {/* Featured Post (Hero Card Style) */}
        {featuredArticle && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="bg-primary w-2 h-8 mr-3 rounded-full"></span>
              Destaque
            </h2>
            <Link href={`/blog/${featuredArticle.slug}`} className="group block">
              <div className="relative rounded-2xl overflow-hidden shadow-lg aspect-[21/9] bg-gray-200">
                {featuredArticle.image_url ? (
                  <Image
                    src={getFullImageUrl(featuredArticle.image_url) || ''}
                    alt={featuredArticle.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-100">
                    <span className="text-lg">Sem imagem de destaque</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full md:w-2/3 text-white">
                  {featuredArticle.category && (
                    <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider uppercase bg-primary text-white rounded-full">
                      {featuredArticle.category.name}
                    </span>
                  )}
                  <h3 className="text-2xl md:text-4xl font-bold leading-tight mb-4 group-hover:text-primary-foreground transition-colors">
                    {featuredArticle.title}
                  </h3>
                  <p className="text-gray-200 text-sm md:text-base line-clamp-2 md:line-clamp-3 mb-6 max-w-xl">
                    {featuredArticle.excerpt}
                  </p>
                  <div className="flex items-center text-sm text-gray-300 space-x-4">
                    <span>{featuredArticle.published_at ? new Date(featuredArticle.published_at).toLocaleDateString('pt-BR') : ''}</span>
                    <span>•</span>
                    <span>{featuredArticle.author_name || 'Equipe Avalia Solar'}</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Articles Grid */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <span className="bg-primary w-2 h-8 mr-3 rounded-full"></span>
            {searchParams.category ? 'Artigos da Categoria' : 'Últimos Artigos'}
          </h2>
        </div>
        
        {gridArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {gridArticles.map((article: any) => (
              <BlogCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm">
            <p className="text-gray-500 text-lg">Nenhum artigo encontrado.</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/blog">Limpar filtros</Link>
            </Button>
          </div>
        )}

        {/* Pagination (Simple Implementation) */}
        {meta?.pagination && meta.pagination.total_pages > 1 && (
          <div className="mt-16 flex justify-center space-x-2">
            <Button variant="outline" disabled={meta.pagination.current_page === 1} className="w-32">
              Anterior
            </Button>
            <div className="flex items-center px-4 text-sm text-gray-600 font-medium">
              Página {meta.pagination.current_page} de {meta.pagination.total_pages}
            </div>
            <Button variant="outline" disabled={meta.pagination.current_page === meta.pagination.total_pages} className="w-32">
              Próxima
            </Button>
          </div>
        )}

        {/* Newsletter Section */}
        <div className="mt-24 mb-12 bg-primary/5 rounded-3xl p-8 md:p-12 border border-primary/10 text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">Fique por dentro das novidades</h3>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Receba nossos melhores artigos, guias e dicas exclusivas sobre energia solar diretamente no seu e-mail.
          </p>
          <form className="max-w-md mx-auto flex gap-2">
            <Input 
              type="email" 
              placeholder="Seu melhor e-mail" 
              className="bg-white h-12"
            />
            <Button size="lg" className="px-8">Inscrever-se</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
