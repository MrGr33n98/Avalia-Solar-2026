'use client';

import React from 'react';
import type { ReviewerBrandSummary } from '@/lib/api/reviewer-brand-usages';

export interface BrandMetricStripProps {
  summary: ReviewerBrandSummary | null;
  loading: boolean;
  hasError: boolean;
}

export function BrandMetricStrip({
  summary,
  loading,
  hasError,
}: BrandMetricStripProps) {
  const formatValue = (val: number | undefined): string => {
    if (loading || hasError || val === undefined) return '—';
    return String(val);
  };

  const metrics = [
    {
      id: 'total_brands',
      label: 'Marcas distintas',
      value: formatValue(summary?.total_brands),
      indicatorColor: 'bg-[#17468D]',
      tooltip: 'Fabricantes canônicos únicos com os quais você trabalha',
    },
    {
      id: 'total_usages',
      label: 'Declarações ativas',
      value: formatValue(summary?.total_usages),
      indicatorColor: 'bg-blue-500',
      tooltip: 'Total de vínculos de marcas por contexto de atuação',
    },
    {
      id: 'verified',
      label: 'Verificadas',
      value: formatValue(summary?.verified_usages),
      indicatorColor: 'bg-emerald-600',
      tooltip: 'Marcas com comprovação documental ou técnica homologada',
    },
    {
      id: 'public',
      label: 'Públicas no Creator',
      value: formatValue(summary?.public_usages),
      indicatorColor: 'bg-sky-500',
      tooltip: 'Marcas com consentimento ativo para exibição no perfil público',
    },
  ];

  return (
    <section
      aria-label="Indicadores consolidados de marcas"
      className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4"
    >
      {metrics.map((m) => (
        <div
          key={m.id}
          className="bg-white border border-slate-200 rounded p-2.5 flex flex-col justify-between"
          title={m.tooltip}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className={`w-1.5 h-1.5 rounded-sm ${m.indicatorColor} flex-shrink-0`}
              aria-hidden="true"
            />
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider truncate">
              {m.label}
            </span>
          </div>

          <p className="text-lg font-bold text-slate-900 tracking-tight leading-none mt-0.5">
            {m.value}
          </p>
        </div>
      ))}
    </section>
  );
}
