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

/**
 * PostCard - Card de artigo com acabamento visual refinado no padrão Stripe.
 * Mantém 100% da telemetria de cliques, links canônicos e tags de marketplace,
 * adicionando balanceamento tipográfico [text-wrap:balance], elevação suave e contraste AAA.
 */
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

  const authorName = post.author_name || post.author?.name || 'Avalia Solar';
  const authorAvatar = post.author_avatar_url || post.author?.avatar_url;

  return (
    <Link
      href={url}
      className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-[#E8EAED] bg-white shadow-[0_4px_20px_rgba(16,17,20,0.035)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_14px_36px_rgba(16,17,20,0.07)]"
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
      <article className="flex h-full flex-col">
        {/* Cover Image com Aspect-Ratio 16:9 Estável */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 shrink-0">
          {post.cover_image_url || post.image_url ? (
            <Image
              src={getFullImageUrl(post.cover_image_url || post.image_url)}
              alt={post.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center text-slate-400">
              <Sun className="w-8 h-8 mb-1.5 opacity-60" aria-hidden="true" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Avalia Solar
              </span>
            </div>
          )}

          {/* Category label discreto em pílula translúcida */}
          {post.category && (
            <div className="absolute top-3 left-3">
              <span className="inline-block rounded-lg bg-white/95 text-[10px] font-bold text-[#101114] px-2.5 py-1 tracking-wider uppercase shadow-sm border border-slate-100 backdrop-blur-sm">
                {post.category.name}
              </span>
            </div>
          )}
        </div>

        {/* Content com Escala Slate de Alto Contraste */}
        <div className="flex-1 flex flex-col p-5">
          {/* Metadados */}
          <div className="flex items-center gap-2 text-xs text-[#667085] mb-2.5">
            <span suppressHydrationWarning className="flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              {post.published_date
                ? post.published_date
                : post.published_at
                ? format(new Date(post.published_at), 'd MMM, yyyy', { locale: ptBR })
                : 'Recente'}
            </span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span className="flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              {readTime} min
            </span>
          </div>

          {/* Title com [text-wrap:balance] para evitar viúvas tipográficas */}
          <h3 className="text-base font-bold text-[#101114] mb-2 line-clamp-2 leading-snug group-hover:text-[#155EEF] transition-colors [text-wrap:balance]">
            {post.title}
          </h3>

          {/* Excerpt com [text-wrap:pretty] */}
          <p className="text-xs text-[#667085] line-clamp-2 leading-relaxed mb-4 font-normal [text-wrap:pretty]">
            {post.excerpt ||
              'Confira este artigo completo sobre energia solar e economize na sua conta de luz.'}
          </p>

          {/* Footer com Autor e Seta de Interação Estilo Stripe */}
          <div className="mt-auto flex items-center justify-between pt-3.5 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6 border border-slate-200">
                <AvatarImage
                  src={
                    authorAvatar
                      ? getFullImageUrl(authorAvatar)
                      : '/images/felipe-ceo-avalia-solar.png'
                  }
                  alt={authorName}
                  className="object-cover object-top"
                />
                <AvatarFallback className="text-[9px] bg-slate-100 text-slate-600 font-bold">
                  <User className="w-3 h-3 text-slate-400" aria-hidden="true" />
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-[#475467] truncate max-w-[120px]">
                {authorName}
              </span>
            </div>

            <span className="text-xs font-bold text-[#155EEF] flex items-center gap-1 transition-transform duration-200 group-hover:translate-x-1">
              Ler artigo <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
