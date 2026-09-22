import { Badge } from '@/components/ui/badge';
import type { RankingData } from '@/lib/api';
import { comparisonScopeLabel, formatDate, formatEligiblePopulation } from './ranking-utils';

type Props = { data?: RankingData };

export function RankingContextChips({ data }: Props) {
  const comparisonLabel = comparisonScopeLabel(data?.comparison_scope);
  const population = formatEligiblePopulation(data?.ranking?.population);
  const dataThrough = formatDate(data?.definition?.data_through || data?.quality?.data_through);
  const version = data?.definition?.definition_version;

  return (
    <div className="flex flex-wrap gap-2" aria-label="Contexto do ranking">
      {data?.comparison_scope?.state && <Badge variant="outline">{data.comparison_scope.state}</Badge>}
      {comparisonLabel && <Badge variant="outline">{comparisonLabel}</Badge>}
      {population && <Badge variant="outline">{population}</Badge>}
      {data?.definition?.purpose === 'organic_performance' && <Badge variant="outline">Orgânico</Badge>}
      {dataThrough && <Badge variant="outline">Dados até {dataThrough}</Badge>}
      {version && <Badge variant="outline">Metodologia {version.replace('organic-performance-', 'v')}</Badge>}
      {data?.definition?.sponsored_included === false && <Badge variant="outline">Patrocínio não influencia</Badge>}
    </div>
  );
}
