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

interface ExportButtonProps {
  timeseriesData?: TimeSeriesDataPoint[];
  aggregatedData?: {
    views_30d: number;
    cta_clicks_30d: number;
    whatsapp_clicks_30d: number;
    email_clicks_30d: number;
    phone_clicks_30d: number;
    website_clicks_30d: number;
    leads_30d: number;
    conversion_rate: number;
  };
  companyName?: string;
  disabled?: boolean;
}

export default function ExportButton({
  timeseriesData = [],
  aggregatedData,
  companyName = 'Empresa',
  disabled = false,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const generateTimestampFilename = (prefix: string) => {
    const timestamp = new Date().toISOString().split('T')[0];
    return `${prefix}_${companyName.replace(/\s+/g, '_')}_${timestamp}.csv`;
  };

  const convertToCSV = (data: any[], headers: string[]) => {
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
      const data = [
        { 'Métrica': 'Visualizações (30d)', 'Valor': aggregatedData.views_30d },
        { 'Métrica': 'Total CTAs (30d)', 'Valor': aggregatedData.cta_clicks_30d },
        { 'Métrica': 'WhatsApp (30d)', 'Valor': aggregatedData.whatsapp_clicks_30d },
        { 'Métrica': 'Email (30d)', 'Valor': aggregatedData.email_clicks_30d },
        { 'Métrica': 'Telefone (30d)', 'Valor': aggregatedData.phone_clicks_30d },
        { 'Métrica': 'Website (30d)', 'Valor': aggregatedData.website_clicks_30d },
        { 'Métrica': 'Leads (30d)', 'Valor': aggregatedData.leads_30d },
        { 'Métrica': 'Taxa de Conversão (%)', 'Valor': aggregatedData.conversion_rate },
      ];

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
          Resumo 30 dias (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAll} disabled={!aggregatedData}>
          <Download className="h-[18px] w-[18px] mr-2" />
          Exportar Tudo
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
