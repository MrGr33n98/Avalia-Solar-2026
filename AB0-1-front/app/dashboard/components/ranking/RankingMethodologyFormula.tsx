import { Equal, Info, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function FormulaTerm({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow: string;
  title: string;
  description: string;
  className: string;
}) {
  return (
    <Card className={`border-border/60 shadow-sm ${className}`}>
      <CardContent className="space-y-1.5 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {eyebrow}
        </p>
        <p className="font-semibold tracking-tight">{title}</p>
        <p className="text-sm leading-5 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export function RankingMethodologyFormula() {
  return (
    <div className="space-y-6">
      <section aria-labelledby="ranking-formula-title" className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 id="ranking-formula-title" className="text-xl font-semibold tracking-tight">
            Como a pontuação é formada
          </h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="rounded-full text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Saiba mais sobre o peso do engajamento"
                >
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                Interações mais antigas têm peso relativo menor no cálculo.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
          <FormulaTerm
            eyebrow="Trust Score · 0–100"
            title="Confiança"
            description="Reputação e credibilidade formam a base principal."
            className="bg-emerald-50/50 dark:bg-emerald-950/15"
          />
          <p
            className="text-center text-lg font-semibold text-muted-foreground"
            aria-label="multiplicado por dez"
          >
            × 10
          </p>
          <div className="space-y-3 lg:space-y-0">
            <p
              className="text-center text-lg font-semibold text-muted-foreground"
              aria-label="mais"
            >
              +
            </p>
            <FormulaTerm
              eyebrow="Últimos 7 dias completos"
              title="Engajamento recente"
              description="Sinais mais recentes ajudam a diferenciar empresas semelhantes."
              className="bg-violet-50/50 dark:bg-violet-950/15"
            />
          </div>
          <Equal className="mx-auto h-5 w-5 text-muted-foreground" aria-label="resulta em" />
          <FormulaTerm
            eyebrow="Ordenação orgânica"
            title="Ranking Score"
            description="Usado para organizar a população elegível."
            className="bg-blue-50/60 dark:bg-blue-950/20"
          />
        </div>

        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Na prática, a confiança é a base principal. O desempenho recente atua como diferenciador
          entre empresas com níveis semelhantes de confiança.
        </p>
      </section>

      <Separator />

      <section aria-labelledby="recent-engagement-title" className="space-y-4">
        <div>
          <h3 id="recent-engagement-title" className="text-xl font-semibold tracking-tight">
            Engajamento recente, sem surpresa
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            O sistema considera os últimos 7 dias completos. O dia atual não entra para evitar
            distorções por dados parciais.
          </p>
        </div>
        <Card className="border-border/60 bg-muted/20 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Mais recente</span>
              <span>Mais antigo</span>
            </div>
            <div
              className="grid grid-cols-7 gap-2"
              aria-label="Linha do tempo de peso do engajamento recente"
            >
              {[
                ['-1d', 'h-10'],
                ['-2d', 'h-8'],
                ['-3d', 'h-7'],
                ['-4d', 'h-6'],
                ['-5d', 'h-5'],
                ['-6d', 'h-4'],
                ['-7d', 'h-3'],
              ].map(([label, height]) => (
                <div key={label} className="flex min-w-0 flex-col items-center gap-2">
                  <div className="flex h-10 items-end">
                    <span className={`w-full min-w-3 rounded-sm bg-violet-500/55 ${height}`} />
                  </div>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Interações mais recentes recebem peso maior.
            </p>
          </CardContent>
        </Card>
      </section>

      <Card className="border-dashed border-border/70 bg-muted/20 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <Badge variant="secondary">Exemplo ilustrativo</Badge>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
            <div>
              <p className="text-muted-foreground">Trust Score</p>
              <p className="text-lg font-semibold">78 × 10 = 780</p>
            </div>
            <Plus className="hidden h-4 w-4 text-muted-foreground sm:block" />
            <div>
              <p className="text-muted-foreground">Engajamento</p>
              <p className="text-lg font-semibold">+42</p>
            </div>
            <Equal className="hidden h-4 w-4 text-muted-foreground sm:block" />
            <div>
              <p className="text-muted-foreground">Ranking Score</p>
              <p className="text-lg font-semibold">822 pts</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Os valores acima não representam dados reais da sua empresa.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
