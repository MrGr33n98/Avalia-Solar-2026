'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart2,
  Check,
  Clock,
  DollarSign,
  FileText,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  Zap,
} from 'lucide-react';
import type { MarketplaceProposal } from '@/lib/api';
import {
  canDecide,
  formatDeadlineTerm,
  formatGenerationTerm,
  formatMoney,
  formatPowerTerm,
  formatRelativeDay,
  formatWarrantyTerm,
  getProposalCardMetrics,
  getProposalDisplayPrice,
  getProposalLocation,
  getProposalRawTerm,
  getProposalSolutionLabel,
  isProposalCompleted,
  isProposalReceived,
  proposalChatUrl,
  proposalStatus,
} from '@/lib/marketplace-proposals';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CompanyVerifiedBadge } from '@/components/company/CompanyVerifiedBadge';
import { CompanyMark } from './ProposalSummary';

export interface ProposalCompactCardProps {
  proposal: MarketplaceProposal;
  onOpen: (proposal: MarketplaceProposal) => void;
  onToggleCompare?: (id: number) => void;
  isComparing?: boolean;
  canCompare?: boolean;
  onChoose?: (proposal: MarketplaceProposal) => void;
  onConversation?: (proposal: MarketplaceProposal) => void;
}

function CompactCompanyAvatar({ proposal }: { proposal: MarketplaceProposal }) {
  if (proposal.company.logo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={proposal.company.logo_url}
        alt={`Logo da empresa ${proposal.company.name}`}
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
  onChoose,
  onConversation,
}: ProposalCompactCardProps) {
  const isSentOrReady = isProposalReceived(proposal);
  const isUnderAnalysis = proposal.status === 'draft' || proposal.status === 'under_review';
  const isComplete = isProposalCompleted(proposal);
  const isAccepted = proposal.status === 'accepted';
  const isEligibleToDecide = canDecide(proposal);

  const price = getProposalDisplayPrice(proposal);
  const solutionLabel = getProposalSolutionLabel(proposal) || 'Residencial';
  const location = getProposalLocation(proposal);

  // Potência principal para o subtítulo do preço
  const rawPower = getProposalRawTerm(proposal, [
    'system_power',
    'power_kwp',
    'installed_power',
    'potencia',
  ]);
  const formattedPower = formatPowerTerm(rawPower);

  // Métricas técnicas da grade de especificações
  const metrics = getProposalCardMetrics(proposal);

  // Rating real da empresa
  const ratingAvg =
    proposal.company.rating_avg != null && proposal.company.rating_avg > 0
      ? Number(proposal.company.rating_avg).toFixed(1).replace('.', ',')
      : null;
  const reviewsCount = proposal.company.reviews_count || 0;

  // Status tag superior direita
  let statusBadgeText = 'Em análise';
  let statusBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200/60';

  if (isComplete) {
    statusBadgeText = '✓ Projeto concluído';
    statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
  } else if (isAccepted) {
    statusBadgeText = '✓ Empresa escolhida';
    statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
  } else if (isSentOrReady) {
    const pubRel = formatRelativeDay(
      proposal.published_at || proposal.version?.published_at || proposal.created_at
    );
    statusBadgeText = pubRel === 'hoje' ? '✓ Proposta recebida hoje' : pubRel ? `✓ Proposta recebida ${pubRel}` : '✓ Proposta recebida';
    statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
  } else if (isUnderAnalysis) {
    statusBadgeText = 'Em análise';
    statusBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200/60';
  } else {
    statusBadgeText = proposalStatus(proposal);
    statusBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
  }

  // Verifica existência de documento / anexo da proposta
  const hasDocuments =
    Boolean(proposal.version?.documents && proposal.version.documents.length > 0);

  return (
    <article
      data-testid="buyer-proposal-card" className="flex min-w-0 flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 text-left shadow-none transition-colors hover:border-slate-300 sm:p-4"
      aria-labelledby={`prop-title-${proposal.id}`}
    >
      <div>
        {/* ── TOPO: LOGO + NOME/VERIFICAÇÃO/RATING + STATUS PILL ── */}
        <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-2">
          <div className="flex min-w-0 flex-[1_1_180px] items-start gap-2.5">
            {/* Logo Quadrada Arredondada (48x48) */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-1 sm:h-11 sm:w-11">
              <CompactCompanyAvatar proposal={proposal} />
            </div>

            {/* Nome, Verificado e Metadados */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3
                  id={`prop-title-${proposal.id}`}
                  className="text-sm font-semibold leading-5 text-slate-900 [overflow-wrap:anywhere] sm:text-base"
                >
                  {proposal.company.name}
                </h3>
                {proposal.company.verified && (
                  <CompanyVerifiedBadge size="sm" className="shrink-0" />
                )}
              </div>

              {/* Linha de Avaliação e Localização */}
              <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-1.5 text-xs font-medium leading-[18px] text-slate-600">
                {ratingAvg && (
                  <span className="flex items-center gap-1 font-bold text-slate-700 shrink-0">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span>{ratingAvg}</span>
                    <span className="font-normal text-slate-400">({reviewsCount})</span>
                    <span className="text-slate-300">•</span>
                  </span>
                )}
                <span className="flex min-w-0 items-center gap-1 text-slate-600">
                  <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                  <span className="[overflow-wrap:anywhere]">{location}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Tag de Status Verde/Neutro no Canto Superior Direito */}
          <span
            className={cn(
              'inline-flex max-w-full shrink-0 items-center rounded-md border px-2 py-1 text-[11px] font-medium leading-4 [overflow-wrap:anywhere]',
              statusBadgeClass
            )}
          >
            {statusBadgeText}
          </span>
        </div>

        {/* ── PREÇO EM DESTAQUE E ESPECIFICAÇÃO RESUMIDA ── */}
        <div className="mt-2 border-t border-slate-100 pt-2">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Valor total
              </span>
              <p className="text-[22px] font-bold leading-7 tracking-tight tabular-nums text-slate-900 [overflow-wrap:anywhere] sm:text-2xl">
                {price.formatted}
              </p>
              <p className="mt-0.5 text-xs font-medium leading-[18px] text-slate-600 [overflow-wrap:anywhere]">
                {formattedPower ? `${formattedPower} • ` : ''}
                {solutionLabel}
              </p>
            </div>

            {/* Checkbox / Botão Comparar */}
            {canCompare && onToggleCompare && (
              <label
                className={cn(
                  'inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium cursor-pointer select-none transition-colors',
                  isComparing
                    ? 'border-blue-600 bg-blue-50/80 text-blue-700 ring-1 ring-blue-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                )}
              >
                <input
                  type="checkbox"
                  checked={isComparing}
                  onChange={() => onToggleCompare(proposal.id)}
                  aria-label={`Comparar proposta de ${proposal.company.name}`}
                  className="h-4 w-4 rounded text-blue-600 focus:ring-2 focus:ring-blue-600"
                />
                <span>Comparar</span>
              </label>
            )}
          </div>
        </div>

        {/* ── GRID TÉCNICO DE 3 COLUNAS LADO A LADO (Zero quebra) ── */}
        {isSentOrReady && (
          <div className="mt-2 grid min-h-12 grid-cols-3 divide-x divide-slate-200 rounded-lg border border-slate-200 bg-slate-50/70 p-2">
            <div className="px-1.5 first:pl-0.5">
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <Zap className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">Potência</span>
              </div>
              <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                {formattedPower || 'A definir'}
              </p>
            </div>

            <div className="px-2">
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <ShieldCheck className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">Garantia</span>
              </div>
              <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                {formatWarrantyTerm(getProposalRawTerm(proposal, ['warranty', 'garantia'])) || 'A definir'}
              </p>
            </div>

            <div className="px-2">
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">Prazo</span>
              </div>
              <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                {formatDeadlineTerm(getProposalRawTerm(proposal, ['installation_deadline', 'installation_time', 'prazo'])) || 'A definir'}
              </p>
            </div>
          </div>
        )}

        {!isSentOrReady && (
          <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs text-slate-600">
            Aguardando resposta da empresa
          </div>
        )}
      </div>

      {/* ── BASE: 2 BOTÕES DE ALTA ERGONOMIA (Ver proposta / Escolher empresa) ── */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
        {/* 1. Ver proposta (secundário, à esquerda) */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onOpen(proposal)}
          aria-label={
            isComplete || isAccepted
              ? `Ver projeto de ${proposal.company.name}`
              : isSentOrReady
              ? `Ver proposta de ${proposal.company.name}`
              : `Acompanhar solicitação de ${proposal.company.name}`
          }
          className="h-11 !min-h-11 min-w-0 flex-[1_1_115px] gap-1 rounded-lg border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
        >
          <FileText className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          <span className="truncate">
            {isComplete || isAccepted ? 'Ver projeto' : isSentOrReady ? 'Ver proposta (PDF)' : 'Acompanhar'}
          </span>
        </Button>

        {/* 2. Conversar (se handler fornecido opcional) */}
        {onConversation && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onConversation(proposal)}
            aria-label={`Conversar com ${proposal.company.name}`}
            className="h-11 !min-h-11 w-11 !min-w-11 shrink-0 gap-1 rounded-lg border-slate-200 bg-white px-0 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50 sm:w-auto sm:px-2.5"
            title="Chat com a empresa"
          >
            <MessageCircle className="h-3.5 w-3.5 text-blue-600" />
            <span className="hidden sm:inline">Chat</span>
          </Button>
        )}

        {/* 3. Escolher empresa (CTA primário amarelo #F5B800 à direita) */}
        {isComplete ? (
          <Button
            type="button"
            size="sm"
            onClick={() => onOpen(proposal)}
            className="h-11 !min-h-11 min-w-0 flex-[1_1_130px] gap-1 rounded-lg bg-emerald-600 px-2.5 text-xs font-bold text-white shadow-none hover:bg-emerald-700"
          >
            <Check className="h-3.5 w-3.5" />
            <span className="truncate">Concluído</span>
          </Button>
        ) : isAccepted ? (
          <Button
            type="button"
            size="sm"
            onClick={() => onOpen(proposal)}
            className="h-11 !min-h-11 min-w-0 flex-[1_1_130px] gap-1 rounded-lg bg-blue-600 px-2.5 text-xs font-bold text-white shadow-none hover:bg-blue-700"
          >
            <Check className="h-3.5 w-3.5" />
            <span className="truncate">Escolhida</span>
          </Button>
        ) : isSentOrReady && isEligibleToDecide ? (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              if (onChoose) onChoose(proposal);
              else onOpen(proposal);
            }}
            aria-label={`Escolher ${proposal.company.name}`}
            className="h-11 !min-h-11 min-w-0 flex-[1_1_130px] rounded-lg bg-[#F5B800] px-2.5 text-xs font-bold text-slate-950 shadow-none transition hover:bg-[#E5AC00]"
          >
            <span className="truncate">Escolher empresa</span>
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onOpen(proposal)}
            className="h-11 !min-h-11 min-w-0 flex-1 rounded-lg px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            <span className="truncate">Detalhes</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        )}
      </div>
    </article>
  );
}
