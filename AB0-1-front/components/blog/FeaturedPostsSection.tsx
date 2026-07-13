'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, ArrowRight } from 'lucide-react';
import { Article } from '@/types/article';
import { getFullImageUrl } from '@/utils/image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { track } from '@/lib/analytics/lazy';
import { buildArticleLink } from '@/lib/blog/article-links';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';

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
    term: mainPost.slug || String(mainPost.id),
  });
  const mainImage = getFullImageUrl(mainPost.cover_image_url || mainPost.image_url);
  const mainAuthorName = mainPost.author_name || mainPost.author?.name;
  const mainAuthorAvatar = mainPost.author?.avatar_url || mainPost.author_avatar_url;
  const mainReadingTime = mainPost.reading_time_minutes
    ? mainPost.reading_time_minutes
    : Math.ceil((mainPost.content || '').replace(/<[^>]*>/g, '').split(/\s+/).length / 200);

  return (
    <section className="mb-12">
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="block w-0.5 h-5 bg-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
            Destaques da Semana
          </h2>
        </div>
        <Link
          href="/blog"
          className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          Ver todos <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Featured Post */}
        <div className="lg:col-span-7 group relative">
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
            <div className="h-full overflow-hidden border border-gray-100 hover:border-gray-200 transition-colors bg-white">
              <div className="relative h-64 sm:h-72 lg:h-[280px] w-full overflow-hidden">
                <Image
                  src={mainImage || '/images/avalia-solar-place-holder.PNG'}
                  alt={mainPost.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-900/50 to-transparent" />

                <div className="absolute bottom-0 left-0 p-5 sm:p-7 w-full">
                  <div className="max-w-2xl">
                    {mainPost.category && (
                      <span className="inline-block mb-2.5 text-[11px] font-semibold text-blue-400 tracking-widest uppercase">
                        {mainPost.category.name}
                      </span>
                    )}
                    <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2.5 leading-snug group-hover:text-blue-100 transition-colors">
                      {mainPost.title}
                    </h3>
                    <p className="text-gray-300 line-clamp-2 mb-4 text-sm leading-relaxed font-normal hidden sm:block">
                      {mainPost.excerpt}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-gray-300 font-medium">
                      {mainAuthorName && (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5 shrink-0">
                            <AvatarImage
                              src={
                                mainAuthorAvatar
                                  ? getFullImageUrl(mainAuthorAvatar)
                                  : '/images/felipe-ceo-avalia-solar.png'
                              }
                              alt={mainAuthorName}
                              className="object-cover object-top"
                            />
                            <AvatarFallback className="bg-white/10 text-[9px] text-white">
                              <User className="w-2.5 h-2.5" />
                            </AvatarFallback>
                          </Avatar>
                          <span>{mainAuthorName}</span>
                        </div>
                      )}
                      <span suppressHydrationWarning className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 opacity-70" />
                        {format(
                          new Date(mainPost.published_at || mainPost.created_at || new Date()),
                          'd MMM, yyyy',
                          { locale: ptBR }
                        )}
                      </span>
                      {mainReadingTime ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 opacity-70" />
                          {mainReadingTime} min
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Side Posts */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {sidePosts.map((post, index) => {
            const slugOrId = post.slug || String(post.id);
            const link = buildArticleLink({
              slugOrId,
              placement: 'featured_side',
              category: post.category?.name,
              term: post.slug || String(post.id),
              content: `featured_side_${index + 1}`,
            });
            return (
              <Link
                key={post.id}
                href={link.url}
                className="group flex gap-4 bg-white border border-gray-100 hover:border-gray-200 transition-colors p-4"
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
                {/* Thumbnail */}
                <div className="relative w-24 h-20 shrink-0 overflow-hidden bg-gray-100">
                  <Image
                    src={
                      getFullImageUrl(post.cover_image_url || post.image_url) ||
                      '/images/avalia-solar-place-holder.PNG'
                    }
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 min-w-0">
                  {post.category && (
                    <span className="text-[10px] font-semibold text-blue-600 tracking-widest uppercase mb-1">
                      {post.category.name}
                    </span>
                  )}
                  <h4 className="font-medium text-sm text-gray-900 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">
                    {post.title}
                  </h4>
                  <div className="mt-auto pt-2 flex items-center gap-3 text-[11px] text-gray-400">
                    <span suppressHydrationWarning className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(
                        new Date(post.published_at || post.created_at || new Date()),
                        'd MMM',
                        { locale: ptBR }
                      )}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      Ler <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Promo Slot */}
          <div className="border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center h-[76px] text-xs text-gray-400 font-medium">
            Publicidade · Solar
          </div>
        </div>
      </div>
    </section>
  );
}
