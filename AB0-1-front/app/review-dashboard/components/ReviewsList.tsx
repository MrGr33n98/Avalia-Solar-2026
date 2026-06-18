'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Edit2, Trash2, MessageSquare } from 'lucide-react';
import { Review } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ReviewsListProps {
  data: Review[];
  loading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  approved: { label: 'Publicada', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  pending: { label: 'Em Análise', color: 'text-amber-700', bg: 'bg-amber-50' },
  draft: { label: 'Rascunho', color: 'text-slate-500', bg: 'bg-slate-100' },
};

export function ReviewsList({ data, loading, onEdit, onDelete }: ReviewsListProps) {
  const [filter, setFilter] = useState('all');

  const filteredData = data.filter((review) => {
    if (filter === 'all') return true;
    return review.status === filter;
  });

  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
        <CardTitle className="text-base font-semibold text-slate-950 md:text-lg">
          Minhas Avaliações
        </CardTitle>
        <div className="flex flex-wrap gap-1.5">
          {['all', 'approved', 'pending'].map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className={cn(
                'h-8 rounded-xl px-3 text-xs font-medium',
                filter === f ? 'bg-blue-600 text-white' : 'border-slate-200 text-slate-500'
              )}
            >
              {f === 'all' ? 'Todas' : statusMap[f]?.label || f}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <div className="divide-y divide-slate-50">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-2xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
              </div>
            ))
          ) : filteredData.length === 0 ? (
            <div className="space-y-3 px-4 py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
                <MessageSquare className="h-6 w-6 text-slate-300" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-950">Sua voz faz diferença</p>
                <p className="mx-auto max-w-xs text-xs font-medium text-slate-500">
                  Avalie empresas e ajude outros consumidores.
                </p>
              </div>
              <Button
                variant="default"
                className="h-11 w-full rounded-xl bg-blue-600 font-semibold hover:bg-blue-700 sm:w-auto sm:px-6"
                asChild
              >
                <a href="/empresas">Escrever Avaliação</a>
              </Button>
            </div>
          ) : (
            filteredData.map((review) => (
              <div key={review.id} className="p-4 transition-all hover:bg-slate-50/50 md:p-5 group">
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <div className="flex gap-4">
                    {(() => {
                      const companyObj = typeof review.company === 'string' ? null : review.company;
                      const initialsSource =
                        typeof review.company === 'string'
                          ? review.company
                          : companyObj?.name || 'EM';
                      const initials = initialsSource.substring(0, 2).toUpperCase();
                      const logoUrl = companyObj?.logo_url || '';
                      return (
                        <Avatar className="h-11 w-11 shrink-0 rounded-xl border border-slate-100 shadow-sm">
                          <AvatarImage src={logoUrl} className="object-cover" />
                          <AvatarFallback className="bg-slate-50 text-slate-300 font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      );
                    })()}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-slate-950 transition-colors group-hover:text-blue-600">
                          {typeof review.company === 'string'
                            ? review.company
                            : review.company?.name || 'Empresa'}
                        </h4>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'h-5 rounded-full px-2 text-[11px] font-semibold',
                            statusMap[review.status || '']?.bg,
                            statusMap[review.status || '']?.color
                          )}
                        >
                          {statusMap[review.status || '']?.label || review.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="flex items-center gap-0.5 mr-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'h-3.5 w-3.5',
                                i < (review.rating || 0)
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-200'
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {new Date(review.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 self-start">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-white"
                      onClick={() => onEdit?.(review.id.toString())}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl text-slate-400 hover:text-red-600 hover:bg-white"
                      onClick={() => onDelete?.(review.id.toString())}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium leading-relaxed text-slate-600">
                    {review.comment || review.body || 'Sem comentário.'}
                  </p>
                </div>
                {review.reply && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 border-l-4 border-l-blue-500">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-1 w-1 rounded-full bg-blue-500" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Resposta da Empresa
                      </span>
                    </div>
                    <p className="text-xs font-medium italic leading-relaxed text-slate-600">
                      &quot;{review.reply}&quot;
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
