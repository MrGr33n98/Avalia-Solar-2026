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
      className="flex min-w-0 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 text-left shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs"
      aria-labelledby={`prop-title-${proposal.id}`}
    >
      <div>
        {/* ── TOPO: LOGO + NOME/VERIFICAÇÃO/RATING + STATUS PILL ── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {/* Logo Quadrada Arredondada (48x48) */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-white p-1 overflow-hidden shadow-2xs">
              <CompactCompanyAvatar proposal={proposal} />
            </div>

            {/* Nome, Verificado e Metadados */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3
                  id={`prop-title-${proposal.id}`}
                  className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate"
                >
                  {proposal.company.name}
                </h3>
                {proposal.company.verified && (
                  <CompanyVerifiedBadge size="sm" className="shrink-0" />
                )}
              </div>

              {/* Linha de Avaliação e Localização */}
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 font-medium truncate">
                {ratingAvg && (
                  <span className="flex items-center gap-1 font-bold text-slate-700 shrink-0">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span>{ratingAvg}</span>
                    <span className="font-normal text-slate-400">({reviewsCount})</span>
                    <span className="text-slate-300">•</span>
                  </span>
                )}
                <span className="flex items-center gap-1 truncate text-slate-500">
                  <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                  <span className="truncate">{location}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Tag de Status Verde/Neutro no Canto Superior Direito */}
          <span
            className={cn(
              'shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap',
              statusBadgeClass
            )}
          >
            {statusBadgeText}
          </span>
        </div>

        {/* ── PREÇO EM DESTAQUE E ESPECIFICAÇÃO RESUMIDA ── */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                Valor total
              </span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight tabular-nums leading-tight">
                {price.formatted}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-slate-500 truncate">
                {formattedPower ? `${formattedPower} • ` : ''}
                {solutionLabel}
              </p>
            </div>

            {/* Checkbox / Botão Comparar */}
            {canCompare && onToggleCompare && (
              <label
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border cursor-pointer select-none text-xs font-medium transition',
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
                  className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-0"
                />
                <span>Comparar</span>
              </label>
            )}
          </div>
        </div>

        {/* ── GRID TÉCNICO DE 3 COLUNAS LADO A LADO (Zero quebra) ── */}
        {isSentOrReady && (
          <div className="mt-3.5 bg-slate-50/90 border border-slate-200/70 rounded-xl p-2.5 grid grid-cols-3 divide-x divide-slate-200/70">
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
                {formatWarrantyTerm(getProposalRawTerm(proposal, ['warranty', 'garantia'])) || '2 anos'}
              </p>
            </div>

            <div className="px-2">
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">Prazo</span>
              </div>
              <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                {formatDeadlineTerm(getProposalRawTerm(proposal, ['installation_deadline', 'installation_time', 'prazo'])) || '15 a 45 dias'}
              </p>
            </div>
          </div>
        )}

        {!isSentOrReady && (
          <div className="mt-3.5 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-500 border border-slate-100">
            Aguardando resposta da empresa
          </div>
        )}
      </div>

      {/* ── BASE: 2 BOTÕES DE ALTA ERGONOMIA (Ver proposta / Escolher empresa) ── */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
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
          className="flex-1 h-9 rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 px-2.5 gap-1.5 shadow-2xs"
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
            className="h-9 px-2.5 rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 gap-1 shrink-0"
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
            className="flex-[1.35] h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-2.5 gap-1 shadow-xs"
          >
            <Check className="h-3.5 w-3.5" />
            <span className="truncate">Concluído</span>
          </Button>
        ) : isAccepted ? (
          <Button
            type="button"
            size="sm"
            onClick={() => onOpen(proposal)}
            className="flex-[1.35] h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-2.5 gap-1 shadow-xs"
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
            className="flex-[1.35] h-9 rounded-xl bg-[#F5B800] hover:bg-[#E5AC00] text-slate-950 text-xs font-extrabold px-3 shadow-2xs transition active:scale-[0.99]"
          >
            <span className="truncate">Escolher empresa</span>
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onOpen(proposal)}
            className="flex-1 h-9 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 px-2.5"
          >
            <span className="truncate">Detalhes</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        )}
      </div>
    </article>
  );
}
