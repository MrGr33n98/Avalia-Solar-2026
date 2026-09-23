import { ArrowDown, ArrowUp, Equal, LineChart, UsersRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RankingData } from '@/lib/api';

function signed(value: number, suffix = '') {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}${suffix}`;
}

export function RankingEvidence({ data }: { data?: RankingData }) {
  const drivers = data?.score_drivers;
  const changes = data?.changes;
  const gaps = data?.gaps || [];

  return (
    <section className="grid gap-5 xl:grid-cols-3" aria-label="Evidências do ranking">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Componentes do score</CardTitle>
          <CardDescription>
            {drivers?.source === 'official_snapshot' ? 'Snapshot oficial utilizado na posição.' : 'Score atual da comparação.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {drivers?.status === 'ready' && drivers.items.length ? drivers.items.map((item) => (
            <div key={item.code} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm">
              <span>{item.label}</span><strong>{item.value.toFixed(2)}</strong>
            </div>
          )) : <p className="text-sm text-muted-foreground">A composição detalhada não está disponível para este dado.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><LineChart className="h-4 w-4" />O que mudou</CardTitle>
          <CardDescription>Comparação entre os dois últimos snapshots oficiais.</CardDescription>
        </CardHeader>
        <CardContent>
          {changes?.status === 'ready' ? (
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">{changes.from} → {changes.to}</p>
              <ChangeRow label="Posição" value={changes.changes.position} invertDirection />
              <ChangeRow label="Score" value={changes.changes.score} suffix=" pts" />
              <ChangeRow label="Percentil" value={changes.changes.percentile} suffix=" p.p." />
            </div>
          ) : <p className="text-sm text-muted-foreground">O histórico oficial ainda está em formação para comparar mudanças.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lacunas de dados</CardTitle>
          <CardDescription>Mostradas somente quando há evidência no contrato.</CardDescription>
        </CardHeader>
        <CardContent>
          {gaps.length ? gaps.map((gap) => <div key={gap.code} className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-sm dark:border-amber-900/40 dark:bg-amber-950/20"><p className="font-medium">{gap.title}</p><p className="mt-1 text-muted-foreground">{gap.description}</p></div>) : <p className="text-sm text-muted-foreground">Nenhuma lacuna comprovada para este escopo.</p>}
        </CardContent>
      </Card>
    </section>
  );
}

export function RankingNearbyCompetitors({
  leaders = [],
  neighbors = [],
  currentScore,
  currentPosition,
}: Pick<RankingData, 'leaders' | 'neighbors'> & { currentScore?: number | null; currentPosition?: number | null }) {
  const rows = [...leaders, ...neighbors].filter(
    (point, index, all) => !point.is_current_company && all.findIndex((item) => item.id === point.id) === index
  );
  if (!rows.length) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <UsersRound className="h-4 w-4 text-brand-blue" />
          Empresas próximas no ranking
        </CardTitle>
        <CardDescription>Vizinhos imediatos e referências da mesma população elegível.</CardDescription>
      </CardHeader>
      <CardContent className="divide-y rounded-lg border">
        {rows.map((point) => {
          const diff = currentScore != null && point.ranking_score != null ? point.ranking_score - currentScore : null;
          const isAbove = currentPosition != null && point.ranking_position != null && point.ranking_position < currentPosition;
          return (
            <div key={point.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{point.name}</p>
                {diff != null ? (
                  <p className="text-xs text-muted-foreground">
                    {diff > 0
                      ? `▲ a ${diff.toFixed(1)} pts de distância`
                      : diff < 0
                        ? `▼ sua vantagem: ${Math.abs(diff).toFixed(1)} pts`
                        : 'empate em pontos'}
                  </p>
                ) : currentPosition != null && point.ranking_position != null ? (
                  <p className="text-xs text-muted-foreground">
                    {isAbove ? '▲ à sua frente no ranking' : '▼ atrás de você no ranking'}
                  </p>
                ) : null}
              </div>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                #{point.ranking_position ?? '—'} · {point.ranking_score == null ? '—' : `${point.ranking_score.toFixed(1)} pts`}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function ChangeRow({
  label,
  value,
  suffix = '',
  invertDirection = false,
}: {
  label: string;
  value: number;
  suffix?: string;
  invertDirection?: boolean;
}) {
  // O backend calcula position_change como previous - current (+ significa melhora de posição)
  const favorable = invertDirection ? value < 0 : value > 0;
  const Icon = value === 0 ? Equal : favorable ? ArrowUp : ArrowDown;
  return (
    <p className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
      <span>{label}</span>
      <span className={`flex items-center gap-1 font-medium ${value === 0 ? 'text-muted-foreground' : favorable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
        <Icon className="h-3.5 w-3.5" />
        {signed(value, suffix)}
      </span>
    </p>
  );
}
