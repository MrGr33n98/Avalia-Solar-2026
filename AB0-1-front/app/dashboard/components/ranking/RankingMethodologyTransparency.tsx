import { CalendarClock, Check, GitCompareArrows, Info, MapPinned, ShieldCheck } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { RankingData } from '@/lib/api';
import { formatDate, translatedQualityFlags } from './ranking-utils';

function DateValue({ value, fallback }: { value?: string | null; fallback: string }) {
  return (
    <p className="mt-1 text-base font-semibold tracking-tight">{formatDate(value) || fallback}</p>
  );
}

export function RankingMethodologyTransparency({
  definition,
  quadrantMeta,
  qualityFlags,
  compact = false,
}: {
  definition?: RankingData['definition'];
  quadrantMeta?: RankingData['quadrant_meta'];
  qualityFlags?: string[];
  compact?: boolean;
}) {
  const isIndependent = definition?.sponsored_included === false;
  const qualityLabels = translatedQualityFlags(qualityFlags);

  return (
    <div className="space-y-6">
      <section aria-labelledby="ranking-tie-breaker-title">
        <h3 id="ranking-tie-breaker-title" className="text-xl font-semibold tracking-tight">
          Como funciona o desempate
        </h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Em caso de empate, aplicamos critérios sucessivos para manter a ordenação determinística.
        </p>
        <ol
          className="mt-4 grid gap-2 sm:grid-cols-4"
          aria-label="Ordem dos critérios de desempate"
        >
          {['Ranking Score', 'Trust Score', 'Número de avaliações', 'Critério técnico estável'].map(
            (item, index) => (
              <li key={item} className="rounded-xl border border-border/60 bg-muted/20 p-3 text-sm">
                <span className="mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-background text-xs font-semibold shadow-sm">
                  {index + 1}
                </span>
                <span className="font-medium">{item}</span>
              </li>
            )
          )}
        </ol>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Detalhe técnico <Info className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              O último critério mantém a ordem estável para sistemas e auditoria.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </section>

      {!compact && (
        <Card className="border-emerald-200/80 bg-emerald-50/45 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <CardContent className="flex gap-3 p-4 sm:p-5">
            <ShieldCheck
              className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400"
              aria-hidden="true"
            />
            <div>
              <h3 className="font-semibold tracking-tight">Independente por design</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {isIndependent
                  ? 'Planos comerciais, anúncios e patrocínio não alteram a posição orgânica.'
                  : 'A confirmação de independência será exibida quando o snapshot oficial estiver disponível.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!compact && (
        <section aria-labelledby="ranking-dates-title" className="space-y-4">
          <div>
            <h3 id="ranking-dates-title" className="text-xl font-semibold tracking-tight">
              Datas e transparência
            </h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Cada número indica claramente qual período representa e quando foi calculado.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="border-border/60 shadow-sm">
              <CardContent className="flex gap-3 p-4">
                <CalendarClock className="mt-0.5 h-5 w-5 text-brand-blue" aria-hidden="true" />
                <div>
                  <p className="text-sm text-muted-foreground">Dados até</p>
                  <DateValue value={definition?.data_through} fallback="Aguardando snapshot" />
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Último dia incluído na análise.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60 shadow-sm">
              <CardContent className="flex gap-3 p-4">
                <CalendarClock className="mt-0.5 h-5 w-5 text-brand-blue" aria-hidden="true" />
                <div>
                  <p className="text-sm text-muted-foreground">Calculado em</p>
                  <DateValue value={definition?.computed_at} fallback="Aguardando snapshot" />
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Momento em que o snapshot oficial foi gerado.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="border-border/60 bg-muted/20 shadow-sm">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm text-muted-foreground">Metodologia</p>
                <p className="font-semibold tracking-tight">
                  {definition?.definition_version || 'Aguardando snapshot oficial'}
                </p>
              </div>
              {qualityLabels.length > 0 && (
                <div className="flex flex-wrap gap-2" aria-label="Status de qualidade dos dados">
                  {qualityLabels.map((label) => (
                    <Badge key={label} variant="secondary">
                      {label}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {!compact && <Separator />}

      {!compact && (
        <section aria-labelledby="positioning-map-title" className="space-y-3">
          <div className="flex gap-3">
            <MapPinned className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" aria-hidden="true" />
            <div>
              <h3 id="positioning-map-title" className="font-semibold tracking-tight">
                Mapa de posicionamento
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                O mapa utiliza eixos analíticos próprios e ajuda a interpretar confiança, reputação,
                engajamento e capacidade de execução.
              </p>
            </div>
          </div>
          {(quadrantMeta?.x_axis_definition || quadrantMeta?.y_axis_definition) && (
            <div className="grid gap-2 rounded-xl border border-border/60 bg-muted/20 p-3 text-sm sm:grid-cols-2">
              <p>
                <span className="font-medium">Eixo X:</span>{' '}
                {quadrantMeta.x_axis_definition || 'Autoridade de confiança.'}
              </p>
              <p>
                <span className="font-medium">Eixo Y:</span>{' '}
                {quadrantMeta.y_axis_definition || 'Poder de execução.'}
              </p>
            </div>
          )}
          <div className="flex items-start gap-2 rounded-lg border border-blue-200/70 bg-blue-50/45 p-3 text-sm text-muted-foreground dark:border-blue-900/50 dark:bg-blue-950/20">
            <GitCompareArrows
              className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue"
              aria-hidden="true"
            />
            <p>O mapa não define sua posição oficial no ranking orgânico.</p>
          </div>
        </section>
      )}

      {!compact && (
        <Accordion type="single" collapsible className="rounded-xl border border-border/60 px-4">
          <AccordionItem value="methodology-details" className="border-none">
            <AccordionTrigger>Ver detalhes de metodologia</AccordionTrigger>
            <AccordionContent className="space-y-2 text-muted-foreground">
              <p>
                <Check className="mr-2 inline h-4 w-4 text-emerald-600" aria-hidden="true" />
                {definition?.score_definition ||
                  'A definição detalhada será exibida quando o snapshot estiver disponível.'}
              </p>
              <p>
                {definition?.eligibility_definition ||
                  'A população elegível é determinada pelo escopo e pelos dados de ranking calculados.'}
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
