'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Edit2, Trash2, MessageSquare, ChevronDown } from 'lucide-react';
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
    <Card className="rounded-3xl shadow-sm border border-slate-100 overflow-hidden bg-white">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-50">       
        <CardTitle className="text-xl font-black text-slate-950 uppercase tracking-tight">Minhas Avaliações</CardTitle>
        <div className="flex flex-wrap gap-1.5">
          {['all', 'approved', 'pending'].map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-xl text-[10px] font-black uppercase tracking-widest h-8 px-3",
                filter === f ? "bg-slate-900 text-white" : "border-slate-100 text-slate-400"
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
            <div className="py-20 text-center space-y-4 px-6">
              <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                 <MessageSquare className="h-10 w-10 text-slate-200" />
              </div>
              <div className="space-y-1">
                <p className="text-slate-950 font-black uppercase text-sm">Sua voz faz a diferença</p>
                <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">Sua primeira avaliação ajuda milhares de pessoas a escolherem o integrador certo.</p>
              </div>
              <Button variant="default" className="bg-blue-600 hover:bg-blue-700 font-black rounded-xl px-8 shadow-lg shadow-blue-100 h-11" asChild>
                <a href="/empresas">Escrever Avaliação</a>
              </Button>
            </div>
          ) : (
            filteredData.map((review) => (
              <div key={review.id} className="p-5 md:p-6 hover:bg-slate-50/50 transition-all group">
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <div className="flex gap-4">
                    <Avatar className="h-14 w-14 rounded-2xl border border-slate-100 shadow-sm shrink-0">
                      <AvatarImage src={review.company?.logo_url || ''} className="object-cover" />
                      <AvatarFallback className="bg-slate-50 text-slate-300 font-black">
                        {review.company?.name?.substring(0, 2).toUpperCase() || 'EM'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-slate-950 uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                          {review.company?.name || 'Empresa'}
                        </h4>  
                        <Badge variant="secondary" className={cn("text-[10px] font-black uppercase px-2 py-0 h-4 rounded-md tracking-tighter", statusMap[review.status || '']?.bg, statusMap[review.status || '']?.color)}>
                          {statusMap[review.status || '']?.label || review.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="flex items-center gap-0.5 mr-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn("h-3.5 w-3.5", i < (review.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200')}
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
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-white" onClick={() => onEdit?.(review.id.toString())}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-red-600 hover:bg-white" onClick={() => onDelete?.(review.id.toString())}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    {review.comment || review.body || 'Sem comentário.'}
                  </p>
                </div>
                {review.reply && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 border-l-4 border-l-blue-500">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-1 w-1 rounded-full bg-blue-500" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resposta da Empresa</span>
                    </div>
                    <p className="text-xs text-slate-600 font-bold leading-relaxed italic">&quot;{review.reply}&quot;</p>
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
