'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Calendar, ArrowRight, Sparkles } from 'lucide-react';
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
  const sidePosts = posts.slice(1, 3);

  return (
    <section className="mb-10">
      {/* Section header estilo Stripe/Suíço */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <span className="block w-1.5 h-4 rounded-full bg-blue-600" aria-hidden="true" />
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Em Destaque
          </h2>
        </div>
        <Link
          href="/blog"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
        >
          Explorar todos <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>

      {/* Post Principal: Padrão Editorial Split 50/50 da Stripe */}
      <FeaturedSplitPost post={mainPost} />

      {/* Side Posts Secundários refinados em grid horizontal complementar se houver mais posts */}
      {sidePosts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            return (
              <Link
                key={post.id}
                href={link.url}
                className="group flex gap-4 bg-white border border-slate-200/80 rounded-xl hover:border-slate-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition-all p-4"
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
                {/* Thumbnail */}
                <div className="relative w-28 h-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  <Image
                    src={imageUrl}
                    alt={post.title}
                    fill
                    sizes="112px"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                  />
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 min-w-0 justify-between">
                  <div>
                    {post.category && (
                      <span className="text-[10px] font-bold text-blue-700 tracking-wider uppercase mb-1 block">
                        {post.category.name}
                      </span>
                    )}
                    <h4 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors [text-wrap:balance]">
                      {post.title}
                    </h4>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span suppressHydrationWarning className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" aria-hidden="true" />
                      {format(
                        new Date(post.published_at || post.created_at || new Date()),
                        'd MMM, yyyy',
                        { locale: ptBR }
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-blue-600 transition-transform duration-200 group-hover:translate-x-1">
                      Ler <ArrowRight className="w-3 h-3" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
