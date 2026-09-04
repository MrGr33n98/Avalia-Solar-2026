'use client';

import TaxonomySettingPage from '@/components/sales/settings/TaxonomySettingPage';

export default function ActivityTypesSettingsPage() {
  return (
    <TaxonomySettingPage
      kind="activity_types"
      title="Activity Types"
      subtitle="Configure os tipos de atividades e interações registradas no histórico comercial (Phone call, Meeting, Email, Site visit, Proposal presentation)"
      helpTitle="O que são tipos de atividade?"
      helpDescription="Os tipos de atividade categorizam todas as interações da equipe comercial com leads e contatos, permitindo relatórios de produtividade."
      defaultItems={[
        'Ligação telefônica (Call)',
        'Reunião presencial / online (Meeting)',
        'Envio de e-mail (Email)',
        'Visita técnica no local (Site Visit)',
        'Apresentação de proposta solar (Proposal)',
      ]}
    />
  );
}
