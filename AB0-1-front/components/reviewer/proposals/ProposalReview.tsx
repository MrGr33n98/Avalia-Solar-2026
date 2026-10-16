'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Award,
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileText,
  HelpCircle,
  LifeBuoy,
  MessageCircle,
  MoreHorizontal,
  Phone,
  ShieldCheck,
  Star,
  Upload,
  Wrench,
} from 'lucide-react';
import { reviewsApi, type MarketplaceProposal } from '@/lib/api';
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

interface ProposalReviewProps {
  proposal: MarketplaceProposal;
  onBack: () => void;
  onSubmitted?: () => void;
  onViewProposal?: () => void;
  onConversation?: () => void;
}

export function ProposalReview({
  proposal,
  onBack,
  onSubmitted,
  onViewProposal,
  onConversation,
}: ProposalReviewProps) {
  const [overallRating, setOverallRating] = useState(5);
  const [equipmentRating, setEquipmentRating] = useState(5);
  const [deadlineRating, setDeadlineRating] = useState(5);
  const [communicationRating, setCommunicationRating] = useState(5);
  const [installationRating, setInstallationRating] = useState(5);
  const [postSaleRating, setPostSaleRating] = useState(5);
  const [costBenefitRating, setCostBenefitRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const power = getProposalRawTerm(proposal, [
    'system_power',
    'power_kwp',
    'potencia',
    'installed_power',
  ]);
  const generation = getProposalRawTerm(proposal, ['monthly_generation', 'geracao', 'generation_kwh']);
  const deadline = getProposalRawTerm(proposal, [
    'installation_deadline',
    'prazo',
    'installation_time',
  ]);
  const savings = getProposalRawTerm(proposal, ['monthly_savings', 'economia', 'estimated_savings']);
  const price = getProposalDisplayPrice(proposal);
  const location = getProposalLocation(proposal);
  const reference = proposal.reference;
  const completedAt = proposal.project?.completed_at || proposal.created_at;
  const projectProfile = proposal.request?.project_profile?.trim();

  // 8 Fases do Stepper
  const stepperPhases = [
    { id: 1, label: 'Proposta', status: 'Concluída', completed: true },
    { id: 2, label: 'Negociação', status: 'Concluída', completed: true },
    { id: 3, label: 'Contrato', status: 'Concluída', completed: true },
    { id: 4, label: 'Projeto', status: 'Concluída', completed: true },
    { id: 5, label: 'Instalação', status: 'Concluída', completed: true },
    { id: 6, label: 'Homologação', status: 'Concluída', completed: true },
    { id: 7, label: 'Projeto concluído', status: 'Concluído', completed: true },
    { id: 8, label: 'Avaliação', status: 'Sua experiência', current: true },
  ];

  const ratingLabels: Record<number, string> = {
    1: 'Ruim',
    2: 'Razoável',
    3: 'Bom',
    4: 'Muito bom',
    5: 'Excelente',
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await reviewsApi.create({
        company_id: proposal.company.id,
        rating: overallRating,
        comment: comment.trim(),
        content_metadata: {
          equipment_rating: equipmentRating,
          deadline_rating: deadlineRating,
          communication_rating: communicationRating,
          installation_rating: installationRating,
          post_sale_rating: postSaleRating,
          cost_benefit_rating: costBenefitRating,
          proposal_id: proposal.id,
          project_id: proposal.project?.id,
          proposal_code: proposal.code,
        },
      });
      setSubmitted(true);
      if (onSubmitted) onSubmitted();
    } catch (err: unknown) {
      console.error('[ProposalReview] Falha ao enviar avaliação:', err);
      setSubmitError(
        err instanceof Error ? err.message : 'Não foi possível registrar a avaliação. Tente novamente.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  function StarPicker({
    value,
    onChange,
    size = 'md',
  }: {
    value: number;
    onChange: (val: number) => void;
    size?: 'sm' | 'md' | 'lg';
  }) {
    const starClass =
      size === 'lg'
        ? 'h-7 w-7'
        : size === 'md'
        ? 'h-5 w-5'
        : 'h-4 w-4';

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-0.5 text-amber-400 hover:scale-110 transition-transform focus:outline-none"
          >
            <Star
              className={cn(
                starClass,
                star <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
              )}
            />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6 pb-16 text-slate-900 font-sans">
      {/* ── BOTÃO VOLTAR E TÍTULOS ─────────────────────────────────── */}
      <div className="space-y-1">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Voltar para propostas</span>
        </button>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 mt-1">
          Avaliação e feedback
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Conte sua experiência e ajude outros usuários a encontrar as melhores empresas.
        </p>
      </div>

      {/* ── CARD PRINCIPAL DE IDENTIFICAÇÃO DO PROJETO ───────────────── */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-2xl border border-slate-100 bg-white p-1 flex items-center justify-center overflow-hidden shadow-2xs">
            <CompanyMark proposal={proposal} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-950 leading-tight">
                {proposal.company.name}
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200/60">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Projeto concluído</span>
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">{location}</p>
            {proposal.company.rating_avg ? (
              <div className="mt-1 flex items-center gap-1 text-xs text-amber-500">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-extrabold text-slate-900">
                  {proposal.company.rating_avg.toFixed(1)}
                </span>
                {proposal.company.reviews_count ? (
                  <span className="text-slate-400 font-normal">
                    ({proposal.company.reviews_count} avaliações)
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-slate-950">Proposta #{reference}</p>
              <p className="text-xs text-slate-600 font-medium">{proposal.version?.title || 'Título não informado'}</p>
              <p className="text-[11px] text-slate-400">Concluída em {formatDate(completedAt)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onViewProposal && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewProposal}
                className="gap-1.5 rounded-xl border-slate-200 text-slate-800 hover:bg-slate-50 text-xs sm:text-sm font-bold h-9 px-3.5 shadow-2xs"
              >
                <span>Ver proposta</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl border-slate-200 text-slate-500 hover:bg-slate-50 shadow-2xs"
              title="Mais opções"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── STEPPER HORIZONTAL DE 8 ETAPAS ───────────────────────────── */}
      <section
        aria-label="Fluxo da proposta"
        className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs"
      >
        <div className="min-w-[840px] flex items-center justify-between relative px-6 py-2">
          <div
            className="absolute left-10 right-10 top-5 h-0.5 bg-blue-600 -translate-y-1/2 z-0"
            aria-hidden="true"
          />

          {stepperPhases.map((phase) => (
            <div key={phase.id} className="relative z-10 flex flex-col items-center text-center">
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all shadow-xs ring-4 ring-white',
                  phase.completed && 'bg-blue-600 text-white',
                  phase.current && 'bg-blue-600 text-white ring-4 ring-blue-100'
                )}
              >
                {phase.completed ? (
                  <Check className="h-4 w-4 stroke-[3]" />
                ) : (
                  <span className="text-[11px] font-extrabold">{phase.id}</span>
                )}
              </div>
              <span className="mt-2 text-xs font-bold text-slate-900">{phase.label}</span>
              <span
                className={cn(
                  'text-[11px] font-medium mt-0.5',
                  phase.current ? 'text-blue-600 font-bold' : 'text-slate-400'
                )}
              >
                {phase.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── GRID PRINCIPAL: FORMULÁRIO (ESQUERDA) + SIDEBAR (DIREITA) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Coluna Esquerda: Formulário de Avaliação Completo */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <Star className="h-5 w-5 text-blue-600 fill-blue-600" />
              <div>
                <h3 className="text-base font-extrabold text-slate-950">Avalie sua experiência</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Sua opinião é muito importante para outros usuários da plataforma.
                </p>
              </div>
            </div>

            {/* Avaliação geral */}
            <div className="rounded-2xl bg-slate-50/80 border border-slate-100 p-5 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Qual a sua avaliação geral da empresa?
              </label>
              <div className="flex items-center gap-4">
                <StarPicker value={overallRating} onChange={setOverallRating} size="lg" />
                <span className="text-sm font-extrabold text-slate-900 bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-2xs">
                  {ratingLabels[overallRating]}
                </span>
              </div>
            </div>

            {/* 6 Critérios em Grid 2 Colunas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-800">Qualidade dos equipamentos</span>
                <StarPicker value={equipmentRating} onChange={setEquipmentRating} size="sm" />
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-800">Qualidade da instalação</span>
                <StarPicker value={installationRating} onChange={setInstallationRating} size="sm" />
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-800">Cumprimento de prazos</span>
                <StarPicker value={deadlineRating} onChange={setDeadlineRating} size="sm" />
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-800">Suporte pós-venda</span>
                <StarPicker value={postSaleRating} onChange={setPostSaleRating} size="sm" />
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-800">Atendimento e comunicação</span>
                <StarPicker value={communicationRating} onChange={setCommunicationRating} size="sm" />
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-800">Custo-benefício</span>
                <StarPicker value={costBenefitRating} onChange={setCostBenefitRating} size="sm" />
              </div>
            </div>

            {/* Campo de comentário */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-slate-800">
                Conte mais sobre sua experiência (opcional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 1000))}
                rows={4}
                placeholder="Ex.: Como foi o atendimento, a qualidade da instalação, cumprimento de prazos, suporte, pontos positivos e o que pode melhorar..."
                className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <div className="flex justify-end text-[11px] font-semibold text-slate-400">
                {comment.length}/1000
              </div>
            </div>

            {/* Upload de fotos */}
            <div className="space-y-3 border-t border-slate-100 pt-5">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">Adicionar fotos (opcional)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                As fotos ajudam outros usuários a conhecerem melhor a empresa e a qualidade do serviço.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="col-span-2 flex min-h-24 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 text-center text-[11px] font-semibold text-slate-400 sm:col-span-3">
                  Nenhuma foto adicionada.
                </div>

                <button
                  type="button"
                  className="flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-300 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <span className="text-xl font-bold">+</span>
                  <span className="text-[11px] font-bold">Adicionar fotos</span>
                </button>
              </div>
            </div>

            {/* Toggle público */}
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 border-t pt-5">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 block">
                  Permitir que minha avaliação seja pública
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Sua avaliação ficará visível no perfil da empresa e ajudará outros usuários.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                  isPublic ? 'bg-blue-600' : 'bg-slate-300'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                    isPublic ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>

            {submitError && (
              <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {submitError}
              </div>
            )}

            {/* CTA de Envio */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={submitting || submitted}
                className="w-full sm:w-auto h-11 px-8 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md text-sm gap-2"
              >
                <span>{submitted ? 'Avaliação enviada com sucesso!' : 'Enviar avaliação'}</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        </form>

        {/* Coluna Direita: Sidebar (Resumo + Badge + Suporte) */}
        <aside className="space-y-5">
          {/* Card 1: Resumo do projeto */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-extrabold text-slate-950">Resumo do projeto</h3>
            </div>

            <div className="relative h-32 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
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

            <div>
              <h4 className="text-sm font-extrabold text-slate-950">
                {proposal.version?.title || 'Título não informado'}
              </h4>
              <p className="text-xs text-slate-500 font-medium">{location}</p>
              {projectProfile && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                    {projectProfile}
                  </span>
                </div>
              )}
            </div>

            <dl className="divide-y divide-slate-100 text-xs pt-1">
              <div className="py-2 flex items-center justify-between">
                <dt className="text-slate-500">Potência do sistema</dt>
                <dd className="font-extrabold text-slate-900">{power || 'Não informado'}</dd>
              </div>
              <div className="py-2 flex items-center justify-between">
                <dt className="text-slate-500">Geração estimada</dt>
                <dd className="font-extrabold text-slate-900">{generation || 'Não informado'}</dd>
              </div>
              <div className="py-2 flex items-center justify-between">
                <dt className="text-slate-500">Valor total</dt>
                <dd className="font-extrabold text-emerald-600">{price.formatted}</dd>
              </div>
              <div className="py-2 flex items-center justify-between">
                <dt className="text-slate-500">Economia estimada</dt>
                <dd className="font-extrabold text-emerald-600">{savings || 'Não informado'}</dd>
              </div>
              <div className="py-2 flex items-center justify-between">
                <dt className="text-slate-500">Prazo de instalação</dt>
                <dd className="font-extrabold text-slate-900">{deadline || 'Não informado'}</dd>
              </div>
            </dl>

            {onViewProposal && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewProposal}
                className="w-full rounded-xl border-slate-200 text-xs font-bold text-blue-600 hover:bg-slate-50"
              >
                Ver proposta completa →
              </Button>
            )}
          </section>

          {/* Card 2: Conquiste seu badge! */}
          <section className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/60 to-orange-50/40 p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 border-b border-amber-200/60 pb-3">
              <Award className="h-5 w-5 text-amber-600" />
              <h3 className="text-sm font-extrabold text-slate-950">Conquiste seu badge!</h3>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md">
                <Award className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-extrabold text-slate-900">Usuário Consciente</h4>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  Compartilhe sua experiência e ajude outros usuários a fazerem escolhas melhores.
                </p>
              </div>
            </div>
          </section>

          {/* Card 3: Precisa de algo? */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <HelpCircle className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-extrabold text-slate-950">Precisa de algo?</h3>
            </div>

            <div className="space-y-1 text-xs">
              <button
                type="button"
                onClick={onConversation}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 font-bold text-slate-700 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-blue-600" />
                  <span>Falar com a empresa</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                type="button"
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 font-bold text-slate-700 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <LifeBuoy className="h-4 w-4 text-blue-600" />
                  <span>Abrir chamado de suporte</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                type="button"
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 font-bold text-slate-700 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-blue-600" />
                  <span>Solicitar manutenção</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                type="button"
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 font-bold text-slate-700 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  <span>Ver garantias do sistema</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
