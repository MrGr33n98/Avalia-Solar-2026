import { companiesApiSafe } from '@/lib/api-client';
import QuoteForm from '@/components/QuoteForm';

export default async function Page({ params }: { params: { id: string } }) {
  const companyId = Number(params.id);
  const company = await companiesApiSafe.getById(companyId);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Solicitar Orçamento</h1>
        <p className="text-muted-foreground mb-6">
          Preencha o formulário abaixo para solicitar um orçamento da empresa {company?.name}.
        </p>
        <QuoteForm companyName={company?.name || ''} companyId={companyId} />
      </div>
    </div>
  );
}
