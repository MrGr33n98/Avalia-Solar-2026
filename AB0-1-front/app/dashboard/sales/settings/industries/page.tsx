'use client';

import TaxonomySettingPage from '@/components/sales/settings/TaxonomySettingPage';

export default function IndustriesSettingsPage() {
  return (
    <TaxonomySettingPage
      kind="industries"
      title="Industries & Sectors"
      subtitle="Categorize o setor de atuação dos seus clientes corporativos e comerciais (Agro, Indústria, Comércio, Residencial, Serviços)"
      helpTitle="Setores de Atuação"
      helpDescription="Segmentar empresas por setor permite analisar taxas de conversão e ticket médio por segmento econômico."
      defaultItems={[
        'Agronegócio / Rural (Agro)',
        'Comércio & Varejo (Commercial)',
        'Indústria & Manufatura (Industrial)',
        'Residencial (Residential)',
        'Serviços & Cooperativas (Services)',
      ]}
    />
  );
}
