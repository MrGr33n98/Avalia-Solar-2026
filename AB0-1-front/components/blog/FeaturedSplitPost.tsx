'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { Article } from '@/types/article';
import { getFullImageUrl } from '@/utils/image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { track } from '@/lib/analytics/lazy';
import { buildArticleLink } from '@/lib/blog/article-links';

interface FeaturedSplitPostProps {
  post: Article;
}

/**
 * FeaturedSplitPost - Layout Editorial Split 50/50 inspirado no The Stripe Blog.
 * Substitui o antigo degradê preto por uma estética de alta agência internacional:
 * lado esquerdo com tipografia rica e fundo branco imaculado (contraste AAA),
 * lado direito com arte visual limpa sem sobreposição opaca de texto.
 */
export function FeaturedSplitPost({ post }: FeaturedSplitPostProps) {
  if (!post) return null;

  const slugOrId = post.slug || String(post.id);
  const { url, utm } = buildArticleLink({
    slugOrId,
    placement: 'featured_editorial_split',
    category: post.category?.name,
    term: slugOrId,
  });

  const imageUrl = getFullImageUrl(post.cover_image_url || post.image_url);
  const readTime =
    post.reading_time_minutes ||
    Math.ceil(((post.content || '').replace(/<[^>]*>/g, '').split(/\s+/).length || 1000) / 200);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#E8EAED] bg-white shadow-[0_4px_20px_rgba(16,17,20,0.035)] transition-all duration-300 hover:border-slate-300 hover:shadow-[0_12px_32px_rgba(16,17,20,0.06)]">
      <Link
        href={url}
        className="group grid grid-cols-1 items-stretch lg:grid-cols-12"
        onClick={() => {
          track('blog_article_click', {
            post_id: post.id,
            post_title: post.title,
            post_slug: slugOrId,
            category_name: post.category?.name,
            element_type: 'featured_split_card',
            action_type: 'click',
            placement: 'featured_editorial_split',
            position: 1,
            link_url: url,
            ...utm,
          });
        }}
      >
        {/* Metade Esquerda: Conteúdo Editorial com Tipografia Balanceada */}
        <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-7 lg:p-10">
          <div>
            {/* Badges de Destaque Editorial e Categoria */}
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#155EEF]">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                Destaque da Semana
              </span>
              {post.category && (
                <span className="text-[12px] font-semibold tracking-wide text-[#667085] uppercase">
                  {post.category.name}
                </span>
              )}
            </div>

            {/* Título com [text-wrap:balance] para eliminar quebras orfãs */}
            <h2 className="text-2xl font-bold tracking-tight text-[#101114] transition-colors duration-200 group-hover:text-[#155EEF] sm:text-3xl lg:text-[32px] lg:leading-[1.2] [text-wrap:balance]">
              {post.title}
            </h2>

            {/* Resumo com cor Slate de alto contraste e legibilidade */}
            <p className="mt-4 text-sm leading-relaxed text-[#667085] sm:text-base line-clamp-3 [text-wrap:pretty]">
              {post.excerpt ||
                'Confira a análise completa de nossos especialistas sobre o mercado de energia solar, payback e avanços tecnológicos.'}
            </p>
          </div>

          {/* Rodapé do Card: Metadados e Seta com Micro-Interação da Stripe */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <div className="flex items-center gap-3 text-xs text-[#667085]">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                {post.published_at
                  ? format(new Date(post.published_at), 'd MMM, yyyy', { locale: ptBR })
                  : 'Recente'}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                {readTime} min de leitura
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#155EEF] transition-transform duration-200 group-hover:translate-x-1.5">
              Ler artigo completo
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Metade Direita: Arte Visual Limpa sem Filtro Escuro Agressivo */}
        <div className="relative min-h-[260px] bg-slate-100 lg:col-span-5 lg:min-h-full">
          <Image
            src={imageUrl || '/images/avalia-solar-place-holder.PNG'}
            alt={post.title}
            fill
            sizes="(max-width: 1024px) 100vw, 42vw"
            priority
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.015]"
          />
        </div>
      </Link>
    </div>
  );
}
