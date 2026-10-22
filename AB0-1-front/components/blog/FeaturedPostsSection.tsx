'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, ArrowRight, Clock } from 'lucide-react';
import { Article } from '@/types/article';
import { getFullImageUrl } from '@/utils/image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { track } from '@/lib/analytics/lazy';
import { buildArticleLink } from '@/lib/blog/article-links';
import { FeaturedSplitPost } from './FeaturedSplitPost';

interface FeaturedPostsSectionProps {
  posts: Article[];
}

export function FeaturedPostsSection({ posts }: FeaturedPostsSectionProps) {
  if (!posts || posts.length === 0) return null;

  const mainPost = posts[0];
  const sidePosts = posts.slice(1, 4);

  return (
    <section className="mb-10">
      {/* Section header estilo Suíço */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <span className="block w-1 h-5 rounded-full bg-[#FFD21F]" aria-hidden="true" />
          <h2 className="text-xl font-bold text-[#101114] tracking-tight">
            Em Destaque
          </h2>
        </div>
        <Link
          href="/blog"
          className="text-xs font-semibold text-[#155EEF] hover:text-blue-700 flex items-center gap-1 transition-colors"
        >
          Ver todos os destaques <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Post Principal */}
        <div className={sidePosts.length > 0 ? "lg:col-span-7 xl:col-span-8 flex flex-col" : "lg:col-span-12"}>
          <FeaturedSplitPost post={mainPost} />
        </div>

        {/* Side Posts Secundários empilhados lado direito */}
        {sidePosts.length > 0 && (
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-between gap-3.5">
            {sidePosts.map((post, index) => {
              const slugOrId = post.slug || String(post.id);
              const link = buildArticleLink({
                slugOrId,
                placement: 'featured_secondary',
                category: post.category?.name,
                term: slugOrId,
                content: `featured_secondary_${index + 1}`,
              });

              const imageUrl =
                getFullImageUrl(post.cover_image_url || post.image_url) ||
                '/images/avalia-solar-place-holder.PNG';

              const readTime =
                post.reading_time_minutes ||
                Math.ceil(((post.content || '').replace(/<[^>]*>/g, '').split(/\s+/).length || 800) / 200);

              return (
                <Link
                  key={post.id}
                  href={link.url}
                  className="group flex flex-1 gap-4 bg-white border border-[#E8EAED] rounded-2xl hover:border-slate-300 hover:shadow-[0_8px_24px_rgba(16,17,20,0.04)] transition-all p-3.5 sm:p-4 items-center"
                  onClick={() =>
                    track('blog_article_click', {
                      post_id: post.id,
                      post_title: post.title,
                      post_slug: slugOrId,
                      category_name: post.category?.name,
                      element_type: 'featured_secondary',
                      action_type: 'click',
                      placement: 'featured_secondary',
                      position: index + 2,
                      link_url: link.url,
                      ...link.utm,
                    })
                  }
                >
                  {/* Content */}
                  <div className="flex flex-col flex-1 min-w-0 justify-between py-0.5">
                    <div>
                      {post.category && (
                        <span className="text-[10px] font-bold text-[#155EEF] tracking-wider uppercase mb-1 block">
                          {post.category.name}
                        </span>
                      )}
                      <h4 className="font-bold text-sm text-[#101114] leading-snug line-clamp-2 group-hover:text-[#155EEF] transition-colors [text-wrap:balance]">
                        {post.title}
                      </h4>
                    </div>
                    <div className="mt-2.5 flex items-center gap-3 text-xs text-[#667085]">
                      <span suppressHydrationWarning className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" aria-hidden="true" />
                        {format(
                          new Date(post.published_at || post.created_at || new Date()),
                          'd MMM, yyyy',
                          { locale: ptBR }
                        )}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" aria-hidden="true" />
                        {readTime} min
                      </span>
                    </div>
                  </div>

                  {/* Thumbnail à direita ou à esquerda (à direita dá respiro ao texto como na Stripe/Swiss) */}
                  <div className="relative w-24 h-20 sm:w-28 sm:h-22 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-100">
                    <Image
                      src={imageUrl}
                      alt={post.title}
                      fill
                      sizes="112px"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
