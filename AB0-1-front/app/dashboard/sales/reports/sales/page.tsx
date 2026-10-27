'use client';

import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import { NutshellReportCanvas } from '@/components/sales/reports/nutshell/NutshellReportCanvas';

export default function SalesReportPage() {
  return (
    <SalesLayoutWrapper>
      <div className="space-y-6">
        <NutshellReportCanvas
          initialReportType="sales"
          titleOverride="Sales"
          subtitleOverride="Quanto vendemos em cada período contra a meta de cota?"
        />
      </div>
    </SalesLayoutWrapper>
  );
}
