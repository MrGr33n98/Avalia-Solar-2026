'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { reviewsApi, Review } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MessageCircle } from 'lucide-react';

const formatDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function ReviewDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user?.role === 'company') {
      router.push('/company-dashboard');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading) return;
    if (user?.role === 'company') return;

    const loadReviews = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await reviewsApi.listMine();
        setReviews(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('[ReviewDashboard] Failed to load reviews', err);
        setError('Nao foi possivel carregar suas reviews.');
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [authLoading, user]);

  const sortedReviews = useMemo(() => {
    return [...reviews].sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return bTime - aTime;
    });
  }, [reviews]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Minhas reviews</h1>
          <p className="mt-2 text-slate-600">
            Acompanhe suas avaliacoes e respostas das empresas.
          </p>
        </header>

        {loading && (
          <Card>
            <CardContent className="flex items-center justify-center py-16 text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Carregando reviews...
            </CardContent>
          </Card>
        )}

        {error && !loading && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-6 text-sm text-red-700">{error}</CardContent>
          </Card>
        )}

        {!loading && !error && sortedReviews.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center text-slate-600">
              <MessageCircle className="h-8 w-8 text-slate-400" />
              <p className="text-sm font-medium">Voce ainda nao fez nenhuma review.</p>
              <Button variant="outline" onClick={() => router.push('/companies')}>
                Buscar empresas para avaliar
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && !error && sortedReviews.length > 0 && (
          <div className="space-y-4">
            {sortedReviews.map((review) => (
              <Card key={review.id}>
                <CardHeader className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">
                        {review.company?.name || 'Empresa'}
                      </CardTitle>
                      <CardDescription>
                        Nota {review.rating} • {formatDate(review.created_at)}
                      </CardDescription>
                    </div>
                    {review.status && (
                      <Badge variant={review.status === 'approved' ? 'default' : 'secondary'}>
                        {review.status}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-700">{review.comment}</p>

                  {review.reply && (
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold text-slate-500">Resposta da empresa</p>
                      <p className="mt-2 text-sm text-slate-700">{review.reply}</p>
                      {review.replied_at && (
                        <p className="mt-2 text-xs text-slate-500">
                          Respondido em {formatDate(review.replied_at)}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
