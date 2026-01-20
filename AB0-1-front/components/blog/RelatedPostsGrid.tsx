'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Article } from '@/types/article';
import { getFullImageUrl } from '@/utils/image';

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
          <Link href="/blog">Ver todos <ArrowRight className="ml-2 w-4 h-4" /></Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {articles.slice(0, 3).map((article) => {
          const imageUrl = getFullImageUrl(article.image_url);
          const wordCount = article.content ? article.content.replace(/<[^>]*>/g, '').split(/\s+/).length : 0;
          const readTime = Math.ceil(wordCount / 200);

          return (
            <Link key={article.id} href={`/blog/${article.slug}`} className="group h-full">
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
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm">
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
                    <Clock className="w-3.5 h-3.5" />
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
