'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Building2, CheckCircle2, ArrowRight } from 'lucide-react';
import { FeedItem } from '@/types/feed';

interface ReviewFeedCardProps {
  item: FeedItem;
}

export function ReviewFeedCard({ item }: ReviewFeedCardProps) {
  const { actor, subject } = item;

  return (
    <article className="bg-card text-card-foreground rounded-xl border border-border p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center font-bold text-amber-600 border border-amber-500/20 flex-shrink-0">
          <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
        </div>
        <div>
          <div className="flex items-center gap-1 font-semibold text-sm">
            <span>{actor.name}</span>
            <span className="text-muted-foreground font-normal">avaliou</span>
            <span className="text-primary font-bold">{subject.company?.name || 'Empresa Solar'}</span>
          </div>
          <p className="text-xs text-muted-foreground">{new Date(item.published_at).toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      {/* Rating badge & comment preview */}
      <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-sm text-amber-600">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.floor(subject.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
                }`}
              />
            ))}
          </div>
          <span>{subject.rating ? subject.rating.toFixed(1) : '5.0'} / 5.0</span>
        </div>
        <p className="text-sm font-medium italic text-foreground/90">
          &ldquo;{subject.comment || subject.headline || 'Excelente atendimento e instalação recomendada!'}&rdquo;
        </p>
      </div>

      {/* Footer link to company */}
      <div className="flex items-center justify-between pt-1 text-xs">
        <Link
          href={`/companies/${subject.company?.slug || subject.company?.id}`}
          className="flex items-center gap-1.5 font-semibold text-primary hover:underline"
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>Ver perfil da empresa</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </article>
  );
}
