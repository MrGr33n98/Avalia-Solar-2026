'use client';

import React from 'react';
import { Scale, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RankingMethodologyDialog } from './RankingMethodologyDialog';
import type { RankingData } from '@/lib/api';

interface Props {
  data?: RankingData;
}

export function RankingGovernanceStrip({ data }: Props) {
  const version = data?.definition?.definition_version || 'trust-score-v2';

  return (
    <Card className="border-slate-200/80 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start sm:items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400">
            <Scale className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Governança & Metodologia Oficial IAS
              </span>
              <Badge variant="outline" className="border-blue-200 bg-blue-50 text-[10px] font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
                {version}
              </Badge>
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                <ShieldCheck className="mr-1 h-3 w-3" />
                Zero Pay-to-Win
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
              O Índice Avalia Solar é auditável, público e independente. Planos pagos, patrocínios ou anúncios nunca alteram notas, percentis ou posições no ranking.
            </p>
          </div>
        </div>

        <div className="shrink-0 pt-2 sm:pt-0">
          <RankingMethodologyDialog
            definition={data?.definition}
            quadrantMeta={data?.quadrant?.meta}
            qualityFlags={data?.quality?.flags}
            officialScope={data?.official_scope}
            comparisonScope={data?.comparison_scope}
          />
        </div>
      </CardContent>
    </Card>
  );
}
