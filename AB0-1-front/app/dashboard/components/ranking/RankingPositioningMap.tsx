import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MagicQuadrant from '../MagicQuadrant';
import type { RankingData } from '@/lib/api';

export function RankingPositioningMap({ quadrant }: { quadrant?: RankingData['quadrant'] }) {
  const meta = quadrant?.meta;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapa de posicionamento</CardTitle>
        <CardDescription>{meta?.methodology || 'O mapa não define a posição do ranking orgânico oficial.'}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {quadrant?.points?.length ? (
          <MagicQuadrant
            data={quadrant.points}
            xAxisLabel={meta?.x_axis_label}
            yAxisLabel={meta?.y_axis_label}
            criterionTitle={meta?.criterion_title}
          />
        ) : <p className="py-12 text-center text-sm text-muted-foreground">Dados insuficientes para mapear o quadrante.</p>}
        {meta?.x_axis_definition && meta?.y_axis_definition && (
          <p className="text-xs text-muted-foreground">X: {meta.x_axis_definition} Y: {meta.y_axis_definition}</p>
        )}
      </CardContent>
    </Card>
  );
}
