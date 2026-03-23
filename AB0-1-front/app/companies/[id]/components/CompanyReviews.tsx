'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { MessageSquarePlus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Review } from '@/lib/api';
import { buildCompanySubPath } from '@/lib/slug';
import { EditorialReviewCard } from '@/components/EditorialReviewCard';
import { LegacyReviewCard } from '@/components/LegacyReviewCard';
import { CompanyReputationSwitcher } from './CompanyReputationSwitcher';
import LoadingSpinner from '@/components/LoadingSpinner';

interface CompanyReviewsProps {
  reviews?: Review[];
  loading?: boolean;
  companyId: number;
  companySlug?: string;
  companyName?: string | null;
  aggregates?: {
    global: any;
    by_category: any[];
  };
}

export default function CompanyReviews({ 
  reviews = [], 
  loading = false, 
  companyId, 
  companySlug, 
  companyName,
  aggregates = { global: null, by_category: [] }
}: CompanyReviewsProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const reviewPath = buildCompanySubPath(companySlug, companyName, 'review', companyId);
  
  const filteredReviews = useMemo(() => {
    // 'Geral' (null) mostra TODAS as reviews da empresa (Autoridade de Marca)
    if (activeCategoryId === null) return reviews;
    // Filtro por categoria específica
    return reviews.filter(r => r.category_id === activeCategoryId);
  }, [reviews, activeCategoryId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <LoadingSpinner />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Sincronizando avaliações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-2xl font-black tracking-tighter text-slate-900">Prova Social</h3>
          <p className="text-sm text-slate-600 font-medium">Veja o que clientes reais estão dizendo sobre a performance desta empresa.</p>
        </div>
        <Button asChild className="rounded-full px-8 h-12 font-black bg-slate-950 hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-200">
          <Link href={reviewPath}>
            Avaliar Agora
          </Link>
        </Button>
      </div>

      {/* Switcher */}
      <div className="flex items-center gap-4">
        <CompanyReputationSwitcher 
          aggregates={aggregates} 
          activeCategoryId={activeCategoryId} 
          onSwitch={setActiveCategoryId} 
        />
      </div>
      
      {/* Reviews List */}
      {filteredReviews.length > 0 ? (
        <div className="grid gap-6">
          {filteredReviews.map((review: any) => {
            // Se tiver headline ou pros/cons ou granular_scores, é V2
            const isV2 = review.headline || (review.pros && review.pros.length > 0) || (review.granular_scores && review.granular_scores.length > 0);
            
            return isV2 ? (
              <EditorialReviewCard key={review.id} review={review} />
            ) : (
              <LegacyReviewCard key={review.id} review={review} />
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-3xl border border-dashed border-slate-200 animate-in zoom-in-95 duration-500">
          <div className="bg-slate-50 p-6 rounded-full mb-6">
            <Filter className="h-12 w-12 text-slate-200" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {activeCategoryId === null ? 'Nenhuma avaliação encontrada' : 'Nenhuma avaliação nesta categoria'}
          </h3>
          <p className="text-slate-600 max-w-sm mb-8 text-sm">
            {activeCategoryId === null 
              ? 'Esta empresa ainda não recebeu avaliações de clientes.' 
              : 'Esta empresa ainda não recebeu avaliações específicas para este serviço.'} 
            Seja o primeiro a compartilhar sua experiência!
          </p>
          <Button asChild variant="outline" className="rounded-full px-8 font-bold border-slate-900">
            <Link href={reviewPath}>
              Deixar Primeira Avaliação
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
