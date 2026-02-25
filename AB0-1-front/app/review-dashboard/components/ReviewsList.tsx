import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Edit2, Trash2, MessageSquare } from 'lucide-react';
import { Review } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

interface ReviewsListProps {
  data: Review[];
  loading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const statusMap: Record<string, { label: string; color: string }> = {
  approved: { label: 'Publicada', color: 'bg-green-100 text-green-800' },
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
};

export function ReviewsList({ data, loading, onEdit, onDelete }: ReviewsListProps) {
  const [filter, setFilter] = useState('all');

  const filteredData = data.filter((review) => {
    if (filter === 'all') return true;
    return review.status === filter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Card className="rounded-2xl shadow-sm border overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <CardTitle className="text-lg font-semibold">Minhas Reviews</CardTitle>
        <div className="flex flex-wrap gap-2">
          {['all', 'approved', 'pending', 'draft'].map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className="rounded-full text-xs h-8"
            >
              {f === 'all' ? 'Todas' : statusMap[f]?.label || f}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <div className="divide-y divide-gray-100">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))
          ) : filteredData.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <MessageSquare className="h-12 w-12 text-gray-200 mx-auto" />
              <div className="space-y-1">
                <p className="text-gray-500 font-medium">Nenhuma review encontrada</p>
                <p className="text-sm text-gray-400">Suas avaliações ajudam outras pessoas a escolherem integradores.</p>
              </div>
              <Button variant="outline" size="sm" asChild className="mt-2">
                <a href="/empresas">Escrever primeira avaliação</a>
              </Button>
            </div>
          ) : (
            filteredData.map((review) => (
              <div key={review.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <div className="flex gap-4">
                    <Avatar className="h-12 w-12 border border-gray-100 shrink-0">
                      <AvatarImage src={review.company?.logo_url || ''} />
                      <AvatarFallback className="bg-teal-50 text-teal-700 font-bold">
                        {review.company?.name?.substring(0, 2).toUpperCase() || 'EM'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-gray-900">{review.company?.name || 'Empresa'}</h4>
                        <Badge variant="secondary" className={`text-[10px] py-0 h-4 ${statusMap[review.status || '']?.color || 'bg-gray-100 text-gray-800'}`}>
                          {statusMap[review.status || '']?.label || review.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < (review.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                            }`}
                          />
                        ))}
                        <span className="text-xs text-gray-400 ml-1">{formatDate(review.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 self-start">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-teal-600" onClick={() => onEdit?.(review.id.toString())}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600" onClick={() => onDelete?.(review.id.toString())}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                    {review.comment || review.body || 'Sem comentário.'}
                  </p>
                </div>
                {review.reply && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Resposta da Empresa</span>
                    </div>
                    <p className="text-sm text-gray-600 italic">&quot;{review.reply}&quot;</p>
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
