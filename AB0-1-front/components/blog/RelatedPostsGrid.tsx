'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Article } from '@/types/article';
import { getFullImageUrl } from '@/utils/image';
import { track } from '@/lib/analytics/lazy';
import { buildArticleLink } from '@/lib/blog/article-links';

interface RelatedPostsGridProps {
  articles: Article[];
}

export function RelatedPostsGrid({ articles }: RelatedPostsGridProps) {
  if (!articles || articles.length === 0) return null;

  return (
    <div className="mt-16 pt-12 border-t border-slate-200">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-bold text-slate-900">Continue Lendo</h3>
        <Button variant="link" className="text-primary" asChild>
          <Link href="/blog">Ver todos <ArrowRight className="ml-2 w-4 h-4" aria-hidden="true" /></Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {articles.slice(0, 3).map((article, index) => {
          const imageUrl = getFullImageUrl(article.image_url);
          const wordCount = article.content ? article.content.replace(/<[^>]*>/g, '').split(/\s+/).length : 0;
          const readTime = article.reading_time_minutes || Math.ceil(wordCount / 200);
          const slugOrId = article.slug || String(article.id);
          const link = buildArticleLink({
            slugOrId,
            placement: 'related',
            category: article.category?.name,
            term: article.slug || String(article.id),
            content: `related_${index + 1}`
          });

          return (
            <Link
              key={article.id}
              href={link.url}
              className="group h-full"
              onClick={() =>
                track('blog_article_click', {
                  post_id: article.id,
                  post_title: article.title,
                  post_slug: slugOrId,
                  category_name: article.category?.name,
                  element_type: 'related',
                  action_type: 'click',
                  placement: 'related',
                  position: index + 1,
                  link_url: link.url,
                  ...link.utm,
                })
              }
            >
              <Card className="h-full border-none shadow-none hover:shadow-lg transition-all duration-300 bg-transparent hover:bg-white overflow-hidden">
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-600 text-sm">
                      Sem imagem
                    </div>
                  )}
                  {article.category && (
                    <Badge className="absolute top-3 left-3 bg-white/95 text-slate-900 hover:bg-white shadow-sm">
                      {article.category.name}
                    </Badge>
                  )}
                </div>
                
                <CardContent className="p-4 pt-5 px-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{readTime} min leitura</span>
                  </div>
                  <h4 className="font-bold text-lg text-slate-900 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </h4>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
