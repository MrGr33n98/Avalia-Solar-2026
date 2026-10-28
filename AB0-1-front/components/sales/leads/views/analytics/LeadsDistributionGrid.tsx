'use client';

import React from 'react';
import type { LeadsBreakdowns } from '@/lib/api/sales/types';
import { LeadsBreakdownCard } from './LeadsBreakdownCard';

interface LeadsDistributionGridProps {
  breakdowns: LeadsBreakdowns;
  isLoading?: boolean;
}

export function LeadsDistributionGrid({ breakdowns, isLoading }: LeadsDistributionGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Coluna 1 (Esquerda no Benchmark) */}
      <div className="space-y-4">
        <LeadsBreakdownCard
          title="Assignee"
          items={breakdowns.assignee || []}
          emptyMessage="Nenhum responsável associado aos leads"
          isLoading={isLoading}
        />

        <LeadsBreakdownCard
          title="Product"
          items={breakdowns.product || []}
          emptyMessage="We couldn't find anything with these filters"
          isLoading={isLoading}
        />

        <LeadsBreakdownCard
          title="Source"
          items={breakdowns.source || []}
          emptyMessage="Nenhuma origem informada"
          isLoading={isLoading}
        />

        <LeadsBreakdownCard
          title="Competitor"
          items={breakdowns.competitor || []}
          emptyMessage="Nenhum concorrente mapeado"
          isLoading={isLoading}
        />

        <LeadsBreakdownCard
          title="Age"
          items={breakdowns.age || []}
          emptyMessage="Sem dados de idade disponíveis"
          isLoading={isLoading}
        />

        <LeadsBreakdownCard
          title="Channel"
          items={breakdowns.channel || []}
          emptyMessage="Nenhum canal de marketing registrado"
          isLoading={isLoading}
        />
      </div>

      {/* Coluna 2 (Direita no Benchmark) */}
      <div className="space-y-4">
        <LeadsBreakdownCard
          title="Stage"
          items={breakdowns.stage || []}
          emptyMessage="Sem estágios configurados"
          isLoading={isLoading}
        />

        <LeadsBreakdownCard
          title="Outcome"
          items={breakdowns.outcome || []}
          emptyMessage="Sem desfechos registrados"
          isLoading={isLoading}
        />

        <LeadsBreakdownCard
          title="Tag"
          items={breakdowns.tag || []}
          emptyMessage="Nenhuma tag aplicada"
          isLoading={isLoading}
        />

        <LeadsBreakdownCard
          title="Territory"
          items={breakdowns.territory || []}
          emptyMessage="Nenhum território informado"
          isLoading={isLoading}
        />

        <LeadsBreakdownCard
          title="Value"
          items={breakdowns.value_bracket || []}
          emptyMessage="Sem valores calculados"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
