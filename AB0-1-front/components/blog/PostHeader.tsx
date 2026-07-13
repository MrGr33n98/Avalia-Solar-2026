'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, Share2, Bookmark, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Article } from '@/types/article';
import { getFullImageUrl } from '@/utils/image';
import { track } from '@/lib/analytics/lazy';
import ShareButtons from './ShareButtons';

interface PostHeaderProps {
  article: Article;
}

export function PostHeader({ article }: PostHeaderProps) {
  const publishedDate = article.published_date
    ? article.published_date
    : article.published_at
      ? format(new Date(article.published_at), "d 'de' MMMM, yyyy", { locale: ptBR })
      : 'Data indisponível';

  const authorName = article.author_name || article.author?.name || 'Avalia Solar';
  const slugOrId = article.slug || String(article.id);
  const authorAvatarUrl = article.author_avatar_url 
    ? getFullImageUrl(article.author_avatar_url) 
    : (article.author as any)?.avatar_photo_url ? getFullImageUrl((article.author as any).avatar_photo_url) : null;
  
  // Calculate read time based on word count (avg 200 wpm)
  const wordCount = article.content ? article.content.replace(/<[^>]*>/g, '').split(/\s+/).length : 0;
  const readTime = article.reading_time_minutes || Math.ceil(wordCount / 200);

  React.useEffect(() => {
    track('blog_post_view', {
      post_id: article.id,
      post_title: article.title,
      post_slug: article.slug,
      category_name: article.category?.name,
      category_id: article.category?.id,
      author_name: authorName,
      word_count: wordCount,
      read_time_minutes: readTime
    });
  }, [article.id, article.title, article.slug, article.category?.name, article.category?.id, authorName, wordCount, readTime]);

  return (
    <div className="space-y-6 mb-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/blog">Blog</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {article.category && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink href={`/blog?category=${article.category.id}`}>{article.category.name}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}
          <BreadcrumbItem>
            <BreadcrumbPage className="line-clamp-1 max-w-[200px] sm:max-w-[300px]">{article.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-4">
        {article.category && (
          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 text-sm py-1 px-3">
            {article.category.name}
          </Badge>
        )}
        
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
          {article.title}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm shrink-0">
                <AvatarImage src={authorAvatarUrl || ''} alt={authorName} className="object-cover object-top scale-110" />
                <AvatarFallback className="bg-slate-100 text-slate-500">
                  <User className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="font-semibold text-slate-900 leading-tight">{authorName}</p>
                <div className="flex items-center text-slate-500 gap-2 mt-0.5">
                  <span suppressHydrationWarning>{publishedDate}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {readTime} min leitura
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
             <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-slate-500 hover:text-primary h-9 w-9">
                    <Bookmark className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Salvar para ler depois</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <ShareButtons title={article.title} slug={slugOrId} />
          </div>
        </div>
      </div>
    </div>
  );
}
