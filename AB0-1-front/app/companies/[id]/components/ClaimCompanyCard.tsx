'use client';

import { ShieldCheck, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Company } from '@/lib/api';
import { RatingStars } from '@/components/RatingStars';

interface ClaimCompanyCardProps {
  company: Company;
}

export default function ClaimCompanyCard({ company }: ClaimCompanyCardProps) {
  const averageRating = Number(
    (company as any).average_rating ?? (company as any).rating_avg ?? (company as any).rating ?? 0
  );
  const ratingCount = Number(
    (company as any).rating_count ?? (company as any).total_reviews ?? (company as any).reviews_count ?? 0
  );

  return (
    <Card className="overflow-hidden border border-primary/20 bg-primary/[0.04] shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck className="h-5 w-5" />
          <h3 className="font-bold text-base leading-tight">Trabalha nesta empresa?</h3>
        </div>
        
        <p className="text-sm text-muted-foreground leading-relaxed">
          Reivindique este perfil para responder avaliações e atualizar as informações da empresa.
        </p>

        {ratingCount > 0 && (
          <div className="rounded-md border border-primary/10 bg-white/80 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Avaliações</p>
            <RatingStars
              rating={averageRating}
              count={ratingCount}
              showCount={true}
              showRatingValue={true}
              starClassName="h-3.5 w-3.5"
              ratingValueClassName="text-sm font-bold text-foreground"
              countClassName="text-xs text-muted-foreground"
            />
          </div>
        )}

        <Button asChild className="w-full h-9 group text-sm" variant="default">
          <Link href={`/companies/${company.id}/claim`}>
            Reivindicar Perfil
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
        
        <p className="text-[10px] text-center text-muted-foreground/60 uppercase tracking-wide font-medium">
          Acesso gratuito
        </p>
      </CardContent>
    </Card>
  );
}
