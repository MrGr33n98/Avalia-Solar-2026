'use client';

import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import { NutshellReportCanvas } from '@/components/sales/reports/nutshell/NutshellReportCanvas';

export default function NewLeadsReportPage() {
  return (
    <SalesLayoutWrapper>
      <div className="space-y-6">
        <NutshellReportCanvas
          initialReportType="new_leads"
          titleOverride="New Leads"
          subtitleOverride="Quantos novos leads e oportunidades foram gerados em cada período?"
        />
      </div>
    </SalesLayoutWrapper>
  );
}
