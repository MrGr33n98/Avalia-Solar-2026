import { companiesApiSafe } from '@/lib/api-client';
import QuoteForm from '@/components/QuoteForm';
import { notFound } from 'next/navigation';

export default async function Page({ params }: { params: { id: string } }) {
  const company = await companiesApiSafe.getById(params.id);

  if (!company) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Solicitar Orçamento</h1>
        <p className="text-muted-foreground mb-6">
          Preencha o formulário abaixo para solicitar um orçamento da empresa {company?.name}.
        </p>
        <QuoteForm companyName={company?.name || ''} companyId={company.id} />
      </div>
    </div>
  );
}
