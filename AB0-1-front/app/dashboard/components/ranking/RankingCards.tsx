import { Activity, BarChart3, Globe2, MapPinned, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RankingMetric } from '@/lib/api';
import { formatEligiblePopulation, formatPosition } from './ranking-utils';

type CardProps = {
  title: string;
  scope: string;
  metric?: RankingMetric;
  comparison?: boolean;
};

function RankingCard({ title, scope, metric, comparison = false }: CardProps) {
  const Icon = comparison ? MapPinned : Globe2;
  const population = formatEligiblePopulation(metric?.population);
  const unavailable = metric?.status === 'not_applicable';

  return (
    <Card className={comparison ? 'border-brand-blue/30' : 'border-emerald-500/30'}>
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{scope}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-3xl font-bold tabular-nums">
          {unavailable ? 'Não aplicável' : formatPosition(metric?.position, metric?.population)}
        </p>
        {population && <p className="text-sm text-muted-foreground">{population}</p>}
        <div className="grid grid-cols-2 gap-3 border-t pt-3 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground"><Target className="h-3.5 w-3.5" />Percentil</span>
          <strong>{metric?.percentile == null ? '—' : `${Number(metric.percentile).toFixed(1)}%`}</strong>
          <span className="flex items-center gap-1.5 text-muted-foreground"><Activity className="h-3.5 w-3.5" />Score</span>
          <strong>{metric?.score == null ? '—' : `${Number(metric.score).toFixed(1)} pts`}</strong>
        </div>
        {unavailable && <p className="text-xs text-muted-foreground">O critério selecionado altera somente o mapa de posicionamento.</p>}
      </CardContent>
    </Card>
  );
}

export function OfficialRankingCard({ metric, scope }: Omit<CardProps, 'title' | 'comparison'>) {
  return <RankingCard title="Ranking oficial" scope={scope} metric={metric} />;
}

export function ComparisonRankingCard({ metric, scope }: Omit<CardProps, 'title' | 'comparison'>) {
  return <RankingCard title="Comparação atual" scope={scope} metric={metric} comparison />;
}

export function ScoreSummary({ metric }: { metric?: RankingMetric }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-5">
        <BarChart3 className="h-5 w-5 text-brand-blue" />
        <div>
          <p className="text-sm text-muted-foreground">Pontuação orgânica atual</p>
          <p className="text-2xl font-bold">{metric?.score == null ? '—' : `${Number(metric.score).toFixed(1)} pts`}</p>
        </div>
      </CardContent>
    </Card>
  );
}
