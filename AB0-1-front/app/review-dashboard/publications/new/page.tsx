import { ReviewerPageHeader } from '@/components/review-dashboard/layout/ReviewerPageHeader';
import { PublicationComposer } from '@/components/review-dashboard/publications/PublicationComposer';
export default function NewPublicationPage() {
  return (
    <div className="space-y-6">
      <ReviewerPageHeader
        title="Nova publicação"
        description="Compartilhe uma experiência útil com a comunidade."
        breadcrumbs={[
          { label: 'Publicações', href: '/review-dashboard/publications' },
          { label: 'Nova publicação' },
        ]}
      />
      <PublicationComposer />
    </div>
  );
}
