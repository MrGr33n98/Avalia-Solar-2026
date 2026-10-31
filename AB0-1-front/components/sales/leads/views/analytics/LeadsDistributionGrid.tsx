'use client';

import React from 'react';
import type { LeadsBreakdowns } from '@/lib/api/sales/types';
import { LeadsBreakdownCard } from './LeadsBreakdownCard';

interface LeadsDistributionGridProps {
  breakdowns: LeadsBreakdowns;
  isLoading?: boolean;
  totalLeads?: number;
}

export function LeadsDistributionGrid({
  breakdowns,
  isLoading,
  totalLeads,
}: LeadsDistributionGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Coluna 1 (Esquerda no Benchmark) */}
      <div className="space-y-4">
        <LeadsBreakdownCard
          title="Responsável"
          items={breakdowns.assignee || []}
          emptyMessage="Nenhum responsável associado aos leads"
          isLoading={isLoading}
          totalLeads={totalLeads}
        />

        <LeadsBreakdownCard
          title="Produtos"
          items={breakdowns.product || []}
          emptyMessage="Nenhum produto vinculado a este conjunto de oportunidades"
          isLoading={isLoading}
          isOptional={true}
          totalLeads={totalLeads}
        />

        <LeadsBreakdownCard
          title="Origem"
          items={breakdowns.source || []}
          emptyMessage="Nenhuma origem informada"
          isLoading={isLoading}
          totalLeads={totalLeads}
        />

        <LeadsBreakdownCard
          title="Concorrentes"
          items={breakdowns.competitor || []}
          emptyMessage="Nenhum concorrente mapeado"
          isLoading={isLoading}
          isOptional={true}
          totalLeads={totalLeads}
        />

        <LeadsBreakdownCard
          title="Idade do Lead"
          items={breakdowns.age || []}
          emptyMessage="Sem dados de idade disponíveis"
          isLoading={isLoading}
          totalLeads={totalLeads}
        />

        <LeadsBreakdownCard
          title="Canal de Aquisição"
          items={breakdowns.channel || []}
          emptyMessage="Nenhum canal de marketing registrado"
          isLoading={isLoading}
          totalLeads={totalLeads}
        />
      </div>

      {/* Coluna 2 (Direita no Benchmark) */}
      <div className="space-y-4">
        <LeadsBreakdownCard
          title="Estágio do Funil"
          items={breakdowns.stage || []}
          emptyMessage="Sem estágios configurados"
          isLoading={isLoading}
          totalLeads={totalLeads}
        />

        <LeadsBreakdownCard
          title="Desfecho (Status)"
          items={breakdowns.outcome || []}
          emptyMessage="Sem desfechos registrados"
          isLoading={isLoading}
          totalLeads={totalLeads}
        />

        <LeadsBreakdownCard
          title="Tags"
          items={breakdowns.tag || []}
          emptyMessage="Nenhuma tag aplicada"
          isLoading={isLoading}
          isOptional={true}
          totalLeads={totalLeads}
        />

        <LeadsBreakdownCard
          title="Território (UF)"
          items={breakdowns.territory || []}
          emptyMessage="Nenhum estado/território informado"
          isLoading={isLoading}
          totalLeads={totalLeads}
        />

        <LeadsBreakdownCard
          title="Faixa de Valor"
          items={breakdowns.value_bracket || []}
          emptyMessage="Sem valores calculados"
          isLoading={isLoading}
          totalLeads={totalLeads}
        />
      </div>
    </div>
  );
}
