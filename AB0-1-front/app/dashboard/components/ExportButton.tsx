/**
 * ExportButton Component
 * 
 * Exporta dados de analytics para CSV
 * Formata dados de TimeSeriesChart e métricas agregadas
 */

'use client';

import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';

interface TimeSeriesDataPoint {
  date: string;
  profile_views: number;
  cta_clicks: number;
  whatsapp_clicks: number;
  email_clicks: number;
  phone_clicks: number;
  website_clicks: number;
  leads: number;
}

export type ExportRangeLabel = string;

export interface ExportSummaryData {
  views: number;
  cta_clicks: number;
  whatsapp_clicks: number;
  email_clicks: number;
  phone_clicks: number;
  website_clicks: number;
  leads: number;
  conversion_rate: number;
}

export const buildExportFilename = (prefix: string, companyName: string, rangeLabel: string, date = new Date()) => {
  const timestamp = date.toISOString().split('T')[0];
  const scope = rangeLabel.replace(/[^a-zA-Z0-9À-ÿ]+/g, '_').replace(/^_|_$/g, '');
  return `${prefix}_${companyName.replace(/\s+/g, '_')}_${scope}_${timestamp}.csv`;
};

export const buildExportSummaryRows = (aggregatedData: ExportSummaryData, rangeLabel: string) => [
  { 'Métrica': `Visualizações (${rangeLabel})`, 'Valor': aggregatedData.views },
  { 'Métrica': `Total CTAs (${rangeLabel})`, 'Valor': aggregatedData.cta_clicks },
  { 'Métrica': `WhatsApp (${rangeLabel})`, 'Valor': aggregatedData.whatsapp_clicks },
  { 'Métrica': `Email (${rangeLabel})`, 'Valor': aggregatedData.email_clicks },
  { 'Métrica': `Telefone (${rangeLabel})`, 'Valor': aggregatedData.phone_clicks },
  { 'Métrica': `Website (${rangeLabel})`, 'Valor': aggregatedData.website_clicks },
  { 'Métrica': `Leads (${rangeLabel})`, 'Valor': aggregatedData.leads },
  { 'Métrica': `Taxa de Conversão (%) (${rangeLabel})`, 'Valor': aggregatedData.conversion_rate },
];

export interface ExportButtonProps {
  timeseriesData?: TimeSeriesDataPoint[];
  aggregatedData?: ExportSummaryData;
  companyName: string;
  rangeLabel: ExportRangeLabel;
  disabled?: boolean;
}

export default function ExportButton({
  timeseriesData = [],
  aggregatedData,
  companyName,
  rangeLabel,
  disabled = false,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const generateTimestampFilename = (prefix: string) => {
    return buildExportFilename(prefix, companyName, rangeLabel);
  };

  const convertToCSV = (data: Array<Record<string, string | number>>, headers: string[]) => {
    const headerRow = headers.join(',');
    const rows = data.map((row) =>
      headers.map((header) => {
        const value = row[header] ?? '';
        // Escape commas and quotes
        return typeof value === 'string' && value.includes(',')
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      }).join(',')
    );
    return [headerRow, ...rows].join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportTimeseries = async () => {
    setIsExporting(true);
    try {
      const headers = [
        'Data',
        'Visualizações',
        'CTAs Total',
        'WhatsApp',
        'Email',
        'Telefone',
        'Website',
        'Leads',
      ];

      const formattedData = timeseriesData.map((point) => ({
        Data: new Date(point.date).toLocaleDateString('pt-BR'),
        'Visualizações': point.profile_views,
        'CTAs Total': point.cta_clicks,
        'WhatsApp': point.whatsapp_clicks,
        'Email': point.email_clicks,
        'Telefone': point.phone_clicks,
        'Website': point.website_clicks,
        'Leads': point.leads,
      }));

      const csv = convertToCSV(formattedData, headers);
      downloadCSV(csv, generateTimestampFilename('analytics_timeseries'));
    } catch (error) {
      console.error('Failed to export timeseries:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportSummary = async () => {
    setIsExporting(true);
    try {
      if (!aggregatedData) return;

      const headers = ['Métrica', 'Valor'];
      const data = buildExportSummaryRows(aggregatedData, rangeLabel);

      const csv = convertToCSV(data, headers);
      downloadCSV(csv, generateTimestampFilename('analytics_summary'));
    } catch (error) {
      console.error('Failed to export summary:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportAll = async () => {
    await exportTimeseries();
    await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay between exports
    await exportSummary();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isExporting || timeseriesData.length === 0}
        >
          {isExporting ? (
            <Loader2 className="h-[18px] w-[18px] mr-2 animate-spin" />
          ) : (
            <Download className="h-[18px] w-[18px] mr-2" />
          )}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportTimeseries}>
          <Download className="h-[18px] w-[18px] mr-2" />
          Série Temporal (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportSummary} disabled={!aggregatedData}>
          <Download className="h-[18px] w-[18px] mr-2" />
          Resumo do período (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAll} disabled={!aggregatedData}>
          <Download className="h-[18px] w-[18px] mr-2" />
          Exportar Tudo
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
