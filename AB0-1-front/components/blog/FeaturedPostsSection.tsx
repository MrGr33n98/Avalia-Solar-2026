'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Calendar, ArrowRight } from 'lucide-react';
import { Article } from '@/types/article';
import { getFullImageUrl } from '@/utils/image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { track } from '@/lib/analytics/lazy';
import { buildArticleLink } from '@/lib/blog/article-links';

interface FeaturedPostsSectionProps {
  posts: Article[];
}

export function FeaturedPostsSection({ posts }: FeaturedPostsSectionProps) {
  if (!posts || posts.length === 0) return null;

  const mainPost = posts[0];
  const sidePosts = posts.slice(1, 3);
  const mainSlugOrId = mainPost.slug || String(mainPost.id);
  const mainLink = buildArticleLink({
    slugOrId: mainSlugOrId,
    placement: 'featured_main',
    category: mainPost.category?.name,
    term: mainPost.slug || String(mainPost.id)
  });
  const mainImage = getFullImageUrl(mainPost.cover_image_url || mainPost.image_url);
  const mainAuthorName = mainPost.author_name || mainPost.author?.name;
  const mainAuthorAvatar = mainPost.author?.avatar_url || mainPost.author_avatar_url;
  const mainReadingTime = mainPost.reading_time_minutes
    ? mainPost.reading_time_minutes
    : Math.ceil((mainPost.content || '').replace(/<[^>]*>/g, '').split(/\s+/).length / 200);

  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <span className="w-1 h-6 bg-primary rounded-full" />
          Destaques da Semana
        </h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Featured Post */}
        <div className="lg:col-span-8 group relative">
          <Link
            href={mainLink.url}
            className="block h-full"
            onClick={() =>
              track('blog_article_click', {
                post_id: mainPost.id,
                post_title: mainPost.title,
                post_slug: mainSlugOrId,
                category_name: mainPost.category?.name,
                element_type: 'featured_main',
                action_type: 'click',
                placement: 'featured_main',
                position: 1,
                link_url: mainLink.url,
                ...mainLink.utm,
              })
            }
          >
            <Card className="h-full overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300">
              <div className="relative h-64 sm:h-80 lg:h-[400px] w-full">
                <Image
                  src={mainImage}
                  alt={mainPost.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                
                <div className="absolute bottom-0 left-0 p-6 sm:p-8 w-full">
                  {mainPost.category && (
                    <Badge className="mb-3 bg-primary hover:bg-primary/90 text-white border-none">
                      {mainPost.category.name}
                    </Badge>
                  )}
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-3 leading-tight group-hover:text-primary-foreground/90 transition-colors">
                    {mainPost.title}
                  </h3>
                  <p className="text-slate-200 line-clamp-2 mb-4 max-w-2xl text-sm sm:text-base">
                    {mainPost.excerpt}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-300 font-medium">
                    {mainAuthorName && (
                      <div className="flex items-center gap-2">
                        {mainAuthorAvatar && (
                          <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/20">
                            <Image 
                              src={getFullImageUrl(mainAuthorAvatar)} 
                              alt={mainAuthorName} 
                              fill 
                              className="object-cover" 
                            />
                          </div>
                        )}
                        <span>{mainAuthorName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(mainPost.published_at || mainPost.created_at || new Date()), "d MMM, yyyy", { locale: ptBR })}
                    </div>
                    {mainReadingTime ? (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {mainReadingTime} min
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Side Posts */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {sidePosts.map((post, index) => {
            const slugOrId = post.slug || String(post.id);
            const link = buildArticleLink({
              slugOrId,
              placement: 'featured_side',
              category: post.category?.name,
              term: post.slug || String(post.id),
              content: `featured_side_${index + 1}`
            });
            return (
            <Link
              key={post.id}
              href={link.url}
              className="block flex-1 group"
              onClick={() =>
                track('blog_article_click', {
                  post_id: post.id,
                  post_title: post.title,
                  post_slug: slugOrId,
                  category_name: post.category?.name,
                  element_type: 'featured_side',
                  action_type: 'click',
                  placement: 'featured_side',
                  position: index + 1,
                  link_url: link.url,
                  ...link.utm,
                })
              }
            >
              <Card className="h-full border-none shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden bg-white">
                <div className="relative h-28 w-full shrink-0 overflow-hidden">
                  <Image
                    src={getFullImageUrl(post.cover_image_url || post.image_url) || '/images/avalia-solar-place-holder.PNG'}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3">
                     {post.category && (
                      <Badge variant="secondary" className="bg-white/90 text-slate-900 hover:bg-white backdrop-blur-sm text-xs font-bold shadow-sm">
                        {post.category.name}
                      </Badge>
                    )}
                  </div>
                </div>
                <CardContent className="p-5 flex flex-col flex-1">
                  <h4 className="font-bold text-lg text-slate-900 mb-2 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h4>
                  <div className="mt-auto pt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(post.published_at || post.created_at || new Date()), "d MMM", { locale: ptBR })}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                      Ler artigo <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
