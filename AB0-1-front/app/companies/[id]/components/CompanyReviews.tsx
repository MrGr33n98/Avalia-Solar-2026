import ReviewCard from '@/components/ReviewCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus } from 'lucide-react';
import Link from 'next/link';
import { Review } from '@/lib/api';
import { buildCompanySubPath } from '@/lib/slug';

interface CompanyReviewsProps {
  reviews?: Review[];
  loading?: boolean;
  companyId: number;
  companyName?: string | null;
}

export default function CompanyReviews({ reviews = [], loading = false, companyId, companyName }: CompanyReviewsProps) {
  const reviewPath = buildCompanySubPath(companyId, companyName, 'review');
  
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-muted/20 rounded-2xl border border-dashed border-border/60 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-muted p-6 rounded-full mb-6">
          <MessageSquarePlus className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Seja o primeiro a avaliar!</h3>
        <p className="text-muted-foreground max-w-sm mb-8">
          Esta empresa ainda não possui avaliações. Compartilhe sua experiência para ajudar outros consumidores.
        </p>
        <Button asChild size="lg" className="rounded-full px-8 font-semibold shadow-lg hover:shadow-xl transition-all">
          <Link href={reviewPath}>
            Deixar Avaliação
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-muted/30 p-4 rounded-xl border border-border/50">
        <h3 className="text-lg font-semibold">Avaliações Recentes</h3>
        <Button asChild variant="default" size="sm" className="shadow-sm">
          <Link href={reviewPath}>
            Avaliar Agora
          </Link>
        </Button>
      </div>
      
      <div className="grid gap-6">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}
