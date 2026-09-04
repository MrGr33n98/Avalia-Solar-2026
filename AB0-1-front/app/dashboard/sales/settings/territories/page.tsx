'use client';

import TaxonomySettingPage from '@/components/sales/settings/TaxonomySettingPage';

export default function TerritoriesSettingsPage() {
  return (
    <TaxonomySettingPage
      kind="territories"
      title="Territories & Regions"
      subtitle="Organize a cobertura geográfica das equipes de vendas por região, estado ou cidade"
      helpTitle="Territórios de Vendas"
      helpDescription="Os territórios distribuem a carga de trabalho comercial com base na localização geográfica e raio de atendimento."
      defaultItems={[
        'Região Sudeste (SP, RJ, MG, ES)',
        'Região Sul (PR, SC, RS)',
        'Região Centro-Oeste (GO, MT, MS, DF)',
        'Região Nordeste (BA, PE, CE, RN, MA, AL, PB, SE, PI)',
        'Região Norte (AM, PA, TO, RO, AC, AP, RR)',
      ]}
    />
  );
}
