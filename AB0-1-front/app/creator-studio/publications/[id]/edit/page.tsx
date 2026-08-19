'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ReviewerPageHeader } from '@/components/review-dashboard/layout/ReviewerPageHeader';
import { PublicationComposer } from '@/components/review-dashboard/publications/PublicationComposer';
import { reviewerPublicationsApi } from '@/lib/api/reviewerPublications';
import type { ReviewerPublication } from '@/types/reviewer-publication';

export default function EditPublicationPage() {
  const params = useParams<{ id: string }>();
  const [publication, setPublication] = useState<ReviewerPublication>();
  const [error, setError] = useState('');

  useEffect(() => {
    reviewerPublicationsApi
      .get(params.id)
      .then(setPublication)
      .catch(() => setError('Não foi possível carregar publicação.'));
  }, [params.id]);

  return (
    <div className="space-y-6">
      <ReviewerPageHeader
        title="Editar publicação"
        description="Atualize seu rascunho antes de publicar."
        breadcrumbs={[
          { label: 'Publicações', href: '/creator-studio/publications' },
          { label: 'Editar' },
        ]}
      />
      {error ? (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
      ) : publication ? (
        <PublicationComposer publication={publication} />
      ) : (
        <p className="text-sm text-slate-500">Carregando...</p>
      )}
    </div>
  );
}
