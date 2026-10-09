'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  Info,
  Lightbulb,
  MessageCircle,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';
import type { MarketplaceProposal } from '@/lib/api';
import {
  formatDate,
  formatMoney,
  getProposalDisplayPrice,
  getProposalLocation,
  getProposalRawTerm,
} from '@/lib/marketplace-proposals';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CompanyMark } from './ProposalSummary';

interface ProposalChooseProps {
  proposals: MarketplaceProposal[];
  initialSelectedId?: number;
  onBack: () => void;
  onConfirm: (proposal: MarketplaceProposal) => void;
  onConversation: (proposal: MarketplaceProposal) => void;
  onViewDetails: (proposal: MarketplaceProposal) => void;
}

export function ProposalChoose({
  proposals,
  initialSelectedId,
  onBack,
  onConfirm,
  onConversation,
  onViewDetails,
}: ProposalChooseProps) {
  const [selectedId, setSelectedId] = useState<number>(
    initialSelectedId || proposals[0]?.id || 0
  );
  const [sortBy, setSortBy] = useState<'best_value' | 'lowest_price' | 'highest_power'>(
    'best_value'
  );

  const selectedProposal = useMemo(() => {
    return proposals.find((p) => p.id === selectedId) || proposals[0];
  }, [proposals, selectedId]);

  // Stepper das 6 fases conforme Imagem 3
  const steps = [
    { num: 1, label: 'Resumo', sub: 'Proposta recebida' },
    { num: 2, label: 'Equipamentos', sub: 'Detalhes técnicos' },
    { num: 3, label: 'Negociação', sub: 'Em andamento' },
    { num: 4, label: 'Escolha', sub: 'Selecione sua proposta', active: true },
    { num: 5, label: 'Projeto', sub: 'Acompanhamento' },
    { num: 6, label: 'Conclusão', sub: 'Projeto em andamento' },
  ];

  const selectedPower =
    getProposalRawTerm(selectedProposal, [
      'system_power',
      'power_kwp',
      'installed_power',
      'potencia',
    ]);
  const selectedGen =
    getProposalRawTerm(selectedProposal, ['monthly_generation', 'generation_kwh', 'geracao']);
  const selectedPrice = getProposalDisplayPrice(selectedProposal);
  const selectedDeadline =
    getProposalRawTerm(selectedProposal, ['installation_deadline', 'prazo']);
  const selectedSavings =
    getProposalRawTerm(selectedProposal, ['monthly_savings', 'economia']);

  return (
    <div className="space-y-6">
      {/* 1. Header com botão Voltar e títulos */}
      <div className="space-y-1">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para negociação</span>
        </button>

        <div className="pt-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Escolher proposta
          </h1>
          <p className="text-xs text-slate-500 sm:text-sm mt-0.5">
            Compare as propostas recebidas e escolha a melhor opção para o seu projeto.
          </p>
        </div>
      </div>

      {/* 2. Stepper Horizontal de 6 Etapas - Imagem 3 */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px] relative">
          {/* Linha conectora contínua de fundo */}
          <div className="absolute left-6 right-6 top-4 h-0.5 bg-slate-200 -z-0" />

          {steps.map((step) => {
            const isCompleted = step.num < 4;
            const isCurrent = step.num === 4;

            return (
              <div key={step.num} className="relative z-10 flex flex-col items-center text-center px-2">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all shadow-2xs',
                    isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : isCompleted
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'bg-white border border-slate-200 text-slate-400'
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4 stroke-[2.5]" /> : step.num}
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs font-bold',
                    isCurrent ? 'text-blue-600' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                  )}
                >
                  {step.label}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">{step.sub}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Grid Principal (Lista de Propostas à esquerda | Resumo da Proposta selecionada à direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda: Lista de Propostas para Decisão (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Header da lista + Ordenação */}
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span>Propostas recebidas ({proposals.length})</span>
            </h3>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-9 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="best_value">Ordenar por: Melhor custo-benefício</option>
                <option value="lowest_price">Menor preço</option>
                <option value="highest_power">Maior potência</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Cards de Proposta com Radio Button */}
          <div className="space-y-4">
            {proposals.map((proposal) => {
              const isSelected = proposal.id === selectedId;
              const power =
                getProposalRawTerm(proposal, [
                  'system_power',
                  'power_kwp',
                  'installed_power',
                  'potencia',
                ]);
              const gen =
                getProposalRawTerm(proposal, ['monthly_generation', 'generation_kwh', 'geracao']);
              const price = getProposalDisplayPrice(proposal);
              const deadline =
                getProposalRawTerm(proposal, ['installation_deadline', 'prazo']);
              const savings =
                getProposalRawTerm(proposal, ['monthly_savings', 'economia']);
              const warranty =
                getProposalRawTerm(proposal, ['warranty', 'garantia_paineis']);

              return (
                <div
                  key={proposal.id}
                  onClick={() => setSelectedId(proposal.id)}
                  className={cn(
                    'relative rounded-2xl border p-5 transition-all cursor-pointer bg-white',
                    isSelected
                      ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                      : 'border-slate-200/90 hover:border-slate-300 shadow-2xs'
                  )}
                >
                  {/* Estado da seleção, sem classificar a proposta por posição na lista */}
                  <div className="mb-3 flex min-h-6 items-center justify-end">
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">
                        <Check className="h-3 w-3 stroke-[3]" />
                        <span>Selecionada</span>
                      </span>
                    )}
                  </div>

                  {/* Header do Card: Radio button + Logo + Dados da empresa */}
                  <div className="flex items-start gap-4">
                    {/* Radio Button */}
                    <div className="pt-1">
                      <div
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-full border transition-all',
                          isSelected
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-300 bg-white'
                        )}
                      >
                        {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                      </div>
                    </div>

                    {/* Logo & Dados */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-white p-1 overflow-hidden shadow-2xs">
                        <CompanyMark proposal={proposal} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-base font-bold text-slate-900 leading-tight">
                          {proposal.company.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {getProposalLocation(proposal)}
                        </p>
                        {proposal.company.rating_avg != null && (
                          <div className="flex items-center gap-1 text-xs text-slate-600 font-semibold mt-1">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span>{proposal.company.rating_avg.toFixed(1)}</span>
                            {proposal.company.reviews_count ? (
                              <span className="text-slate-400 font-normal">
                                ({proposal.company.reviews_count} avaliações)
                              </span>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 4 KPIs em Grid compacto */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center shrink-0">
                      <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-100 min-w-[70px]">
                        <Zap className="h-3.5 w-3.5 text-blue-600 mx-auto" />
                        <span className="block text-xs font-bold text-slate-900 mt-0.5">
                          {power || 'Não informado'}
                        </span>
                        <span className="block text-[10px] text-slate-400">Potência</span>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-100 min-w-[70px]">
                        <Sparkles className="h-3.5 w-3.5 text-blue-600 mx-auto" />
                        <span className="block text-xs font-bold text-slate-900 mt-0.5">
                          {gen || 'Não informado'}
                        </span>
                        <span className="block text-[10px] text-slate-400">Geração</span>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-100 min-w-[80px]">
                        <DollarSign className="h-3.5 w-3.5 text-blue-600 mx-auto" />
                        <span className="block text-xs font-bold text-slate-900 mt-0.5">
                          {price.formatted}
                        </span>
                        <span className="block text-[10px] text-slate-400">Valor total</span>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-100 min-w-[70px]">
                        <Clock className="h-3.5 w-3.5 text-blue-600 mx-auto" />
                        <span className="block text-xs font-bold text-slate-900 mt-0.5">
                          {deadline || 'Não informado'}
                        </span>
                        <span className="block text-[10px] text-slate-400">Prazo</span>
                      </div>
                    </div>
                  </div>

                  {/* Linha Inferior com Foto e Garantias */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                        {proposal.company.banner_url ? (
                          <img
                            src={proposal.company.banner_url}
                            alt={`Imagem da proposta de ${proposal.company.name}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center px-2 text-center text-[9px] font-semibold text-slate-400">
                            Sem imagem
                          </div>
                        )}
                      </div>
                      {proposal.request?.project_profile && (
                        <div className="flex flex-wrap gap-1.5">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            {proposal.request.project_profile}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Economia estimada</span>
                        <span className="font-bold text-emerald-600">{savings || 'Não informado'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Garantia painéis</span>
                        <span className="font-bold text-slate-800">{warranty || 'Não informado'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails(proposal);
                        }}
                        className="text-xs font-bold text-blue-600 hover:underline ml-2"
                      >
                        Ver detalhes completos →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Card Dica - Imagem 3 */}
          <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-xs text-slate-700">
            <Lightbulb className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Dica</p>
              <p className="mt-0.5 text-slate-600 leading-relaxed">
                Analise o custo-benefício considerando não apenas o valor, mas também a qualidade dos equipamentos, prazo de instalação, garantias e o suporte da empresa.
              </p>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Resumo da Proposta Selecionada (4 cols) */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FileText className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Resumo da proposta selecionada</h3>
            </div>

            {/* Empresa Header */}
            {selectedProposal && (
              <div className="flex items-center gap-3">
                <CompanyMark proposal={selectedProposal} />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {selectedProposal.company.name}
                  </h4>
                  <p className="text-xs text-slate-500">{getProposalLocation(selectedProposal)}</p>
                  {selectedProposal.company.verified && (
                    <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold mt-0.5">
                      <Check className="h-3 w-3 stroke-[3]" />
                      <span>Empresa verificada</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Foto e Título */}
            <div className="space-y-2">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                {selectedProposal?.company.banner_url ? (
                  <img
                    src={selectedProposal.company.banner_url}
                    alt={`Imagem da proposta de ${selectedProposal.company.name}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-4 text-center text-[11px] font-semibold text-slate-400">
                    Imagem do projeto não informada
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {selectedProposal?.version?.title || 'Título não informado'}
                </h4>
                {selectedProposal?.request?.project_profile && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                      {selectedProposal.request.project_profile}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Linhas de Dados */}
            <div className="divide-y divide-slate-100 border-t border-slate-100 pt-2 text-xs">
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 font-medium">Potência do sistema</span>
                <span className="font-bold text-slate-900">{selectedPower || 'Não informado'}</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 font-medium">Geração estimada</span>
                <span className="font-bold text-slate-900">{selectedGen || 'Não informado'}</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 font-medium">Valor total</span>
                <span className="font-bold text-slate-900">{selectedPrice.formatted}</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 font-medium">Economia estimada</span>
                <span className="font-bold text-emerald-600">{selectedSavings || 'Não informado'}</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 font-medium">Prazo de instalação</span>
                <span className="font-bold text-slate-900">{selectedDeadline || 'Não informado'}</span>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="space-y-2 pt-2">
              <Button
                onClick={() => selectedProposal && onConfirm(selectedProposal)}
                className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs gap-1.5"
              >
                <span>Confirmar interesse nesta proposta</span>
                <span>→</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => selectedProposal && onConversation(selectedProposal)}
                className="w-full h-10 rounded-xl border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 gap-1.5"
              >
                <MessageCircle className="h-3.5 w-3.5 text-blue-600" />
                <span>Falar novamente com a empresa</span>
              </Button>
            </div>

            {/* Box informativo azul claro */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3 text-[11px] text-slate-600 leading-relaxed flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <p>
                Ao confirmar seu interesse, a empresa será notificada e entrará em contato para dar continuidade. Este passo não gera contrato nem pagamento.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
