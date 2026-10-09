'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  HelpCircle,
  Leaf,
  LifeBuoy,
  MessageCircle,
  MoreHorizontal,
  Share2,
  ShieldCheck,
  Star,
  Upload,
  Wrench,
  Zap,
} from 'lucide-react';
import type { MarketplaceProposal } from '@/lib/api';
import {
  formatMoney,
  getProposalDisplayPrice,
  getProposalLocation,
  getProposalRawTerm,
  proposalChatUrl,
} from '@/lib/marketplace-proposals';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CompanyMark } from './ProposalSummary';

interface ProposalCompletedProps {
  proposal: MarketplaceProposal;
  onViewProposal?: () => void;
  onList?: () => void;
  onReview?: () => void;
  onConversation?: () => void;
}

export function ProposalCompleted({
  proposal,
  onViewProposal,
  onList,
  onReview,
  onConversation,
}: ProposalCompletedProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '12m'>('7d');

  const power =
    getProposalRawTerm(proposal, ['system_power', 'power_kwp', 'potencia', 'installed_power']);
  const generation =
    getProposalRawTerm(proposal, ['monthly_generation', 'geracao', 'generation_kwh']);
  const deadline =
    getProposalRawTerm(proposal, ['installation_deadline', 'prazo', 'installation_time']);
  const savings =
    getProposalRawTerm(proposal, ['monthly_savings', 'economia', 'estimated_savings']);
  const price = getProposalDisplayPrice(proposal);
  const location = getProposalLocation(proposal);
  const reference = proposal.reference;

  // 7 Fases todas concluídas
  const stepperPhases = [
    { id: 1, label: 'Proposta', status: 'Concluída', completed: true },
    { id: 2, label: 'Negociação', status: 'Concluída', completed: true },
    { id: 3, label: 'Contrato', status: 'Concluída', completed: true },
    { id: 4, label: 'Projeto', status: 'Concluída', completed: true },
    { id: 5, label: 'Instalação', status: 'Concluída', completed: true },
    { id: 6, label: 'Homologação', status: 'Concluída', completed: true },
    { id: 7, label: 'Projeto concluído', status: 'Em operação', completed: true, current: true },
  ];

  const chartData = [
    { day: '14/11', value: 38 },
    { day: '15/11', value: 48 },
    { day: '16/11', value: 45 },
    { day: '17/11', value: 50 },
    { day: '18/11', value: 52 },
    { day: '19/11', value: 49 },
    { day: '20/11', value: 52 },
  ];

  const samplePhotos: string[] = (proposal.project as { photos?: string[] })?.photos || [];

  const finalDocs = (proposal.version?.terms || [])
    .filter((t) => t.value && t.value.toLowerCase().includes('.pdf'))
    .map((t) => ({ name: t.label, size: 'PDF' }));

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6 pb-16 text-slate-900 font-sans">
      {/* ── BOTÃO VOLTAR E TÍTULOS ─────────────────────────────────── */}
      <div className="space-y-1">
        <button
          type="button"
          onClick={onList || onViewProposal}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Voltar para propostas</span>
        </button>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 mt-1">
          Projeto concluído
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Seu sistema está em operação! Veja o resumo final e compartilhe sua experiência.
        </p>
      </div>

      {/* ── CARD PRINCIPAL DE IDENTIFICAÇÃO DO PROJETO CONCLUÍDO ─────── */}
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
            <div className="mt-1 flex items-center gap-1 text-xs text-amber-500">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-extrabold text-slate-900">
                {proposal.company.rating_avg ? proposal.company.rating_avg.toFixed(1) : '4,8'}
              </span>
              <span className="text-slate-400 font-normal">
                ({proposal.company.reviews_count || 32} avaliações)
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-slate-950">Proposta #{reference}</p>
              <p className="text-xs text-slate-600 font-medium">Sistema Residencial {power}</p>
              <p className="text-[11px] text-slate-400">Concluída em 15/11/2026</p>
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

      {/* ── STEPPER HORIZONTAL DE 7 ETAPAS (TODAS CONCLUÍDAS) ───────── */}
      <section
        aria-label="Etapas do projeto"
        className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs"
      >
        <div className="min-w-[760px] flex items-center justify-between relative px-6 py-2">
          <div
            className="absolute left-10 right-10 top-5 h-0.5 bg-blue-600 -translate-y-1/2 z-0"
            aria-hidden="true"
          />

          {stepperPhases.map((phase) => (
            <div key={phase.id} className="relative z-10 flex flex-col items-center text-center">
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all shadow-xs ring-4 ring-white bg-blue-600 text-white'
                )}
              >
                {phase.id === 7 ? (
                  <span className="text-[11px] font-extrabold">7</span>
                ) : (
                  <Check className="h-4 w-4 stroke-[3]" />
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

      {/* ── BANNER CELEBRAÇÃO ────────────────────────────────────────── */}
      <section className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md">
            <Check className="h-6 w-6 stroke-[3]" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-950">Seu projeto está concluído!</h3>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              O sistema foi instalado, homologado e já está gerando energia.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-2 rounded-xl border-blue-200 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs h-9 px-4 shadow-2xs"
        >
          <Share2 className="h-4 w-4" />
          <span>Compartilhar conquista</span>
        </Button>
      </section>

      {/* ── GRID PRINCIPAL: CONTEÚDO (ESQUERDA) + ASIDE (DIREITA) ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Coluna Esquerda: Desempenho + Fotos + Avaliação */}
        <div className="space-y-6 min-w-0">
          {/* Widget 1: Desempenho atual do sistema */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-5">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4 flex-wrap">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-950">Desempenho atual do sistema</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Online</span>
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Última atualização: 20/11/2026 às 14:32
              </span>
            </div>

            {/* 4 Cards de Métricas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="block text-lg font-extrabold text-slate-950 pt-1">8,1 kW</span>
                <span className="block text-[11px] text-slate-500 font-medium">Potência instantânea</span>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1">
                <BarChart2 className="h-4 w-4 text-blue-600" />
                <span className="block text-lg font-extrabold text-slate-950 pt-1">52 kWh</span>
                <span className="block text-[11px] text-slate-500 font-medium">Geração hoje</span>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1">
                <Leaf className="h-4 w-4 text-emerald-600" />
                <span className="block text-lg font-extrabold text-slate-950 pt-1">1.560 kWh</span>
                <span className="block text-[11px] text-slate-500 font-medium">Geração no mês</span>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1">
                <span className="text-emerald-600 font-extrabold text-sm">$</span>
                <span className="block text-lg font-extrabold text-emerald-600 pt-1">R$ 156,00</span>
                <span className="block text-[11px] text-slate-500 font-medium">Economia estimada (mês)</span>
              </div>
            </div>

            {/* Gráfico de Barras de Geração */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="relative">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs"
                  >
                    <span>Geração de energia</span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setTimeRange('7d')}
                    className={cn(
                      'px-3 py-1 text-xs font-bold rounded-lg transition-colors',
                      timeRange === '7d'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    7 dias
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeRange('30d')}
                    className={cn(
                      'px-3 py-1 text-xs font-bold rounded-lg transition-colors',
                      timeRange === '30d'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    30 dias
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeRange('12m')}
                    className={cn(
                      'px-3 py-1 text-xs font-bold rounded-lg transition-colors',
                      timeRange === '12m'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    12 meses
                  </button>
                </div>
              </div>

              {/* Renderização visual do gráfico de barras */}
              <div className="pt-6 pb-2 px-2 flex items-end justify-between gap-2 h-44 border-b border-slate-200">
                {chartData.map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                      {item.value} kWh
                    </span>
                    <div className="w-full max-w-[36px] bg-blue-100 rounded-t-md relative h-32 flex items-end overflow-hidden">
                      <div
                        className="w-full bg-blue-500 group-hover:bg-blue-600 transition-all rounded-t-md"
                        style={{ height: `${(item.value / 60) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-slate-500">{item.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Widget 2: Fotos do projeto */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Upload className="h-4 w-4 text-blue-600" />
              <h3 className="text-base font-extrabold text-slate-950">Fotos do projeto</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {samplePhotos.map((src, i) => (
                <div
                  key={i}
                  className="relative h-28 rounded-xl overflow-hidden border border-slate-200 group"
                >
                  <Image src={src} alt="Foto do projeto" fill className="object-cover" />
                </div>
              ))}

              <button
                type="button"
                className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-300 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
              >
                <span className="text-xl font-bold">+</span>
                <span className="text-[11px] font-bold">Adicionar fotos</span>
              </button>
            </div>
          </section>

          {/* Widget 3: Avalie sua experiência */}
          <section className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-blue-600 fill-blue-600" />
                <h3 className="text-sm font-extrabold text-slate-950">Avalie sua experiência</h3>
              </div>
              <div className="flex items-center gap-1 text-amber-400 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-4 w-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-600 font-medium italic pt-1">
                &ldquo;Excelente atendimento desde o início. Equipe técnica muito profissional...&rdquo;
              </p>
            </div>

            <Button
              onClick={onReview}
              className="shrink-0 h-10 px-5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs text-xs"
            >
              Enviar avaliação
            </Button>
          </section>
        </div>

        {/* Coluna Direita: Sidebar (Resumo + Documentos Finais + Suporte) */}
        <aside className="space-y-5">
          {/* Card 1: Resumo do projeto */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-extrabold text-slate-950">Resumo do projeto</h3>
            </div>

            <div className="relative h-32 rounded-xl overflow-hidden border border-slate-100">
              <Image
                src="/energia-solar-avalia-solar.webp"
                alt="Sistema Residencial"
                fill
                className="object-cover"
              />
            </div>

            <div>
              <h4 className="text-sm font-extrabold text-slate-950">Sistema Residencial {power}</h4>
              <p className="text-xs text-slate-500 font-medium">{location}</p>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  On-grid
                </span>
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  Residencial
                </span>
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  Alta eficiência
                </span>
              </div>
            </div>

            <dl className="divide-y divide-slate-100 text-xs pt-1">
              <div className="py-2 flex items-center justify-between">
                <dt className="text-slate-500">Potência do sistema</dt>
                <dd className="font-extrabold text-slate-900">{power}</dd>
              </div>
              <div className="py-2 flex items-center justify-between">
                <dt className="text-slate-500">Geração estimada</dt>
                <dd className="font-extrabold text-slate-900">{generation}</dd>
              </div>
              <div className="py-2 flex items-center justify-between">
                <dt className="text-slate-500">Valor total</dt>
                <dd className="font-extrabold text-emerald-600">{price.formatted}</dd>
              </div>
              <div className="py-2 flex items-center justify-between">
                <dt className="text-slate-500">Economia estimada</dt>
                <dd className="font-extrabold text-emerald-600">{savings}</dd>
              </div>
              <div className="py-2 flex items-center justify-between">
                <dt className="text-slate-500">Prazo de instalação</dt>
                <dd className="font-extrabold text-slate-900">{deadline}</dd>
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

          {/* Card 2: Documentos finais */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-extrabold text-slate-950">Documentos finais</h3>
            </div>

            {finalDocs.length ? (
              <div className="space-y-2">
                {finalDocs.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-lg bg-red-500 text-white font-bold text-[9px] flex items-center justify-center shrink-0">
                        PDF
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">
                          {doc.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{doc.size}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                      title="Baixar documento"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-2 text-xs text-slate-500">Nenhum documento final anexado.</p>
            )}
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
                onClick={onConversation}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 font-bold text-slate-700 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-blue-600" />
                  <span>Falar novamente com a empresa</span>
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
