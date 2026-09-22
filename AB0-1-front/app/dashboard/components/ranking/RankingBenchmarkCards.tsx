import { ChartNoAxesCombined } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RankingData } from '@/lib/api';

export function RankingBenchmarkCards({ benchmarks }: { benchmarks?: RankingData['benchmarks'] }) {
  if (!benchmarks || benchmarks.status === 'empty') return null;

  if (benchmarks.status === 'insufficient_sample') {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          Amostra insuficiente para benchmark: {benchmarks.population} de pelo menos {benchmarks.minimum_population} empresas elegíveis.
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    ['Mediana', benchmarks.median_score],
    ['P75', benchmarks.p75_score],
    ['P90', benchmarks.p90_score],
  ];
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><ChartNoAxesCombined className="h-4 w-4" />Benchmark da população elegível</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-semibold">{value == null ? '—' : `${Number(value).toFixed(1)} pts`}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
