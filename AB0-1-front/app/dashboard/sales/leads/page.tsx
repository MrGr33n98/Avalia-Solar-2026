import { Suspense } from 'react';
import LeadsWorkspace from '@/components/sales/leads/LeadsWorkspace';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Leads | Avalia Solar CRM',
  description: 'Gerenciamento de Leads B2B e pipeline de oportunidades com paridade ao benchmark Nutshell.',
};

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Carregando Leads Workspace...</div>}>
      <LeadsWorkspace />
    </Suspense>
  );
}
