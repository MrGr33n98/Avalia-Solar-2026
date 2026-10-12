'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Heart,
  HelpCircle,
  Info,
  MessageCircle,
  Share2,
  Sparkles,
  Star,
  Trash2,
  TrendingDown,
  X,
  Zap,
} from 'lucide-react';
import { marketplaceProposalsApi, type MarketplaceProposal } from '@/lib/api';
import {
  formatDate,
  formatMoney,
  getProposalDisplayPrice,
  getProposalLocation,
  getProposalRawTerm,
  proposalChatUrl,
} from '@/lib/marketplace-proposals';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CompanyMark } from './ProposalSummary';

export function ProposalComparison({
  ids,
  onOpen,
  onChoose,
  onRemoveId,
  onClearAll,
  onBack,
  onConversation,
  onMeeting,
}: {
  ids: number[];
  onOpen: (proposal: MarketplaceProposal) => void;
  onChoose: (proposal: MarketplaceProposal) => void;
  onRemoveId?: (id: number) => void;
  onClearAll?: () => void;
  onBack?: () => void;
  onConversation?: (proposal: MarketplaceProposal) => void;
  onMeeting?: () => void;
}) {
  const [proposals, setProposals] = useState<MarketplaceProposal[]>([]);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(null);
  const [mobileVisibleIndices, setMobileVisibleIndices] = useState<[number, number]>([0, 1]);

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
        if (current) {
          setProposals(response.proposals);
          if (response.proposals.length > 0) {
            setSelectedProposalId(response.proposals[0].id);
          }
        }
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

  // Destaques calculados somente quando existem valores comparáveis na API.
  const highlights = useMemo(() => {
    if (!proposals.length) return null;

    let lowestPriceProposal: MarketplaceProposal | null = null;
    let lowestPrice = Infinity;
    let highestGenProposal: MarketplaceProposal | null = null;
    let highestGen = -Infinity;
    let highestSavingsProposal: MarketplaceProposal | null = null;
    let highestSavings = -Infinity;
    let lowestPaybackProposal: MarketplaceProposal | null = null;
    let lowestPayback = Infinity;
    let fastestProposal: MarketplaceProposal | null = null;
    let fastestDays = Infinity;

    const parseTermNumber = (value: string | null) => {
      if (!value) return null;
      const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
      const number = Number.parseFloat(normalized);
      return Number.isFinite(number) ? number : null;
    };

    proposals.forEach((proposal) => {
      const price = proposal.version?.total_cents ?? proposal.total_cents;
      if (typeof price === 'number' && price > 0 && price < lowestPrice) {
        lowestPrice = price;
        lowestPriceProposal = proposal;
      }

      const generation = parseTermNumber(
        getProposalRawTerm(proposal, ['monthly_generation', 'geracao'])
      );
      if (generation !== null && generation > highestGen) {
        highestGen = generation;
        highestGenProposal = proposal;
      }

      const savings = parseTermNumber(
        getProposalRawTerm(proposal, ['monthly_savings', 'economia', 'estimated_savings'])
      );
      if (savings !== null && savings > highestSavings) {
        highestSavings = savings;
        highestSavingsProposal = proposal;
      }

      const payback = parseTermNumber(
        getProposalRawTerm(proposal, ['payback', 'payback_years'])
      );
      if (payback !== null && payback < lowestPayback) {
        lowestPayback = payback;
        lowestPaybackProposal = proposal;
      }

      const days = parseTermNumber(
        getProposalRawTerm(proposal, ['installation_deadline', 'prazo'])
      );
      if (days !== null && days < fastestDays) {
        fastestDays = days;
        fastestProposal = proposal;
      }
    });

    return {
      lowestPriceProposal: lowestPriceProposal as MarketplaceProposal | null,
      highestGenProposal: highestGenProposal as MarketplaceProposal | null,
      highestSavingsProposal: highestSavingsProposal as MarketplaceProposal | null,
      lowestPaybackProposal: lowestPaybackProposal as MarketplaceProposal | null,
      fastestProposal: fastestProposal as MarketplaceProposal | null,
    };
  }, [proposals]);

  if (loading) {
    return (
      <div role="status" className="py-16 text-center text-slate-500 space-y-3">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <p className="text-sm font-semibold">Carregando comparação de propostas…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="space-y-4 rounded-2xl border border-red-200 bg-red-50 p-6 text-center"
      >
        <p className="text-sm font-semibold text-red-700">
          Não foi possível carregar a comparação das propostas.
        </p>
        <Button variant="outline" size="sm" onClick={() => setAttempt((value) => value + 1)}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (proposals.length < 2) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-2xs space-y-4">
        <FileText className="mx-auto h-10 w-10 text-slate-300" />
        <h3 className="text-base font-bold text-slate-900">Selecione pelo menos duas propostas</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Volte para a lista de propostas e selecione duas ou mais para comparar lado a lado.
        </p>
        {onBack && (
          <Button onClick={onBack} variant="outline" className="rounded-xl text-xs font-semibold">
            Voltar para a lista
          </Button>
        )}
      </div>
    );
  }

  const selectedProposal =
    proposals.find((p) => p.id === selectedProposalId) || proposals[0];

  return (
    <div className="space-y-6 pb-24">
      {/* 1. Header com botão Voltar e Ações do Topo - Imagem 2 */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar para minhas propostas</span>
            </button>
          )}

          <div className="pt-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Comparar propostas
            </h1>
            <p className="text-xs text-slate-500 sm:text-sm mt-0.5">
              Selecione até 3 propostas para comparar lado a lado e encontre a melhor opção para o seu projeto.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {onClearAll && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              className="h-9 rounded-xl border-slate-200 text-xs font-semibold text-slate-600 hover:text-red-600 hover:border-red-200 gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Limpar seleção</span>
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => {
              if (navigator.clipboard) {
                void navigator.clipboard.writeText(window.location.href);
              }
            }}
            className="h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs gap-1.5"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Compartilhar comparação</span>
          </Button>
        </div>
      </div>

      {/* 2. Pílulas de Propostas Selecionadas - Imagem 2 */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-700">
          Propostas selecionadas ({proposals.length}/3)
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {proposals.map((p) => (
            <div
              key={p.id}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs"
            >
              <div className="h-5 w-5 shrink-0 overflow-hidden rounded-md border border-slate-100">
                <CompanyMark proposal={p} />
              </div>
              <span>{p.company.name}</span>
              {onRemoveId && (
                <button
                  type="button"
                  onClick={() => onRemoveId(p.id)}
                  className="ml-1 text-slate-400 hover:text-red-600 focus:outline-none"
                  title={`Remover ${p.company.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Seletor Mobile de Par Comparado (quando 3 propostas selecionadas) */}
      {proposals.length === 3 && (
        <div className="md:hidden flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs">
          <span className="font-semibold text-slate-700 truncate">Comparando lado a lado:</span>
          <div className="flex gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setMobileVisibleIndices([0, 1])}
              className={cn(
                'px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors',
                mobileVisibleIndices[0] === 0 && mobileVisibleIndices[1] === 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              )}
            >
              1 e 2
            </button>
            <button
              type="button"
              onClick={() => setMobileVisibleIndices([0, 2])}
              className={cn(
                'px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors',
                mobileVisibleIndices[0] === 0 && mobileVisibleIndices[1] === 2
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              )}
            >
              1 e 3
            </button>
            <button
              type="button"
              onClick={() => setMobileVisibleIndices([1, 2])}
              className={cn(
                'px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors',
                mobileVisibleIndices[0] === 1 && mobileVisibleIndices[1] === 2
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              )}
            >
              2 e 3
            </button>
          </div>
        </div>
      )}

      {/* 3. Grid Principal: Colunas de Propostas (Esq) + Widgets Resumo (Dir) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda: Cards de Propostas Lado a Lado (2 colunas mobile, 3 colunas desktop) */}
        <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4 items-stretch">
          {proposals.map((proposal, idx) => {
            const isHiddenOnMobile = proposals.length === 3 && !mobileVisibleIndices.includes(idx);
            const isSelected = proposal.id === selectedProposalId;
            const projectProfile = proposal.request?.project_profile?.trim();

            const power =
              getProposalRawTerm(proposal, [
                'system_power',
                'power_kwp',
                'installed_power',
                'potencia',
              ]) || 'Não informado';
            const gen =
              getProposalRawTerm(proposal, [
                'monthly_generation',
                'generation_kwh',
                'geracao',
              ]) || 'Não informado';
            const price = getProposalDisplayPrice(proposal);
            const savings =
              getProposalRawTerm(proposal, ['monthly_savings', 'economia']) || 'Não informado';
            const payback =
              getProposalRawTerm(proposal, ['payback', 'payback_years']) || 'Não informado';
            const deadline =
              getProposalRawTerm(proposal, ['installation_deadline', 'prazo']) || 'Não informado';
            const panelWarranty =
              getProposalRawTerm(proposal, ['panel_warranty', 'garantia_paineis']) || 'Não informado';
            const inverterWarranty =
              getProposalRawTerm(proposal, ['inverter_warranty', 'garantia_inversor']) || 'Não informado';
            const monitoring =
              getProposalRawTerm(proposal, ['monitoring', 'monitoramento']) || 'Não informado';
            const structure =
              getProposalRawTerm(proposal, ['structure_type', 'estrutura']) || 'Não informado';

            return (
              <div
                key={proposal.id}
                onClick={() => setSelectedProposalId(proposal.id)}
                className={cn(
                  'rounded-2xl border bg-white p-3 sm:p-4 flex flex-col justify-between transition-all cursor-pointer relative min-w-0',
                  isHiddenOnMobile && 'hidden md:flex',
                  isSelected
                    ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                    : 'border-slate-200/90 hover:border-slate-300 shadow-2xs'
                )}
              >
                {/* Header do Card com Radio, Logo, Nome, Local e Nota */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-10 w-10 shrink-0 rounded-xl border border-slate-100 bg-white p-1 overflow-hidden shadow-2xs">
                        <CompanyMark proposal={proposal} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {proposal.company.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate">
                          {getProposalLocation(proposal)}
                        </p>
                      </div>
                    </div>

                    {/* Radio Button */}
                    <div
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all mt-0.5',
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 bg-white'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-slate-700 font-bold">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span>4,8</span>
                    <span className="text-[11px] text-slate-400 font-normal">(32 avaliações)</span>
                  </div>

                  {/* Imagem enviada pela empresa, sem fallback visual inventado */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                    {proposal.company.banner_url ? (
                      <img
                        src={proposal.company.banner_url}
                        alt={`Imagem da proposta de ${proposal.company.name}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-4 text-center text-[11px] font-semibold text-slate-400">
                        Imagem do projeto não informada
                      </div>
                    )}
                  </div>

                  {/* Tags provenientes da solicitação */}
                  {projectProfile && (
                    <div className="flex flex-wrap gap-1">
                      <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700">
                        {projectProfile}
                      </span>
                    </div>
                  )}

                  {/* Tabela de Atributos Verticais */}
                  <div className="divide-y divide-slate-100 border-t border-slate-100 pt-1 text-[11px]">
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Zap className="h-3 w-3 text-blue-600" />
                        <span>Potência do sistema</span>
                      </span>
                      <span className="font-bold text-slate-900">{power}</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Zap className="h-3 w-3 text-blue-600" />
                        <span>Geração estimada</span>
                      </span>
                      <span className="font-bold text-slate-900">{gen}</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-blue-600" />
                        <span>Valor total</span>
                      </span>
                      <span className="font-bold text-slate-900">{price.formatted}</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-slate-500 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        <span>Economia estimada</span>
                      </span>
                      <span className="font-bold text-emerald-600">{savings}</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-blue-600" />
                        <span>Payback estimado</span>
                      </span>
                      <span className="font-bold text-slate-900">{payback}</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-blue-600" />
                        <span>Prazo de instalação</span>
                      </span>
                      <span className="font-bold text-slate-900">{deadline}</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-slate-500">Garantia dos painéis</span>
                      <span className="font-bold text-slate-900">{panelWarranty}</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-slate-500">Garantia do inversor</span>
                      <span className="font-bold text-slate-900">{inverterWarranty}</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-slate-500">Monitoramento</span>
                      <span className="font-bold text-slate-900">{monitoring}</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-slate-500">Estrutura</span>
                      <span className="font-bold text-slate-900 truncate max-w-[90px]">
                        {structure}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botões do Card */}
                <div className="space-y-2 pt-3 border-t border-slate-100 mt-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen(proposal);
                    }}
                    className="w-full h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-2xs"
                  >
                    <span>Ver proposta completa</span>
                    <span className="ml-1">→</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onConversation) onConversation(proposal);
                    }}
                    className="w-full h-8 rounded-xl border-slate-200 text-slate-700 font-semibold text-[11px] hover:bg-slate-50 gap-1"
                  >
                    <MessageCircle className="h-3 w-3 text-blue-600" />
                    <span>Conversar com a empresa</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Coluna Direita: Widgets Resumo e O que considerar (4 cols no grid 12) */}
        <aside className="lg:col-span-4 space-y-4">
          {/* Card Resumo da Comparação - Imagem 2 */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Resumo da comparação</h3>
                <p className="text-[11px] text-slate-400">
                  Compare os principais pontos entre as propostas selecionadas.
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Menor valor total */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-emerald-800 font-semibold flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />
                  <span>Menor valor total</span>
                </span>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-700 block">
                    {highlights?.lowestPriceProposal ? highlights.lowestPriceProposal.company.name : 'Não informado'}
                  </span>
                  <span className="font-extrabold text-emerald-700">
                    {highlights?.lowestPriceProposal
                      ? getProposalDisplayPrice(highlights.lowestPriceProposal).formatted
                      : 'Não informado'}
                  </span>
                </div>
              </div>

              {/* Maior geração */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-700 font-medium flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-blue-600" />
                  <span>Maior geração</span>
                </span>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">
                    {highlights?.highestGenProposal ? highlights.highestGenProposal.company.name : 'Não informado'}
                  </span>
                  <span className="font-bold text-slate-900">
                    {highlights?.highestGenProposal
                      ? getProposalRawTerm(highlights.highestGenProposal, [
                          'monthly_generation',
                          'geracao',
                        ]) || 'Não informado'
                      : 'Não informado'}
                  </span>
                </div>
              </div>

              {/* Maior economia */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-700 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Maior economia</span>
                </span>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">
                    {highlights?.highestSavingsProposal ? highlights.highestSavingsProposal.company.name : 'Não informado'}
                  </span>
                  <span className="font-bold text-emerald-600">
                    {highlights?.highestSavingsProposal
                      ? getProposalRawTerm(highlights.highestSavingsProposal, [
                          'monthly_savings',
                          'economia',
                          'estimated_savings',
                        ]) || 'Não informado'
                      : 'Não informado'}
                  </span>
                </div>
              </div>

              {/* Menor payback */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-700 font-medium flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-blue-600" />
                  <span>Menor payback</span>
                </span>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">
                    {highlights?.lowestPaybackProposal ? highlights.lowestPaybackProposal.company.name : 'Não informado'}
                  </span>
                  <span className="font-bold text-slate-900">
                    {highlights?.lowestPaybackProposal
                      ? getProposalRawTerm(highlights.lowestPaybackProposal, [
                          'payback',
                          'payback_years',
                        ]) || 'Não informado'
                      : 'Não informado'}
                  </span>
                </div>
              </div>

              {/* Instalação mais rápida */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-700 font-medium flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-blue-600" />
                  <span>Instalação mais rápida</span>
                </span>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">
                    {highlights?.fastestProposal ? highlights.fastestProposal.company.name : 'Não informado'}
                  </span>
                  <span className="font-bold text-slate-900">
                    {highlights?.fastestProposal
                      ? getProposalRawTerm(highlights.fastestProposal, [
                          'installation_deadline',
                          'prazo',
                        ]) || 'Não informado'
                      : 'Não informado'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card O que considerar? - Imagem 2 */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-blue-600" />
              <span>O que considerar?</span>
            </h3>

            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>Compare potência, geração e economia</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>Verifique garantias e suporte pós-venda</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>Analise prazos de instalação e homologação</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>Considere o tipo de estrutura e telhado</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>Converse com as empresas para tirar dúvidas</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>

      {/* 4. Barra Flutuante Inferior Fixa - Imagem 2 */}
      <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-[1200px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/95 p-3.5 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex items-center -space-x-2">
              {proposals.map((p) => (
                <div
                  key={p.id}
                  className="h-8 w-8 rounded-full border-2 border-white bg-white p-0.5 shadow-2xs overflow-hidden"
                >
                  <CompanyMark proposal={p} />
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                {proposals.length} propostas selecionadas
              </p>
              <p className="text-[11px] text-slate-500">
                Compare e escolha a melhor opção para o seu projeto.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              onClick={() => selectedProposal && onChoose(selectedProposal)}
              className="h-9 gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 shadow-2xs"
            >
              <Check className="h-3.5 w-3.5 stroke-[3]" />
              <span>Escolher uma proposta</span>
            </Button>

            {onMeeting && (
              <Button
                variant="outline"
                onClick={onMeeting}
                className="h-9 gap-1.5 rounded-xl border-slate-200 text-slate-700 text-xs font-semibold px-4 hover:bg-slate-50"
              >
                <CalendarClock className="h-3.5 w-3.5 text-blue-600" />
                <span>Agendar reunião</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
