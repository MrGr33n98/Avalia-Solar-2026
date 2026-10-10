'use client';

import React from 'react';
import {
  ArrowRight,
  BarChart2,
  Calendar,
  DollarSign,
  FileText,
  Grid,
  Zap,
} from 'lucide-react';
import type { MarketplaceProposal } from '@/lib/api';
import {
  formatRelativeDay,
  getProposalDisplayPrice,
  getProposalLocation,
  getProposalRawTerm,
  getProposalSolutionLabel,
  isProjectComplete,
  isProposalCompleted,
  isProposalReceived,
  proposalStatus,
} from '@/lib/marketplace-proposals';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CompanyMark } from './ProposalSummary';

export interface ProposalCompactCardProps {
  proposal: MarketplaceProposal;
  onOpen: (proposal: MarketplaceProposal) => void;
  onToggleCompare?: (id: number) => void;
  isComparing?: boolean;
  canCompare?: boolean;
}

function CompactCompanyAvatar({ proposal }: { proposal: MarketplaceProposal }) {
  if (proposal.company.logo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={proposal.company.logo_url}
        alt={proposal.company.name}
        className="h-full w-full object-contain"
      />
    );
  }
  return <CompanyMark proposal={proposal} />;
}

export function ProposalCompactCard({
  proposal,
  onOpen,
  onToggleCompare,
  isComparing = false,
  canCompare = false,
}: ProposalCompactCardProps) {
  const isSentOrReady = isProposalReceived(proposal);
  const isUnderAnalysis = proposal.status === 'draft' || proposal.status === 'under_review';
  const isComplete = isProposalCompleted(proposal);
  const isAccepted = proposal.status === 'accepted';

  // Dados técnicos reais (sem inventar fallbacks fictícios)
  const power = getProposalRawTerm(proposal, [
    'system_power',
    'power_kwp',
    'potencia',
    'installed_power',
  ]);
  const generation = getProposalRawTerm(proposal, [
    'monthly_generation',
    'geracao',
    'generation_kwh',
  ]);
  const price = getProposalDisplayPrice(proposal);
  const deadline = getProposalRawTerm(proposal, [
    'installation_deadline',
    'prazo',
    'installation_time',
  ]);

  const hasMetrics = isSentOrReady && Boolean(power || generation || price.isAvailable || deadline);

  // Status canônico e cores
  let statusBadgeText = 'Em análise';
  let statusBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200/60';
  let statusDotColor = 'bg-blue-500';
  let statusAuxText = 'Aguardando resposta da empresa';

  if (isComplete) {
    statusBadgeText = 'Projeto concluído';
    statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
    statusDotColor = 'bg-emerald-500';
    statusAuxText = 'Instalação finalizada';
  } else if (isAccepted) {
    statusBadgeText = 'Em andamento';
    statusBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200/60';
    statusDotColor = 'bg-blue-500';
    statusAuxText = 'Projeto em andamento';
  } else if (isSentOrReady) {
    statusBadgeText = 'Proposta recebida';
    statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
    statusDotColor = 'bg-emerald-500';
    const pubRel = formatRelativeDay(
      proposal.published_at || proposal.version?.published_at || proposal.created_at
    );
    statusAuxText = pubRel === 'hoje' ? 'Recebida hoje' : pubRel ? `Recebida em ${pubRel}` : 'Recebida';
  } else if (isUnderAnalysis) {
    statusBadgeText = 'Em análise';
    statusBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200/60';
    statusDotColor = 'bg-blue-500';
    statusAuxText = 'Aguardando resposta da empresa';
  } else {
    statusBadgeText = proposalStatus(proposal);
    statusBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
    statusDotColor = 'bg-slate-400';
    statusAuxText = 'Acompanhamento';
  }

  // Linha de contexto/detalhes
  let contextText = 'Solicitação enviada com sucesso';
  if (isSentOrReady) {
    contextText =
      proposal.version?.summary ||
      (proposal.version
        ? `Versão ${proposal.version.number} disponível`
        : 'Proposta disponível para análise');
  } else if (isAccepted || isComplete) {
    contextText = 'Projeto em acompanhamento';
  }

  const solutionLabel = getProposalSolutionLabel(proposal) || 'Categoria não informada';
  const location = getProposalLocation(proposal);

  // Formatação de referência
  const refDisplay = proposal.reference
    ? proposal.reference.replace(/^AS-2026-D0*/, '') || proposal.reference
    : null;

  return (
    <article
      className="flex min-w-0 flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 text-left shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs"
      aria-labelledby={`prop-title-${proposal.id}`}
    >
      <div>
        {/* Linha 1: Logotipo (36-40px) + Nome da Empresa + Referência */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-white p-1 overflow-hidden shadow-2xs">
            <CompactCompanyAvatar proposal={proposal} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3
                id={`prop-title-${proposal.id}`}
                className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate"
              >
                {proposal.company.name}
              </h3>
              {refDisplay && (
                <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600">
                  #{refDisplay}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500 font-medium truncate">
              {solutionLabel} • {location}
            </p>
            <p className="mt-0.5 text-[11px] sm:text-xs text-slate-600 font-normal truncate">
              {contextText}
            </p>
          </div>
        </div>

        {/* Linha 2: Status Badge + Status Auxiliar */}
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border',
              statusBadgeClass
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', statusDotColor)} />
            <span>{statusBadgeText}</span>
          </span>

          <span className="text-[11px] font-medium text-slate-500 truncate">
            {statusAuxText}
          </span>
        </div>

        {/* Linha 3: Métricas Técnicas Reais OU Indicador de Espera */}
        {hasMetrics ? (
          <div className="mt-2.5 grid grid-cols-2 gap-2 rounded-xl bg-slate-50/70 p-2 text-xs">
            {power && (
              <div className="flex items-center gap-1.5 min-w-0">
                <Zap className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                <span className="truncate text-[11px] text-slate-500">Potência:</span>
                <span className="font-bold text-slate-800 tabular-nums text-[11px] truncate">
                  {power}
                </span>
              </div>
            )}
            {generation && (
              <div className="flex items-center gap-1.5 min-w-0">
                <BarChart2 className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                <span className="truncate text-[11px] text-slate-500">Geração:</span>
                <span className="font-bold text-slate-800 tabular-nums text-[11px] truncate">
                  {generation}
                </span>
              </div>
            )}
            {price.isAvailable && (
              <div className="flex items-center gap-1.5 min-w-0 col-span-2">
                <DollarSign className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                <span className="truncate text-[11px] text-slate-500">Total:</span>
                <span className="font-bold text-slate-900 tabular-nums text-[12px] truncate">
                  {price.formatted}
                </span>
              </div>
            )}
          </div>
        ) : !isSentOrReady ? (
          <div className="mt-2.5 rounded-xl bg-slate-50/60 px-2.5 py-1.5 text-[11px] text-slate-500">
            Proposta comercial ainda não publicada.
          </div>
        ) : null}
      </div>

      {/* Linha 4: Ações */}
      <div className="mt-3.5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
        {/* Botão de Comparação (Apenas se elegível) */}
        {canCompare && onToggleCompare && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onToggleCompare(proposal.id)}
            aria-label={`Comparar proposta de ${proposal.company.name}`}
            className={cn(
              'h-9 gap-1.5 rounded-xl text-xs font-semibold px-3 transition-colors',
              isComparing
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-slate-200 text-blue-600 hover:bg-slate-50'
            )}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            <span>{isComparing ? 'Selecionada' : 'Comparar'}</span>
          </Button>
        )}

        {/* CTA Principal */}
        <Button
          type="button"
          size="sm"
          onClick={() => onOpen(proposal)}
          aria-label={
            isComplete || isAccepted
              ? `Ver projeto de ${proposal.company.name}`
              : isSentOrReady
              ? `Ver proposta de ${proposal.company.name}`
              : `Acompanhar solicitação de ${proposal.company.name}`
          }
          className={cn(
            'h-9 min-h-[44px] sm:min-h-[36px] gap-1.5 rounded-xl text-xs sm:text-sm font-semibold px-3.5 sm:px-4 shadow-2xs',
            isComplete
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          )}
        >
          <span>
            {isComplete || isAccepted
              ? 'Ver projeto'
              : isSentOrReady
              ? 'Ver proposta'
              : 'Acompanhar'}
          </span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </article>
  );
}
