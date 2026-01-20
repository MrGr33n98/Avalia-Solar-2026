import React from 'react';
import { Article } from '@/types/article';
import BlogCard from '@/components/BlogCard';

interface RelatedPostsProps {
  articles: Article[];
}

export default function RelatedPosts({ articles }: RelatedPostsProps) {
  if (!articles || articles.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-gray-100">
      <h3 className="text-2xl font-bold text-slate-900 mb-6">Artigos Relacionados</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <BlogCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
