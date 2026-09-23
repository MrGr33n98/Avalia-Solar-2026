import { Compass } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PositioningData, PositioningPoint, RankingData } from '@/lib/api';
import MagicQuadrant from '../MagicQuadrant';

type PositioningMeta = {
  x_axis_label?: string;
  y_axis_label?: string;
  x_axis_definition?: string;
  y_axis_definition?: string;
  criterion_title?: string;
  methodology?: string;
};

function scopeLabel(scope: PositioningData['resolved_scope']) {
  if (!scope) return 'população global';
  if (scope.type === 'city' && scope.city) return scope.city;
  if (scope.type === 'state' && scope.state) return scope.state;
  if (scope.type === 'sector' && scope.sector) return scope.sector;
  if (scope.type === 'category') return 'categoria selecionada';
  return 'população global';
}

function score(
  point: PositioningPoint | undefined,
  axis: 'x_score' | 'y_score',
  legacy: 'completeness_of_vision' | 'ability_to_execute'
) {
  return point?.[axis] ?? point?.[legacy] ?? null;
}

function Breakdown({ title, values }: { title: string; values?: Record<string, number> }) {
  if (!values) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {Object.entries(values).map(([key, value]) => (
          <div key={key} className="flex justify-between gap-3 text-xs">
            <span className="capitalize text-muted-foreground">{key.replaceAll('_', ' ')}</span>
            <span className="font-medium tabular-nums">{value.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RankingPositioningMap({ quadrant }: { quadrant?: RankingData['quadrant'] }) {
  const meta = quadrant?.meta as PositioningMeta | undefined;
  const current = quadrant?.points?.find((point) => point.is_current_company);
  const thresholds = quadrant?.thresholds;
  const xValue = score(current, 'x_score', 'completeness_of_vision');
  const yValue = score(current, 'y_score', 'ability_to_execute');
  const isInsufficient = quadrant?.status === 'insufficient_sample';
  const isUnavailable =
    quadrant?.status === 'locked' ||
    quadrant?.status === 'error' ||
    quadrant?.status === 'processing';
  const resolvedLabel = scopeLabel(quadrant?.resolved_scope);
  const population = quadrant?.population;

  return (
    <Card className="border-slate-200/80 dark:border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <Compass className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Mapa de Posicionamento Avalia Solar
            </CardTitle>
            <CardDescription className="mt-1">
              Compare sua Autoridade de Confiança e Poder de Execução com empresas elegíveis no
              mesmo contexto.
            </CardDescription>
          </div>
          <Badge variant="outline" className="w-fit text-[10px] font-medium">
            positioning-v1
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2 pt-2 text-xs text-muted-foreground">
          <span>{population?.eligible ?? 0} empresas comparáveis</span>
          <span aria-hidden="true">·</span>
          <span>Escopo: {resolvedLabel}</span>
          <span aria-hidden="true">·</span>
          <span>Corte: mediana da população</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {quadrant?.fallback?.active && (
          <div
            role="status"
            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100"
          >
            Não havia amostra suficiente no escopo solicitado. A comparação foi ampliada para{' '}
            {resolvedLabel}.
          </div>
        )}
        {isInsufficient && (
          <div
            role="status"
            className="rounded-lg border border-border/60 bg-muted/30 px-4 py-10 text-center"
          >
            <p className="font-medium">
              Ainda não há empresas suficientes neste escopo para uma comparação estatisticamente
              útil.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {population?.eligible ?? 0} empresas encontradas; mínimo necessário:{' '}
              {population?.minimum_required ?? 0}.
            </p>
          </div>
        )}
        {isUnavailable && (
          <div
            role="status"
            className="rounded-lg border border-border/60 bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground"
          >
            {quadrant?.status === 'error'
              ? 'Não foi possível calcular o mapa de posicionamento.'
              : 'O mapa de posicionamento ainda não está disponível.'}
          </div>
        )}
        {quadrant?.status === 'ready' && (
          <MagicQuadrant
            data={quadrant.points}
            thresholds={thresholds}
            populationSize={population?.eligible}
            resolvedScope={resolvedLabel}
            xAxisLabel={meta?.x_axis_label}
            yAxisLabel={meta?.y_axis_label}
            criterionTitle={meta?.criterion_title}
          />
        )}
        {quadrant?.status === 'ready' &&
          thresholds?.x_threshold != null &&
          thresholds.y_threshold != null && (
            <p className="text-xs text-muted-foreground">
              Os cortes representam as medianas da população comparável selecionada:{' '}
              {thresholds.x_threshold.toFixed(1)} em Autoridade e{' '}
              {thresholds.y_threshold.toFixed(1)} em Execução.
            </p>
          )}
        {current &&
          xValue != null &&
          yValue != null &&
          thresholds?.x_threshold != null &&
          thresholds.y_threshold != null && (
            <div
              className="space-y-3 rounded-xl border border-border/60 p-4"
              aria-label="Por que estou aqui?"
            >
              <div>
                <p className="font-semibold">Por que estou aqui?</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {current.quadrant_label || 'Posicionamento atual'} · {xValue.toFixed(1)} de
                  Autoridade (
                  {(xValue - thresholds.x_threshold >= 0 ? '+' : '') +
                    (xValue - thresholds.x_threshold).toFixed(1)}{' '}
                  vs. mediana) · {yValue.toFixed(1)} de Execução (
                  {(yValue - thresholds.y_threshold >= 0 ? '+' : '') +
                    (yValue - thresholds.y_threshold).toFixed(1)}{' '}
                  vs. mediana)
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Breakdown title="Autoridade" values={current.x_breakdown} />
                <Breakdown title="Execução" values={current.y_breakdown} />
              </div>
            </div>
          )}
        {meta?.x_axis_definition && meta?.y_axis_definition && (
          <p className="text-xs text-muted-foreground">
            <strong>Eixos:</strong> {meta.x_axis_definition} · {meta.y_axis_definition}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          O Mapa de Posicionamento é uma análise comparativa complementar. Ele não altera nem
          determina sua posição no Ranking Performance orgânico.
        </p>
      </CardContent>
    </Card>
  );
}
