import { Compass } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MagicQuadrant from '../MagicQuadrant';
import type { RankingData } from '@/lib/api';

export function RankingPositioningMap({ quadrant }: { quadrant?: RankingData['quadrant'] }) {
  const meta = quadrant?.meta;
  return (
    <Card className="border-slate-200/80 dark:border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <Compass className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            Mapa de Posicionamento Estratégico (Magic Quadrant)
          </CardTitle>
          <Badge variant="outline" className="text-[10px] font-medium">
            Autoridade × Execução
          </Badge>
        </div>
        <CardDescription>
          {meta?.methodology || 'O mapa estratégico analisa autoridade e capacidade de execução. Critérios e filtros de mapa não alteram o ranking oficial.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {quadrant?.points?.length ? (
          <MagicQuadrant
            data={quadrant.points}
            xAxisLabel={meta?.x_axis_label}
            yAxisLabel={meta?.y_axis_label}
            criterionTitle={meta?.criterion_title}
          />
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Dados insuficientes para mapear o quadrante.
          </p>
        )}
        {meta?.x_axis_definition && meta?.y_axis_definition && (
          <p className="text-xs text-muted-foreground">
            <strong>Eixos:</strong> {meta.x_axis_definition} · {meta.y_axis_definition}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
