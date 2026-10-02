import { companiesApiSafe } from '@/lib/api-client';
import QuoteWizardLauncher from '@/app/quote-wizard/QuoteWizardLauncher';
import { notFound, redirect } from 'next/navigation';

export default async function Page({ params }: { params: { id: string } }) {
  const company = await companiesApiSafe.getById(params.id);

  if (!company) {
    notFound();
  }

  if (company.has_paid_plan !== true) {
    redirect(`/companies/${params.id}`);
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Solicitar Orçamento</h1>
        <p className="text-muted-foreground mb-6">
          O fluxo atualizado será aberto para solicitar um orçamento da empresa {company?.name}.
        </p>
        <QuoteWizardLauncher
          preferredCompanyId={Number(company.id)}
          source="legacy-company-quote"
        />
      </div>
    </div>
  );
}
