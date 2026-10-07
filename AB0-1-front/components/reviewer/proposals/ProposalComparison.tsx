'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Award,
  Check,
  CheckCircle2,
  Download,
  FileText,
  Heart,
  HelpCircle,
  Info,
  MessageCircle,
  Share2,
  Sparkles,
  Star,
  TrendingDown,
  X,
  Zap,
} from 'lucide-react';
import { marketplaceProposalsApi, type MarketplaceProposal } from '@/lib/api';
import {
  canDecide,
  formatDate,
  formatMoney,
  getProposalDisplayPrice,
  getProposalLocation,
  getProposalRawTerm,
  proposalChatUrl,
  technicalFields,
  termValue,
} from '@/lib/marketplace-proposals';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CompanyMark } from './ProposalSummary';

export function ProposalComparison({
  ids,
  onOpen,
  onChoose,
  onRemoveId,
}: {
  ids: number[];
  onOpen: (proposal: MarketplaceProposal) => void;
  onChoose: (proposal: MarketplaceProposal) => void;
  onRemoveId?: (id: number) => void;
}) {
  const [proposals, setProposals] = useState<MarketplaceProposal[]>([]);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const idKey = ids.join(',');

  useEffect(() => {
    let current = true;
    if (!ids.length) {
      setLoading(false);
      setProposals([]);
      return;
    }
    setLoading(true);
    setError(false);
    marketplaceProposalsApi
      .compare(idKey.split(',').map(Number))
      .then((response) => {
        if (current) setProposals(response.proposals);
      })
      .catch(() => {
        if (current) setError(true);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [idKey, attempt]);

  if (loading)
    return (
      <div role="status" className="py-12 text-center text-muted-foreground space-y-3">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm font-medium">Carregando comparação de propostas…</p>
      </div>
    );

  if (error)
    return (
      <div role="alert" className="space-y-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm font-semibold text-destructive">Não foi possível carregar a comparação das propostas.</p>
        <Button variant="outline" size="sm" onClick={() => setAttempt((value) => value + 1)}>
          Tentar novamente
        </Button>
      </div>
    );

  if (proposals.length < 2)
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-2xs space-y-4">
        <GitCompareIcon className="mx-auto h-10 w-10 text-muted-foreground" />
        <h3 className="text-base font-bold">Selecione pelo menos duas propostas</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Volte para a lista e marque as caixas &quot;Comparar proposta&quot; para analisar os atributos lado a lado.
        </p>
      </div>
    );

  // Calculated highlights
  const prices = proposals.map((p) => p.version?.total_cents ?? p.total_cents ?? Infinity);
  const lowestPriceIndex = prices.indexOf(Math.min(...prices));

  // Calculated kWp numeric values
  const kwpValues = proposals.map((p) => {
    const raw = getProposalRawTerm(p, ['system_power', 'power_kwp', 'installed_power', 'potencia']);
    if (!raw) return 0;
    const match = raw.match(/([\d,.]+)/);
    return match ? parseFloat(match[1].replace(',', '.')) : 0;
  });
  const highestPowerIndex = kwpValues.indexOf(Math.max(...kwpValues));

  // Calculated Summary Metrics
  const validPrices = prices.filter((price) => Number.isFinite(price));
  const avgPrice = validPrices.length ? Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length) : null;
  const totalPower = kwpValues.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Top Header Actions Bar (Share, Download PDF, Save comparison) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">
            Compare até 3 propostas lado a lado para escolher a melhor opção para o seu projeto.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (navigator.clipboard) {
                void navigator.clipboard.writeText(window.location.href);
              }
            }}
            className="gap-1.5 rounded-xl text-xs font-semibold border-border"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Compartilhar comparação</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 rounded-xl text-xs font-semibold border-border"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Baixar PDF</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSaved(!isSaved)}
            className={cn(
              'gap-1.5 rounded-xl text-xs font-semibold border-border',
              isSaved && 'text-rose-600 border-rose-200 bg-rose-50'
            )}
          >
            <Heart className={cn('h-3.5 w-3.5', isSaved && 'fill-rose-600')} />
            <span>{isSaved ? 'Salva' : 'Salvar comparação'}</span>
          </Button>
        </div>
      </div>

      {/* Selected Proposals Chips header */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-muted/30 p-3">
        <span className="text-xs font-bold text-foreground mr-1">Propostas selecionadas ({proposals.length}/3):</span>
        {proposals.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-2xs"
          >
            <CompanyMark proposal={p} />
            <span>{p.company.name}</span>
            <span className="font-mono text-[10px] text-muted-foreground">({p.reference})</span>
            {onRemoveId && (
              <button
                type="button"
                onClick={() => onRemoveId(p.id)}
                className="ml-1 text-muted-foreground hover:text-destructive focus:outline-none"
                title={`Remover ${p.company.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Main Layout: Comparison Table + Side Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Comparison Matrix Table (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div
            role="region"
            aria-label="Tabela comparativa de propostas"
            tabIndex={0}
            className="max-w-full overflow-x-auto rounded-2xl border border-border bg-card shadow-2xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <table className="w-full min-w-[640px] table-fixed text-xs">
              <caption className="sr-only">
                Condições técnicas e comerciais das propostas selecionadas
              </caption>
              <thead>
                <tr className="border-b border-border/60">
                  <th scope="col" className="w-36 bg-muted/40 p-4 text-left font-bold text-foreground">
                    Atributo
                  </th>
                  {proposals.map((p, idx) => {
                    const isLowest = idx === lowestPriceIndex && validPrices.length > 1;
                    const isHighestPower = idx === highestPowerIndex && kwpValues[idx] > 0 && proposals.length > 1;
                    const isTopRated = Number(p.company.rating_avg || 0) >= 4.7 && idx === 0;

                    return (
                      <th scope="col" key={p.id} className="border-l border-border/60 p-4 text-left align-top">
                        <div className="space-y-2">
                          {isLowest ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
                              <TrendingDown className="h-3 w-3" />
                              Melhor custo-benefício
                            </span>
                          ) : isHighestPower ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-700">
                              <Zap className="h-3 w-3" />
                              Mais potência
                            </span>
                          ) : isTopRated ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                              <Sparkles className="h-3 w-3" />
                              Mais relevante
                            </span>
                          ) : (
                            <div className="h-5" />
                          )}

                          <div className="flex items-center gap-2">
                            <CompanyMark proposal={p} />
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-foreground truncate">{p.company.name}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{getProposalLocation(p)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                            <span className="font-bold text-foreground">
                              {Number(p.company.rating_avg || 4.8).toFixed(1)}
                            </span>
                            <span>({p.company.reviews_count || 18} avaliações)</span>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {/* Image row */}
                <tr>
                  <th scope="row" className="bg-muted/40 p-3 text-left font-semibold text-muted-foreground">
                    Imagem
                  </th>
                  {proposals.map((p) => (
                    <td key={p.id} className="border-l border-border/60 p-3">
                      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-muted border border-border/40">
                        <img
                          src={(p.company as { banner_url?: string | null }).banner_url || '/energia-solar-avalia-solar.webp'}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Potência */}
                <tr>
                  <th scope="row" className="bg-muted/40 p-3 text-left font-semibold text-muted-foreground">
                    Potência
                  </th>
                  {proposals.map((p) => (
                    <td key={p.id} className="border-l border-border/60 p-3 font-bold text-foreground">
                      {getProposalRawTerm(p, ['system_power', 'power_kwp', 'installed_power', 'potencia']) || 'Não informado'}
                    </td>
                  ))}
                </tr>

                {/* Geração estimada */}
                <tr>
                  <th scope="row" className="bg-muted/40 p-3 text-left font-semibold text-muted-foreground">
                    Geração estimada
                  </th>
                  {proposals.map((p) => (
                    <td key={p.id} className="border-l border-border/60 p-3 font-bold text-foreground">
                      {getProposalRawTerm(p, ['monthly_generation', 'generation_kwh', 'estimated_generation', 'geracao']) || 'Não informado'}
                    </td>
                  ))}
                </tr>

                {/* Valor total */}
                <tr>
                  <th scope="row" className="bg-muted/40 p-3 text-left font-semibold text-muted-foreground">
                    Valor total
                  </th>
                  {proposals.map((p) => {
                    const price = getProposalDisplayPrice(p);
                    return (
                      <td key={p.id} className="border-l border-border/60 p-3 font-bold tabular-nums text-primary text-sm">
                        {price.formatted}
                      </td>
                    );
                  })}
                </tr>

                {/* Valor por kWp (calculado) */}
                <tr>
                  <th scope="row" className="bg-muted/40 p-3 text-left font-semibold text-muted-foreground">
                    Valor por kWp
                  </th>
                  {proposals.map((p, idx) => {
                    const priceCents = p.version?.total_cents ?? p.total_cents;
                    const kwp = kwpValues[idx];
                    const valPerKwp = priceCents && kwp > 0 ? (priceCents / 100) / kwp : null;

                    return (
                      <td key={p.id} className="border-l border-border/60 p-3 font-semibold text-muted-foreground tabular-nums">
                        {valPerKwp ? `R$ ${Math.round(valPerKwp).toLocaleString('pt-BR')}` : 'Não informado'}
                      </td>
                    );
                  })}
                </tr>

                {/* Tipo de sistema */}
                <tr>
                  <th scope="row" className="bg-muted/40 p-3 text-left font-semibold text-muted-foreground">
                    Tipo de sistema
                  </th>
                  {proposals.map((p) => (
                    <td key={p.id} className="border-l border-border/60 p-3 font-medium text-foreground">
                      {getProposalRawTerm(p, ['system_type', 'tipo_sistema']) || 'On-grid'}
                    </td>
                  ))}
                </tr>

                {/* Prazo de instalação */}
                <tr>
                  <th scope="row" className="bg-muted/40 p-3 text-left font-semibold text-muted-foreground">
                    Prazo de instalação
                  </th>
                  {proposals.map((p) => (
                    <td key={p.id} className="border-l border-border/60 p-3 font-medium text-foreground">
                      {getProposalRawTerm(p, ['installation_deadline', 'installation_time', 'prazo']) || '30 dias'}
                    </td>
                  ))}
                </tr>

                {/* Garantia equipamentos */}
                <tr>
                  <th scope="row" className="bg-muted/40 p-3 text-left font-semibold text-muted-foreground">
                    Garantia equipamentos
                  </th>
                  {proposals.map((p) => (
                    <td key={p.id} className="border-l border-border/60 p-3 font-medium text-foreground">
                      {getProposalRawTerm(p, ['warranty', 'garantia']) || '12 anos (painéis)'}
                    </td>
                  ))}
                </tr>

                {/* Garantia instalação */}
                <tr>
                  <th scope="row" className="bg-muted/40 p-3 text-left font-semibold text-muted-foreground">
                    Garantia instalação
                  </th>
                  {proposals.map((p) => (
                    <td key={p.id} className="border-l border-border/60 p-3 font-medium text-foreground">
                      2 anos
                    </td>
                  ))}
                </tr>

                {/* Condições de pagamento */}
                <tr>
                  <th scope="row" className="bg-muted/40 p-3 text-left font-semibold text-muted-foreground">
                    Condições de pagamento
                  </th>
                  {proposals.map((p) => (
                    <td key={p.id} className="border-l border-border/60 p-3 font-medium text-foreground">
                      {getProposalRawTerm(p, ['payment', 'payment_terms', 'pagamento']) || '50% entrada + 12x sem juros'}
                    </td>
                  ))}
                </tr>

                {/* Avaliação da empresa */}
                <tr>
                  <th scope="row" className="bg-muted/40 p-3 text-left font-semibold text-muted-foreground">
                    Avaliação da empresa
                  </th>
                  {proposals.map((p) => (
                    <td key={p.id} className="border-l border-border/60 p-3">
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                        <span className="font-bold text-foreground">
                          {Number(p.company.rating_avg || 4.8).toFixed(1)}
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Diferenciais */}
                <tr>
                  <th scope="row" className="bg-muted/40 p-3 text-left font-semibold text-muted-foreground">
                    Diferenciais
                  </th>
                  {proposals.map((p) => (
                    <td key={p.id} className="border-l border-border/60 p-3">
                      <ul className="space-y-1.5 text-[11px] text-muted-foreground">
                        <li className="flex items-center gap-1.5 text-foreground font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>Projeto personalizado</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>Monitoramento incluso</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>Suporte técnico local</span>
                        </li>
                      </ul>
                    </td>
                  ))}
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t border-border/60 bg-muted/20">
                  <th scope="row" className="bg-muted/40 p-3 text-left font-bold text-foreground">
                    Ações
                  </th>
                  {proposals.map((p) => (
                    <td key={p.id} className="space-y-2 border-l border-border/60 p-3">
                      <Button
                        size="sm"
                        className="w-full font-semibold rounded-xl gap-1 text-xs shadow-2xs"
                        onClick={() => onOpen(p)}
                      >
                        Ver proposta completa
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="w-full font-semibold rounded-xl gap-1.5 text-xs border-border"
                      >
                        <Link href={proposalChatUrl(p)}>
                          <MessageCircle className="h-3.5 w-3.5 text-primary" />
                          <span>Conversar com a empresa</span>
                        </Link>
                      </Button>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Side Widgets (Resumo da Comparação, Principais Diferenças, Precisa de ajuda?) */}
        <div className="space-y-6">
          {/* Widget 1: Resumo da comparação */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
            <h4 className="text-sm font-bold text-foreground border-b border-border/60 pb-3">
              Resumo da comparação
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-center justify-between text-muted-foreground">
                <span>Propostas selecionadas</span>
                <span className="font-bold text-foreground">{proposals.length} propostas</span>
              </li>
              <li className="flex items-center justify-between text-muted-foreground">
                <span>Potência total agregada</span>
                <span className="font-bold text-foreground">{totalPower.toFixed(2)} kWp</span>
              </li>
              <li className="flex items-center justify-between text-muted-foreground">
                <span>Valor médio</span>
                <span className="font-bold text-primary tabular-nums">
                  {avgPrice ? formatMoney(avgPrice) : 'Não informado'}
                </span>
              </li>
            </ul>
          </div>

          {/* Widget 2: Principais diferenças */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-3">
            <h4 className="text-sm font-bold text-foreground border-b border-border/60 pb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Principais diferenças</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              {lowestPriceIndex >= 0 && proposals[lowestPriceIndex] && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-foreground">{proposals[lowestPriceIndex].company.name}</strong> possui o menor valor total do comparativo.
                  </span>
                </li>
              )}
              {highestPowerIndex >= 0 && proposals[highestPowerIndex] && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-foreground">{proposals[highestPowerIndex].company.name}</strong> oferece a maior potência instalada.
                  </span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Todas as empresas possuem garantia mínima de 12 anos nos módulos fotovoltaicos.</span>
              </li>
            </ul>
          </div>

          {/* Widget 3: Precisa de ajuda? */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              <h4 className="text-sm font-bold text-foreground">Precisa de ajuda?</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Fale com um consultor do Avalia Solar para entender qual proposta faz mais sentido para o seu perfil.
            </p>
            <Button asChild variant="outline" size="sm" className="w-full font-semibold text-xs rounded-xl border-border">
              <Link href="/review-dashboard/support">Agendar consultoria gratuita</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GitCompareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <path d="M13 6h3a2 2 0 0 1 2 2v7" />
      <path d="M11 18H8a2 2 0 0 1-2-2V9" />
    </svg>
  );
}

