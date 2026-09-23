'use client';

import Link from 'next/link';
import {
  BarChart3,
  CheckCircle2,
  CircleHelp,
  Database,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { RankingData } from '@/lib/api';
import { formatDate } from './ranking-utils';
import { RankingMethodologyFormula } from './RankingMethodologyFormula';
import { RankingMethodologyTransparency } from './RankingMethodologyTransparency';

type RankingMethodologyDialogProps = {
  definition?: RankingData['definition'];
  quadrantMeta?: RankingData['quadrant_meta'];
  qualityFlags?: string[];
  officialScope?: RankingData['official_scope'];
  comparisonScope?: RankingData['comparison_scope'];
};

const overviewPrinciples = [
  {
    title: 'Transparente',
    description: 'Mesma regra para todas as empresas.',
    icon: CheckCircle2,
  },
  {
    title: 'Baseado em dados reais',
    description: 'Sem influência comercial.',
    icon: Database,
  },
  {
    title: 'Confiança primeiro',
    description: 'Reputação e credibilidade têm peso central.',
    icon: ShieldCheck,
  },
  {
    title: 'Atualização recorrente',
    description: 'Novos dados entram nos ciclos de processamento.',
    icon: RefreshCw,
  },
];

const eligibilityItems = [
  'Empresa ativa no Avalia Solar',
  'Ranking Score calculado',
  'Categoria compatível, quando aplicável',
  'Atende aos filtros selecionados',
];

function EligibilitySection() {
  return (
    <section aria-labelledby="ranking-eligibility-title" className="space-y-4">
      <div>
        <h3 id="ranking-eligibility-title" className="text-xl font-semibold tracking-tight">
          Quem entra no ranking?
        </h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          A posição é calculada dentro de uma população de empresas elegíveis.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2" aria-label="Critérios de elegibilidade">
        {eligibilityItems.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 rounded-xl border border-border/60 bg-muted/20 p-3 text-sm"
          >
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
        Por isso, o número de empresas elegíveis pode ser menor que o total de empresas cadastradas.
      </div>
    </section>
  );
}

function RankingContexts({
  officialScope,
  comparisonScope,
}: Pick<RankingMethodologyDialogProps, 'officialScope' | 'comparisonScope'>) {
  const hasComparison = Boolean(comparisonScope?.active);
  const officialLabel = officialScope?.type === 'category' ? 'Categoria oficial' : 'Brasil';

  return (
    <section aria-labelledby="ranking-contexts-title" className="space-y-4">
      <div>
        <h3 id="ranking-contexts-title" className="text-xl font-semibold tracking-tight">
          Ranking oficial e comparação
        </h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Os dois contextos têm finalidades diferentes e aparecem separados no dashboard.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="space-y-3 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-semibold tracking-tight">Ranking oficial</h4>
              <Badge variant="secondary">Snapshot persistido</Badge>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              É a posição oficial em {officialLabel}, atualizada pelo pipeline de ranking e
              acompanhada por histórico.
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-muted/20 shadow-sm">
          <CardContent className="space-y-3 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-semibold tracking-tight">Mapa de posicionamento</h4>
              <Badge variant="outline">Calculada em tempo real</Badge>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {hasComparison
                ? 'Usa eixos próprios de Autoridade de Confiança e Poder de Execução, com cortes relativos à população comparável, sem alterar o ranking oficial.'
                : 'Pode considerar estado, cidade, setor ou critério, sem alterar o ranking oficial.'}
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="flex items-start gap-2 rounded-xl border border-blue-200/70 bg-blue-50/45 p-4 text-sm leading-6 text-muted-foreground dark:border-blue-900/50 dark:bg-blue-950/20">
        <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" aria-hidden="true" />
        <p>Uma comparação regional em SC não substitui nem modifica sua posição oficial.</p>
      </div>
    </section>
  );
}

export function RankingMethodologyDialog({
  definition,
  quadrantMeta,
  qualityFlags,
  officialScope,
  comparisonScope,
}: RankingMethodologyDialogProps) {
  const dataThrough = formatDate(definition?.data_through);
  const isIndependent = definition?.sponsored_included === false;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CircleHelp className="mr-2 h-4 w-4" aria-hidden="true" />
          Como funciona o ranking?
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[95vh] w-[calc(100%-1rem)] max-w-5xl flex-col gap-0 overflow-hidden rounded-2xl border-border/60 bg-background p-0 shadow-2xl sm:max-h-[88vh] sm:w-full">
        <DialogHeader className="shrink-0 border-b border-border/60 px-5 py-5 pr-14 text-left sm:px-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Badge variant="secondary" className="mb-3 w-fit tracking-[0.12em]">
                METODOLOGIA
              </Badge>
              <DialogTitle className="text-2xl leading-tight sm:text-3xl">
                Como funciona o ranking orgânico?
              </DialogTitle>
              <DialogDescription className="mt-2 max-w-2xl leading-6">
                Entenda, em poucos passos, como o Avalia Solar transforma sinais reais de confiança
                e desempenho em uma posição de mercado.
              </DialogDescription>
            </div>
            <Card className="w-fit shrink-0 border-border/60 bg-muted/20 shadow-sm">
              <CardContent className="p-3">
                <p className="text-xs font-medium text-muted-foreground">Versão atual</p>
                <p className="mt-1 text-sm font-semibold tracking-tight">
                  {definition?.definition_version || 'Aguardando snapshot oficial'}
                </p>
                {dataThrough && (
                  <p className="mt-1 text-xs text-muted-foreground">Dados até {dataThrough}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-border/60 px-5 py-3 sm:px-7">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-muted/60 sm:flex sm:w-fit">
              <TabsTrigger value="overview">Visão geral</TabsTrigger>
              <TabsTrigger value="formula">Fórmula</TabsTrigger>
              <TabsTrigger value="criteria">Critérios</TabsTrigger>
              <TabsTrigger value="transparency">Transparência</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <TabsContent value="overview" className="m-0 px-5 py-6 sm:px-7 sm:py-7">
              <div className="space-y-8">
                <section aria-labelledby="ranking-overview-title" className="space-y-4">
                  <div>
                    <h3
                      id="ranking-overview-title"
                      className="text-xl font-semibold tracking-tight"
                    >
                      O que é o ranking orgânico?
                    </h3>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                      O ranking orgânico mede o desempenho das empresas no Avalia Solar com base em
                      sinais de confiança e desempenho recente.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {overviewPrinciples.map(({ title, description, icon: Icon }) => (
                      <Card key={title} className="border-border/60 bg-muted/20 shadow-sm">
                        <CardContent className="p-4">
                          <Icon className="mb-3 h-5 w-5 text-brand-blue" aria-hidden="true" />
                          <h4 className="font-semibold tracking-tight">{title}</h4>
                          <p className="mt-1 text-sm leading-5 text-muted-foreground">
                            {description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>

                <RankingContexts officialScope={officialScope} comparisonScope={comparisonScope} />

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
              </div>
            </TabsContent>

            <TabsContent value="formula" className="m-0 px-5 py-6 sm:px-7 sm:py-7">
              <RankingMethodologyFormula />
            </TabsContent>

            <TabsContent value="criteria" className="m-0 px-5 py-6 sm:px-7 sm:py-7">
              <div className="space-y-8">
                <EligibilitySection />
                <RankingMethodologyTransparency
                  definition={definition}
                  quadrantMeta={quadrantMeta}
                  qualityFlags={qualityFlags}
                  compact
                />
              </div>
            </TabsContent>

            <TabsContent value="transparency" className="m-0 px-5 py-6 sm:px-7 sm:py-7">
              <RankingMethodologyTransparency
                definition={definition}
                quadrantMeta={quadrantMeta}
                qualityFlags={qualityFlags}
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="shrink-0 border-t border-border/60 px-5 py-4 sm:px-7">
          <DialogClose asChild>
            <Button variant="outline">Entendi</Button>
          </DialogClose>
          <Button asChild>
            <Link href="/como-funciona-o-ranking">Ver metodologia completa</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
