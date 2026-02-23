'use client';

import { useEffect, useMemo, useState } from 'react';
import { Quote, Star } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { companiesApiSafe, SocialProofReview } from '@/lib/api-client';

interface SocialProofProps {
  companyId: number;
  companyName: string;
}

export default function SocialProof({ companyId, companyName }: SocialProofProps) {
  const [reviews, setReviews] = useState<SocialProofReview[]>([]);
  const [totalFeatured, setTotalFeatured] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const payload = await companiesApiSafe.getSocialProof(companyId, { limit: 3 });
        if (!mounted) return;
        setReviews(payload.reviews || []);
        setTotalFeatured(payload.total_featured_reviews || 0);
      } catch (error) {
        console.error('Failed to load social proof reviews:', error);
        if (mounted) {
          setReviews([]);
          setTotalFeatured(0);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (companyId) load();

    return () => {
      mounted = false;
    };
  }, [companyId]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((acc, item) => acc + Number(item.rating || 0), 0);
    return Number((total / reviews.length).toFixed(1));
  }, [reviews]);

  if (loading) {
    return (
      <Card className="border-none shadow-md">
        <CardHeader>
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) return null;

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Quote className="h-5 w-5 text-primary" />
          Provas sociais reais
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Avaliacoes aprovadas de clientes da {companyName}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 rounded-xl border bg-muted/20 p-3 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Media atual</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">{averageRating}</span>
              <div className="flex items-center gap-1 text-amber-500">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} className="h-4 w-4" fill={idx < Math.round(averageRating) ? 'currentColor' : 'none'} />
                ))}
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Reviews em destaque</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{totalFeatured}</p>
          </div>
        </div>

        <div className="space-y-3">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{review.user?.name || 'Cliente'}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-amber-500" aria-label={`${review.rating} estrelas`}>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      className={`h-4 w-4 ${idx + 1 <= Math.round(Number(review.rating || 0)) ? '' : 'text-muted-foreground/30'}`}
                      fill={idx + 1 <= Math.round(Number(review.rating || 0)) ? 'currentColor' : 'none'}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground/90">&ldquo;{review.comment}&rdquo;</p>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
