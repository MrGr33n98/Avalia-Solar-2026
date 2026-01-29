'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowRight, Sun } from 'lucide-react';
import { Article } from '@/types/article';
import { getFullImageUrl } from '@/utils/image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { track } from '@/lib/analytics';

interface PostCardProps {
  post: Article;
}

export function PostCard({ post }: PostCardProps) {
  // Word count estimate (if not provided by API)
  const wordCount = post.content ? post.content.replace(/<[^>]*>/g, '').split(/\s+/).length : 0;
  const readTime = Math.ceil(wordCount / 200) || 5;

  return (
    <Link 
      href={`/blog/${post.slug}`} 
      className="group block h-full"
      onClick={() => {
        track('blog_list_item_click', {
          post_id: post.id,
          post_title: post.title,
          post_slug: post.slug,
          category_name: post.category?.name,
          element_type: 'card',
          action_type: 'click'
        });
      }}
    >
      <Card className="h-full flex flex-col border-none shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden bg-white ring-1 ring-slate-100 group-hover:ring-primary/20">
        <div className="relative h-52 w-full overflow-hidden bg-slate-100">
          {post.cover_image_url || post.image_url ? (
            <Image
              src={getFullImageUrl(post.cover_image_url || post.image_url)}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-200 flex flex-col items-center justify-center text-slate-300">
              <Sun className="w-12 h-12 mb-2 opacity-20" />
              <span className="text-sm font-bold uppercase tracking-widest opacity-30">Avalia Solar</span>
            </div>
          )}
          
          <div className="absolute top-4 left-4">
             {post.category && (
              <Badge className="bg-white/95 text-slate-900 hover:bg-white backdrop-blur shadow-sm text-xs font-bold border-none">
                {post.category.name}
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="flex-1 p-5 flex flex-col">
          <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {post.published_at ? format(new Date(post.published_at), "d MMM, yyyy", { locale: ptBR }) : 'Recente'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {readTime} min leitura
            </span>
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {post.title}
          </h3>

          <p className="text-slate-600 text-sm line-clamp-3 mb-4 leading-relaxed">
            {post.excerpt || 'Confira este artigo completo sobre energia solar e economize na sua conta de luz.'}
          </p>
        </CardContent>

        <CardFooter className="p-5 pt-0 mt-auto">
          <span className="text-sm font-bold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
            Ler artigo <ArrowRight className="w-4 h-4" />
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
