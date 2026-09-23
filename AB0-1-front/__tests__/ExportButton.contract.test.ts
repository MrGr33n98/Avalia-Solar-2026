import {
  buildExportFilename,
  buildExportSummaryRows,
  type ExportSummaryData,
} from '@/app/dashboard/components/ExportButton';
import { formatExportRangeLabel } from '@/app/dashboard/components/PerformanceMetrics';

const data: ExportSummaryData = {
  views: 7,
  cta_clicks: 6,
  whatsapp_clicks: 5,
  email_clicks: 4,
  phone_clicks: 3,
  website_clicks: 2,
  leads: 1,
  conversion_rate: 14.28,
};

describe('ExportButton period contract', () => {
  it('maps the supported presets to their real labels', () => {
    expect(formatExportRangeLabel('7d')).toBe('7 dias');
    expect(formatExportRangeLabel('30d')).toBe('30 dias');
    expect(formatExportRangeLabel('90d')).toBe('90 dias');
    expect(formatExportRangeLabel('custom', { from: new Date(2026, 8, 1), to: new Date(2026, 8, 23) }))
      .toBe('01/09/2026 a 23/09/2026');
  });

  it.each(['7 dias', '30 dias', '90 dias', '01/09/2026 a 23/09/2026'])('descreve o período selecionado: %s', (rangeLabel) => {
    const rows = buildExportSummaryRows(data, rangeLabel);

    expect(rows[0]['Métrica']).toBe(`Visualizações (${rangeLabel})`);
    expect(rows[0]['Valor']).toBe(7);
    expect(buildExportFilename('analytics_summary', 'Empresa Atual', rangeLabel, new Date('2026-09-23T00:00:00Z')))
      .toContain(`Empresa_Atual_${rangeLabel.replace(/[^a-zA-Z0-9À-ÿ]+/g, '_')}_2026-09-23`);
  });
});
