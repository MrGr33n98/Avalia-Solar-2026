'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BarChart2,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  Download,
  ExternalLink,
  FileText,
  Headphones,
  HelpCircle,
  Image as ImageIcon,
  Leaf,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Share2,
  ShieldCheck,
  Star,
  ThumbsUp,
  Wrench,
  Zap,
} from 'lucide-react';
import { reviewsApi, type MarketplaceProposal, type Review } from '@/lib/api';
import {
  formatDate,
  formatMoney,
  getProposalDisplayPrice,
  getProposalLocation,
  getProposalRawTerm,
  isProjectComplete,
  proposalChatUrl,
} from '@/lib/marketplace-proposals';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CompanyMark } from './ProposalSummary';

interface ProposalProjectProps {
  proposal: MarketplaceProposal;
  onViewProposal: () => void;
  onList?: () => void;
}

const steps = [
  { id: 1, label: 'Proposta', status: 'Concluída' },
  { id: 2, label: 'Negociação', status: 'Concluída' },
  { id: 3, label: 'Contrato', status: 'Concluído' },
  { id: 4, label: 'Projeto', status: 'Concluído' },
  { id: 5, label: 'Instalação', status: 'Concluída' },
  { id: 6, label: 'Homologação', status: 'Concluída' },
  { id: 7, label: 'Projeto concluído', status: 'Em operação' },
];

const mockDailyGeneration = [
  { day: '14/11', value: 8.5 },
  { day: '15/11', value: 9.8 },
  { day: '16/11', value: 10.4 },
  { day: '17/11', value: 10.9 },
  { day: '18/11', value: 12.2 },
  { day: '19/11', value: 10.1 },
  { day: '20/11', value: 9.2 },
];

export function ProposalProject({ proposal, onViewProposal, onList }: ProposalProjectProps) {
  const [period, setPeriod] = useState<'7d' | '30d' | '12m'>('7d');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(
    'Excelente atendimento desde o início. Equipe técnica muito profissional, instalação rápida e o sistema já está gerando mais do que o esperado. Recomendo!'
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [shareToast, setShareToast] = useState(false);

  // Dados técnicos da proposta ou cálculos reais
  const power =
    getProposalRawTerm(proposal, ['system_power', 'power_kwp', 'potencia', 'installed_power']) ||
    '8,25 kWp';
  const generation =
    getProposalRawTerm(proposal, ['monthly_generation', 'geracao', 'generation_kwh']) ||
    '960 kWh/mês';
  const deadline =
    getProposalRawTerm(proposal, ['installation_deadline', 'prazo', 'installation_time']) ||
    '30 dias';
  const savings =
    getProposalRawTerm(proposal, ['monthly_savings', 'economia', 'estimated_savings']) ||
    'R$ 950/mês';
  const price = getProposalDisplayPrice(proposal);
  const location = getProposalLocation(proposal);
  const reference = proposal.reference || 'AS-2026-001';
  const completedDate = proposal.project?.completed_at
    ? formatDate(proposal.project.completed_at)
    : '15/11/2026';

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Meu projeto solar está concluído!',
        text: `Instalação concluída com sucesso pela ${proposal.company.name}!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 3000);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || submitting) return;
    setSubmitting(true);
    setReviewError('');
    try {
      const profile = proposal.request?.project_profile;
      const projectType = ['residential', 'commercial', 'industrial', 'rural'].includes(profile || '')
        ? (profile as Review['project_type'])
        : undefined;

      await reviewsApi.create({
        company_id: proposal.company.id,
        rating,
        comment: comment.trim(),
        installation_status: 'completed',
        project_type: projectType,
        capture_flow_source: 'lead',
      });
      setSubmitted(true);
    } catch {
      setReviewError('Não foi possível enviar a avaliação. Tente novamente mais tarde.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-5 pb-16 text-slate-900">
      {/* ── BOTÃO VOLTAR E TÍTULOS ─────────────────────────────────── */}
      <div className="space-y-1">
        <button
          type="button"
          onClick={onList || onViewProposal}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para propostas</span>
        </button>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
          Projeto concluído
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Seu sistema está em operação! Veja o resumo final e compartilhe sua experiência.
        </p>
      </div>

      {/* ── CONTEXT CARD DA EMPRESA E PROPOSTA ────────────────────────── */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs">
        {/* Metade Esquerda: Empresa */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-2xl border border-slate-100 bg-white p-1 flex items-center justify-center overflow-hidden shadow-2xs">
            <CompanyMark proposal={proposal} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {proposal.company.name}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
                <Check className="h-3 w-3 stroke-[2.5]" />
                <span>Projeto concluído</span>
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">{location}</p>
            <div className="mt-1 flex items-center gap-1 text-xs text-amber-500">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-bold text-slate-900">
                {proposal.company.rating_avg ? proposal.company.rating_avg.toFixed(1) : '4,8'}
              </span>
              <span className="text-slate-400 font-normal">
                ({proposal.company.reviews_count || 32} avaliações)
              </span>
            </div>
          </div>
        </div>

        {/* Metade Direita: Proposta e Ações */}
        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">Proposta #{reference}</p>
              <p className="text-xs text-slate-600 font-medium">Sistema Residencial {power}</p>
              <p className="text-[11px] text-slate-400">Concluída em {completedDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onViewProposal}
              className="gap-1.5 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 text-xs sm:text-sm font-semibold h-9 px-3.5"
            >
              <span>Ver proposta</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── STEPPER 7 FASES HORIZONTAL ─────────────────────────────────── */}
      <section
        aria-label="Etapas do projeto"
        className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs"
      >
        <div className="min-w-[720px] flex items-center justify-between relative px-2">
          {/* Linha contínua azul */}
          <div
            className="absolute left-6 right-6 top-3.5 h-0.5 bg-blue-600 -translate-y-1/2 -z-0"
            aria-hidden="true"
          />

          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1;
            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center text-center">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all shadow-xs ring-4 ring-white',
                    'bg-blue-600 text-white'
                  )}
                >
                  {isLast ? (
                    <span className="text-[11px] font-extrabold">{step.id}</span>
                  ) : (
                    <Check className="h-4 w-4 stroke-[3]" />
                  )}
                </div>
                <span className="mt-2 text-xs font-bold text-slate-900">{step.label}</span>
                <span
                  className={cn(
                    'text-[11px] font-medium mt-0.5',
                    isLast ? 'text-blue-600 font-semibold' : 'text-slate-400'
                  )}
                >
                  {step.status}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── GRID PRINCIPAL: CONTEÚDO (ESQUERDA) + ASIDE (DIREITA) ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
        {/* ── COLUNA ESQUERDA ────────────────────────────────────────── */}
        <div className="space-y-5 min-w-0">
          {/* Card 1: Celebração Verde */}
          <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-white p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                <Check className="h-6 w-6 stroke-[3]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Seu projeto está concluído!
                </h3>
                <p className="mt-0.5 text-xs sm:text-sm text-slate-600 font-medium">
                  O sistema foi instalado, homologado e já está gerando energia.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="shrink-0 gap-2 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 font-semibold text-xs h-9 px-4 self-start sm:self-auto"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>{shareToast ? 'Link copiado!' : 'Compartilhar conquista'}</span>
            </Button>
          </section>

          {/* Card 2: Desempenho Atual do Sistema (Telemetria) */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-5">
            {/* Cabeçalho */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <BarChart2 className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Desempenho atual do sistema
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Online</span>
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Última atualização: 20/11/2026 às 14:32
              </span>
            </div>

            {/* 4 Cards de Métricas em Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Métrica 1 */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100/60 text-blue-600">
                    <Zap className="h-4 w-4" />
                  </div>
                  <span className="text-base sm:text-lg font-extrabold text-slate-900">
                    8,1 kW
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500 font-medium">
                  Potência instantânea
                </p>
              </div>

              {/* Métrica 2 */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100/60 text-blue-600">
                    <BarChart2 className="h-4 w-4" />
                  </div>
                  <span className="text-base sm:text-lg font-extrabold text-slate-900">
                    52 kWh
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500 font-medium">Geração hoje</p>
              </div>

              {/* Métrica 3 */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100/60 text-emerald-600">
                    <Leaf className="h-4 w-4" />
                  </div>
                  <span className="text-base sm:text-lg font-extrabold text-slate-900">
                    1.560 kWh
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500 font-medium">Geração no mês</p>
              </div>

              {/* Métrica 4 */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100/60 text-amber-600">
                    <Coins className="h-4 w-4" />
                  </div>
                  <span className="text-base sm:text-lg font-extrabold text-slate-900">
                    R$ 156,00
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500 font-medium">
                  Economia estimada (mês)
                </p>
              </div>
            </div>

            {/* Barra de Filtro do Gráfico */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <select className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 focus:outline-none">
                <option>Geração de energia</option>
                <option>Economia financeira</option>
              </select>

              <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                <button
                  type="button"
                  onClick={() => setPeriod('7d')}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-semibold transition-all',
                    period === '7d'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  7 dias
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod('30d')}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-semibold transition-all',
                    period === '30d'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  30 dias
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod('12m')}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-semibold transition-all',
                    period === '12m'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  12 meses
                </button>
              </div>
            </div>

            {/* Gráfico de Barras */}
            <div className="pt-4">
              <div className="relative h-44 w-full flex items-end justify-between gap-2 border-b border-slate-200 pb-2">
                {/* Linhas de Referência Y */}
                <div className="absolute inset-x-0 top-0 border-b border-dashed border-slate-100 text-[10px] text-slate-400">
                  <span className="absolute -top-3 left-0">15 kWh</span>
                </div>
                <div className="absolute inset-x-0 top-1/3 border-b border-dashed border-slate-100 text-[10px] text-slate-400">
                  <span className="absolute -top-3 left-0">10 kWh</span>
                </div>
                <div className="absolute inset-x-0 top-2/3 border-b border-dashed border-slate-100 text-[10px] text-slate-400">
                  <span className="absolute -top-3 left-0">5 kWh</span>
                </div>
                <div className="absolute -bottom-2 left-0 text-[10px] text-slate-400">0</div>

                {/* Barras de 7 Dias */}
                {mockDailyGeneration.map((bar) => {
                  const heightPercent = Math.min(100, (bar.value / 15) * 100);
                  return (
                    <div
                      key={bar.day}
                      className="group relative flex-1 flex flex-col items-center justify-end h-full z-10"
                    >
                      {/* Tooltip ao passar o cursor */}
                      <div className="pointer-events-none absolute -top-8 hidden rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm group-hover:block whitespace-nowrap">
                        {bar.value.toFixed(1)} kWh
                      </div>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[38px] rounded-t-md bg-blue-500 hover:bg-blue-600 transition-all cursor-pointer"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Rótulos dos Dias no Eixo X */}
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 pt-2 px-1">
                {mockDailyGeneration.map((b) => (
                  <span key={b.day} className="text-center flex-1">
                    {b.day}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Card 3: Fotos do Projeto */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Camera className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Fotos do projeto</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Foto 1: Painéis no Telhado */}
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
                <img
                  src="https://images.unsplash.com/photo-1509391365360-2e959784a276?w=400&auto=format&fit=crop&q=80"
                  alt="Painéis solares no telhado"
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Foto 2: Inversor na Parede */}
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
                <img
                  src="https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=400&auto=format&fit=crop&q=80"
                  alt="Inversor instalado"
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Foto 3: Quadro Elétrico */}
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
                <img
                  src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&auto=format&fit=crop&q=80"
                  alt="Quadro de distribuição elétrica"
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Slot "+ Adicionar fotos" */}
              <button
                type="button"
                className="aspect-[4/3] rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/30 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center text-blue-600 gap-1.5 p-2"
              >
                <Plus className="h-5 w-5" />
                <span className="text-xs font-semibold">Adicionar fotos</span>
              </button>
            </div>
          </section>

          {/* Card 4: Avalie sua Experiência */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Star className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Avalie sua experiência</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium -mt-2">
              Conte para outros usuários como foi sua experiência com a empresa e com o projeto.
            </p>

            {submitted ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center space-y-2">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
                <h4 className="text-sm font-bold text-emerald-900">Avaliação enviada com sucesso!</h4>
                <p className="text-xs text-emerald-700">
                  Obrigado por ajudar outros usuários a escolherem a melhor empresa de energia solar.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {/* 5 Estrelas Selecionáveis */}
                <div className="flex items-center gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 text-slate-300 hover:scale-110 transition-transform focus:outline-none"
                    >
                      <Star
                        className={cn(
                          'h-7 w-7 transition-colors',
                          star <= (hoverRating || rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        )}
                      />
                    </button>
                  ))}
                </div>

                {/* Campo de Comentário */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    className="flex-1 rounded-xl border-slate-200 text-xs sm:text-sm font-medium focus:border-blue-500 focus:ring-blue-500/20"
                    placeholder="Conte como foi sua experiência com a empresa..."
                  />

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="shrink-0 h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-2xs"
                  >
                    {submitting ? 'Enviando…' : 'Enviar avaliação'}
                  </Button>
                </div>

                {reviewError && (
                  <p role="alert" className="text-xs font-semibold text-red-600">
                    {reviewError}
                  </p>
                )}
              </form>
            )}
          </section>
        </div>

        {/* ── COLUNA DIREITA (ASIDE 340px) ───────────────────────────── */}
        <aside className="space-y-5">
          {/* Card 1: Resumo do Projeto */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FileText className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Resumo do projeto</h3>
            </div>

            {/* Imagem do Projeto */}
            <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-slate-100">
              <img
                src="https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80"
                alt="Sistema Residencial"
                className="h-full w-full object-cover"
              />
            </div>

            {/* Título e Localização */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 leading-tight">
                Sistema Residencial {power}
              </h4>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 font-medium">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>{location}</span>
              </p>
            </div>

            {/* Chips / Tags */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                On-grid
              </span>
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                Residencial
              </span>
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                Alta eficiência
              </span>
            </div>

            {/* Linhas Chave/Valor */}
            <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-blue-600" />
                  <span>Potência do sistema</span>
                </span>
                <span className="font-bold text-slate-900">{power}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <BarChart2 className="h-3.5 w-3.5 text-blue-600" />
                  <span>Geração estimada</span>
                </span>
                <span className="font-bold text-slate-900">{generation}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5 text-blue-600" />
                  <span>Valor total</span>
                </span>
                <span className="font-bold text-emerald-700">
                  {price.isAvailable ? price.formatted : 'R$ 25.750,00'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Leaf className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Economia estimada</span>
                </span>
                <span className="font-bold text-emerald-700">{savings}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-blue-600" />
                  <span>Prazo de instalação</span>
                </span>
                <span className="font-bold text-slate-900">{deadline}</span>
              </div>
            </div>

            {/* Link para proposta */}
            <button
              type="button"
              onClick={onViewProposal}
              className="mt-2 block w-full text-center text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Ver proposta completa →
            </button>
          </div>

          {/* Card 2: Documentos Finais */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FileText className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Documentos finais</h3>
            </div>

            <div className="space-y-2.5">
              {/* Doc 1 */}
              <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500 text-[10px] font-extrabold text-white">
                    PDF
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      Termo de conclusão.pdf
                    </p>
                    <p className="text-[10px] text-slate-400">1,2 MB</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-lg text-slate-500 hover:text-blue-600"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>

              {/* Doc 2 */}
              <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500 text-[10px] font-extrabold text-white">
                    PDF
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      Laudo de homologação.pdf
                    </p>
                    <p className="text-[10px] text-slate-400">980 KB</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-lg text-slate-500 hover:text-blue-600"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>

              {/* Doc 3 */}
              <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500 text-[10px] font-extrabold text-white">
                    PDF
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      Garantia dos equipamentos.pdf
                    </p>
                    <p className="text-[10px] text-slate-400">1,8 MB</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-lg text-slate-500 hover:text-blue-600"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Card 3: Precisa de algo? */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Headphones className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Precisa de algo?</h3>
            </div>

            <div className="divide-y divide-slate-100">
              <button
                type="button"
                className="w-full py-2.5 flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Headphones className="h-4 w-4 text-blue-600" />
                  <span>Abrir chamado de suporte</span>
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                type="button"
                className="w-full py-2.5 flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Wrench className="h-4 w-4 text-blue-600" />
                  <span>Solicitar manutenção</span>
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              <Link
                href={proposalChatUrl(proposal)}
                className="w-full py-2.5 flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <MessageCircle className="h-4 w-4 text-blue-600" />
                  <span>Falar novamente com a empresa</span>
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
