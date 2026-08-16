'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, ArrowRight, Sun, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Article } from '@/types/article';
import { getFullImageUrl } from '@/utils/image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { track } from '@/lib/analytics/lazy';
import { buildArticleLink } from '@/lib/blog/article-links';

interface PostCardProps {
  post: Article;
  position?: number;
  placement?: string;
}

export function PostCard({ post, position, placement = 'blog_list_card' }: PostCardProps) {
  const wordCount = post.content
    ? post.content.replace(/<[^>]*>/g, '').split(/\s+/).length
    : 0;
  const readTime = post.reading_time_minutes || Math.ceil(wordCount / 200) || 5;
  const slugOrId = post.slug || String(post.id);
  const { url, utm } = buildArticleLink({
    slugOrId,
    placement,
    category: post.category?.name,
    term: post.slug || String(post.id),
  });

  return (
    <Link
      href={url}
      className="group block h-full"
      onClick={() => {
        track('blog_article_click', {
          post_id: post.id,
          post_title: post.title,
          post_slug: post.slug || String(post.id),
          category_name: post.category?.name,
          element_type: 'card',
          action_type: 'click',
          placement,
          position,
          link_url: url,
          ...utm,
        });
      }}
    >
      <article className="h-full flex flex-col bg-white border border-gray-100 rounded-lg overflow-hidden group-hover:border-[#0047bb] transition-colors">
        {/* Cover Image */}
        <div className="relative h-44 w-full overflow-hidden bg-gray-100 shrink-0">
          {post.cover_image_url || post.image_url ? (
            <Image
              src={getFullImageUrl(post.cover_image_url || post.image_url)}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center text-gray-500">
              <Sun className="w-8 h-8 mb-1.5 opacity-70" aria-hidden="true" />
              <span className="text-[10px] font-semibold uppercase tracking-widest">
                Avalia Solar
              </span>
            </div>
          )}

          {/* Category label */}
          {post.category && (
            <div className="absolute top-3 left-3">
              <span className="inline-block bg-white/95 text-[10px] font-semibold text-gray-800 px-2 py-0.5 tracking-wide uppercase shadow-sm">
                {post.category.name}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-4">
          {/* Meta */}
          <div className="flex items-center gap-2.5 text-[11px] text-gray-500 mb-2.5">
            <span suppressHydrationWarning className="flex items-center gap-1">
              <Calendar className="w-3 h-3" aria-hidden="true" />
              {post.published_date
                ? post.published_date
                : post.published_at
                ? format(new Date(post.published_at), 'd MMM, yyyy', { locale: ptBR })
                : 'Recente'}
            </span>
            <span className="text-gray-500" aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {readTime} min
            </span>
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 leading-snug group-hover:text-blue-700 transition-colors">
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4 font-normal">
            {post.excerpt ||
              'Confira este artigo completo sobre energia solar e economize na sua conta de luz.'}
          </p>

          {/* Footer */}
          <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-50">
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5">
                <AvatarImage
                  src={
                    post.author_avatar_url || post.author?.avatar_url
                      ? getFullImageUrl(post.author_avatar_url || post.author?.avatar_url)
                      : '/images/felipe-ceo-avalia-solar.png'
                  }
                  alt={post.author_name || 'Avalia Solar'}
                  className="object-cover object-top"
                />
                <AvatarFallback className="text-[8px] bg-gray-100">
                  <User className="w-2.5 h-2.5 text-gray-500" aria-hidden="true" />
                </AvatarFallback>
              </Avatar>
              <span className="text-[11px] font-medium text-gray-500 truncate max-w-[100px]">
                {post.author_name || post.author?.name || 'Avalia Solar'}
              </span>
            </div>

            <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
              Ler <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
