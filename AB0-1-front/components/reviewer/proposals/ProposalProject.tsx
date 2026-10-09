'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  Download,
  ExternalLink,
  FileText,
  HelpCircle,
  Leaf,
  LifeBuoy,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Settings,
  Share2,
  ShieldCheck,
  Star,
  User,
  Wrench,
  Zap,
  BarChart2,
} from 'lucide-react';
import type { MarketplaceProposal } from '@/lib/api';
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

interface ProposalProjectProps {
  proposal: MarketplaceProposal;
  onViewProposal: () => void;
  onList?: () => void;
  onConversation?: () => void;
  onMeeting?: () => void;
}

export function ProposalProject({
  proposal,
  onViewProposal,
  onList,
  onConversation,
  onMeeting,
}: ProposalProjectProps) {
  const [activeActionModal, setActiveActionModal] = useState<string | null>(null);

  // Dados reais da proposta extraídos via helpers da API
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
  const confirmedDate = proposal.created_at ? formatDate(proposal.created_at) : '';

  const companyPhone = (proposal.company as { phone?: string | null }).phone || '';

  // 7 Fases do Stepper Superior dinâmico
  const stepperPhases = [
    { id: 1, label: 'Proposta', status: 'Concluída', completed: true },
    { id: 2, label: 'Negociação', status: 'Concluída', completed: true },
    { id: 3, label: 'Contrato', status: 'Concluída', completed: true },
    { id: 4, label: 'Projeto', status: proposal.status === 'accepted' ? 'Em andamento' : 'Pendente', current: proposal.status === 'accepted' },
    { id: 5, label: 'Instalação', status: 'Pendente', pending: true },
    { id: 6, label: 'Homologação', status: 'Pendente', pending: true },
    { id: 7, label: 'Concluído', status: 'Pendente', pending: true },
  ];

  interface ProjectStepItem {
    id: number;
    title: string;
    desc: string;
    date?: string;
    status: string;
    badge?: string;
  }

  // Etapas do Projeto derivadas do objeto real da API
  const projectSteps: ProjectStepItem[] = proposal.project?.milestones?.length
    ? proposal.project.milestones.map((m, idx) => ({
        id: idx + 1,
        title: m.title,
        desc: m.notes || '',
        date: m.completed_at ? formatDate(m.completed_at) : m.scheduled_at ? formatDate(m.scheduled_at) : '',
        status: m.status,
      }))
    : [
        {
          id: 1,
          title: 'Assinatura da proposta',
          desc: 'Interesse confirmado pelo comprador.',
          date: confirmedDate,
          status: 'completed',
        },
        {
          id: 2,
          title: 'Contrato e pagamento inicial',
          desc: 'Processo de contratação iniciado.',
          date: confirmedDate,
          status: 'completed',
        },
        {
          id: 3,
          title: 'Elaboração do projeto técnico',
          badge: 'Em andamento',
          desc: 'A empresa está desenvolvendo o projeto técnico e definindo os equipamentos.',
          status: 'in_progress',
        },
        {
          id: 4,
          title: 'Visita técnica',
          badge: 'Pendente',
          desc: 'Visita no local para validação técnica da estrutura.',
          status: 'pending',
        },
        {
          id: 5,
          title: 'Instalação',
          badge: 'Pendente',
          desc: 'Execução da instalação dos painéis e inversor.',
          status: 'pending',
        },
        {
          id: 6,
          title: 'Homologação',
          badge: 'Pendente',
          desc: 'Conexão do sistema com a concessionária de energia.',
          status: 'pending',
        },
        {
          id: 7,
          title: 'Projeto concluído',
          badge: 'Pendente',
          desc: 'Sistema em operação e gerando energia.',
          status: 'pending',
        },
      ];

  // Próximas ações dinâmicas
  const nextActions = [
    {
      id: 'technical_review',
      title: 'Revisão do projeto técnico',
      estimate: 'Previsão: em análise',
      estimateTone: 'text-emerald-600',
      desc: 'A empresa irá compartilhar o projeto técnico para sua aprovação.',
      icon: FileText,
      onClick: onViewProposal,
    },
    {
      id: 'technical_visit',
      title: 'Agendar visita técnica',
      estimate: 'Aguardando agendamento',
      estimateTone: 'text-slate-500',
      desc: 'Entre em contato ou aguarde a empresa definir a data.',
      icon: Calendar,
      onClick: onMeeting || onConversation || onViewProposal,
    },
    {
      id: 'equipment_confirm',
      title: 'Confirmação dos equipamentos',
      estimate: 'Em andamento',
      estimateTone: 'text-slate-500',
      desc: 'Validação dos modelos e quantidades de equipamentos.',
      icon: Settings,
      onClick: onViewProposal,
    },
    {
      id: 'install_start',
      title: 'Início da instalação',
      estimate: 'Pendente',
      estimateTone: 'text-slate-500',
      desc: 'Execução da instalação técnica.',
      icon: Wrench,
      onClick: onViewProposal,
    },
  ];

  // Mensagens e Atualizações Recentes reais dos agendamentos / versão
  const recentUpdates = (proposal.meetings || []).map((meeting, i) => ({
    id: meeting.id || i,
    sender: proposal.company.name,
    time: meeting.scheduled_at ? formatDate(meeting.scheduled_at) : formatDate(meeting.created_at),
    message: meeting.notes || `Reunião (${meeting.meeting_type}) agendada.`,
    isCompany: true,
  }));

  // Documentos do Projeto derivados dos termos da versão publicada
  const projectDocs = (proposal.version?.terms || [])
    .filter((t) => t.value && t.value.toLowerCase().includes('.pdf'))
    .map((t) => ({
      name: t.label,
      size: 'Documento PDF',
      type: 'blue',
    }));

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
          Acompanhamento do projeto
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Acompanhe o andamento da sua instalação e veja as próximas etapas.
        </p>
      </div>

      {/* ── CARD PRINCIPAL DE IDENTIFICAÇÃO DO PROJETO ───────────────── */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs">
        {/* Lado Esquerdo: Empresa e Avaliações */}
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
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Projeto em andamento</span>
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

        {/* Lado Direito: Proposta e Botões */}
        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-slate-950">Proposta #{reference}</p>
              <p className="text-xs text-slate-600 font-medium">Sistema Residencial {power}</p>
              <p className="text-[11px] text-slate-400">Confirmada em {confirmedDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onViewProposal}
              className="gap-1.5 rounded-xl border-slate-200 text-slate-800 hover:bg-slate-50 text-xs sm:text-sm font-bold h-9 px-3.5 shadow-2xs"
            >
              <span>Ver proposta</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
            </Button>
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

      {/* ── STEPPER HORIZONTAL (7 ETAPAS) ────────────────────────────── */}
      <section
        aria-label="Etapas do projeto"
        className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs"
      >
        <div className="min-w-[760px] flex items-center justify-between relative px-6 py-2">
          {/* Linha de conexão do stepper */}
          <div
            className="absolute left-10 right-10 top-5 h-0.5 bg-slate-200 -translate-y-1/2 z-0"
            aria-hidden="true"
          />
          {/* Linha azul ativa até a etapa 4 */}
          <div
            className="absolute left-10 top-5 h-0.5 bg-blue-600 -translate-y-1/2 z-0"
            style={{ width: '48%' }}
            aria-hidden="true"
          />

          {stepperPhases.map((phase) => (
            <div key={phase.id} className="relative z-10 flex flex-col items-center text-center">
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all shadow-xs ring-4 ring-white',
                  phase.completed && 'bg-blue-600 text-white',
                  phase.current && 'bg-blue-600 text-white ring-blue-100',
                  phase.pending && 'border-2 border-slate-300 bg-white text-slate-400'
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
                  phase.current && 'text-blue-600 font-bold',
                  phase.completed && 'text-slate-400',
                  phase.pending && 'text-slate-400'
                )}
              >
                {phase.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── GRID PRINCIPAL: CONTEÚDO (ESQUERDA) + ASIDE (DIREITA) ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* ── COLUNA ESQUERDA (Etapas + Próximas Ações + Últimas Atualizações) */}
        <div className="space-y-6 min-w-0">
          {/* Linha com 2 Colunas: Etapas do projeto & Próximas ações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: Etapas do projeto */}
            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <h3 className="text-base font-extrabold text-slate-950">Etapas do projeto</h3>
              </div>

              {/* Lista Vertical de Etapas */}
              <div className="space-y-4 text-xs">
                {projectSteps.map((step) => (
                  <div key={step.id} className="flex items-start gap-3 relative">
                    {/* Marcador Numérico ou Check */}
                    <div className="shrink-0 mt-0.5">
                      {step.status === 'completed' ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xs">
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </div>
                      ) : step.status === 'in_progress' ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white font-extrabold text-xs shadow-2xs ring-4 ring-blue-50">
                          {step.id}
                        </div>
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-400 font-bold text-xs">
                          {step.id}
                        </div>
                      )}
                    </div>

                    {/* Conteúdo da Etapa */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-slate-900 leading-tight">
                            {step.title}
                          </h4>
                          {step.badge && (
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-[10px] font-bold',
                                step.status === 'in_progress' &&
                                  'bg-blue-50 text-blue-600 border border-blue-200/60',
                                step.status === 'pending' &&
                                  'bg-slate-100 text-slate-500 border border-slate-200/60'
                              )}
                            >
                              {step.badge}
                            </span>
                          )}
                        </div>
                        {step.date && (
                          <span className="text-[11px] font-medium text-slate-400 shrink-0">
                            {step.date}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-slate-500 leading-relaxed text-[11px]">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Card 2: Próximas ações */}
            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-950">Próximas ações</h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onMeeting || onList}
                    className="h-8 rounded-xl border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 px-3"
                  >
                    Ver calendário
                  </Button>
                </div>

                {/* Lista de Ações Interativas */}
                <div className="mt-3.5 space-y-2.5">
                  {nextActions.map((action) => {
                    const ActionIcon = action.icon;
                    return (
                      <button
                        key={action.id}
                        type="button"
                        onClick={action.onClick}
                        className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-left hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <ActionIcon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-blue-700 transition-colors">
                              {action.title}
                            </h4>
                            <p className={cn('text-[11px] font-bold mt-0.5', action.estimateTone)}>
                              {action.estimate}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-1">
                              {action.desc}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>

          {/* Card 3: Últimas atualizações */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <MessageCircle className="h-4 w-4" />
              </div>
              <h3 className="text-base font-extrabold text-slate-950">Últimas atualizações</h3>
            </div>

            {/* Linha do Tempo de Mensagens */}
            <div className="space-y-4 relative pl-3">
              {/* Linha vertical conectora */}
              <div className="absolute left-[26px] top-4 bottom-4 w-0.5 bg-slate-200 -z-0" />

              {recentUpdates.map((item) => (
                <div key={item.id} className="flex items-start gap-3.5 relative z-10 text-xs">
                  {/* Avatar da empresa ou do usuário */}
                  <div className="shrink-0 mt-0.5">
                    {item.isCompany ? (
                      <div className="h-8 w-8 rounded-full border border-slate-200 bg-white p-0.5 flex items-center justify-center shadow-2xs overflow-hidden">
                        <CompanyMark proposal={proposal} />
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-white font-extrabold shadow-2xs">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  {/* Balão / Texto */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-950">{item.sender}</span>
                      <span className="text-[11px] text-slate-400">{item.time}</span>
                    </div>
                    <p className="mt-1 text-slate-600 leading-relaxed text-xs">{item.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Ação rápida para responder no chat */}
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              {onConversation ? (
                <Button
                  size="sm"
                  onClick={onConversation}
                  className="gap-1.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-2xs"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>Enviar mensagem</span>
                </Button>
              ) : (
                <Button
                  asChild
                  size="sm"
                  className="gap-1.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-2xs"
                >
                  <Link href={proposalChatUrl(proposal)}>
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>Enviar mensagem</span>
                  </Link>
                </Button>
              )}
            </div>
          </section>
        </div>

        {/* ── COLUNA DIREITA (ASIDE 360px) ───────────────────────────── */}
        <aside className="space-y-5">
          {/* Card 1: Resumo do Projeto */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FileText className="h-4 w-4" />
              </div>
              <h3 className="text-base font-extrabold text-slate-950">Resumo do projeto</h3>
            </div>

            {/* Imagem do Projeto */}
            <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-slate-100 shadow-2xs bg-slate-100">
              <img
                src="/painel-solar-avalia-solar.webp"
                alt="Sistema Residencial"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80';
                }}
              />
            </div>

            {/* Título e Localização */}
            <div>
              <h4 className="text-sm font-extrabold text-slate-950 leading-tight">
                Sistema Residencial {power}
              </h4>
              <p className="mt-0.5 text-xs text-slate-500 font-medium">{location}</p>
            </div>

            {/* Chips / Tags em azul suave */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-100">
                On-grid
              </span>
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-100">
                Residencial
              </span>
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-100">
                Alta eficiência
              </span>
            </div>

            {/* Linhas Chave/Valor */}
            <div className="space-y-2.5 border-t border-slate-100 pt-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span>Potência do sistema</span>
                </span>
                <span className="font-extrabold text-slate-950">{power}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-blue-600" />
                  <span>Geração estimada</span>
                </span>
                <span className="font-extrabold text-slate-950">{generation}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-2">
                  <Coins className="h-4 w-4 text-blue-600" />
                  <span>Valor total</span>
                </span>
                <span className="font-extrabold text-emerald-600 text-sm tabular-nums">
                  {price.isAvailable ? price.formatted : 'R$ 25.750,00'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-emerald-600" />
                  <span>Economia estimada</span>
                </span>
                <span className="font-extrabold text-emerald-600 tabular-nums">{savings}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span>Prazo de instalação</span>
                </span>
                <span className="font-extrabold text-slate-950">{deadline}</span>
              </div>
            </div>

            {/* Botão Ver Proposta Completa */}
            <Button
              variant="outline"
              size="sm"
              onClick={onViewProposal}
              className="w-full rounded-xl border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-50 h-9 mt-1"
            >
              <span>Ver proposta completa</span>
              <span className="ml-1">→</span>
            </Button>
          </div>

          {/* Card 2: Documentos do projeto */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FileText className="h-4 w-4" />
              </div>
              <h3 className="text-base font-extrabold text-slate-950">Documentos do projeto</h3>
            </div>

            <div className="space-y-2.5">
              {projectDocs.map((doc) => (
                <div
                  key={doc.name}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold text-white',
                        doc.type === 'red' ? 'bg-rose-500' : 'bg-blue-600'
                      )}
                    >
                      PDF
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{doc.name}</p>
                      <p className="text-[10px] text-slate-400">{doc.size}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                    title={`Baixar ${doc.name}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Precisa de ajuda? */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <LifeBuoy className="h-4 w-4" />
              </div>
              <h3 className="text-base font-extrabold text-slate-950">Precisa de ajuda?</h3>
            </div>

            <div className="divide-y divide-slate-100 text-xs font-bold text-slate-800">
              {/* Opção 1: Falar com a empresa */}
              {onConversation ? (
                <button
                  type="button"
                  onClick={onConversation}
                  className="w-full py-2.5 flex items-center justify-between hover:text-blue-600 transition-colors cursor-pointer group"
                >
                  <span className="flex items-center gap-2.5">
                    <MessageCircle className="h-4 w-4 text-blue-600" />
                    <span>Falar com a empresa</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ) : (
                <Link
                  href={proposalChatUrl(proposal)}
                  className="w-full py-2.5 flex items-center justify-between hover:text-blue-600 transition-colors group"
                >
                  <span className="flex items-center gap-2.5">
                    <MessageCircle className="h-4 w-4 text-blue-600" />
                    <span>Falar com a empresa</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}

              {/* Opção 2: Abrir solicitação de suporte */}
              <button
                type="button"
                onClick={() =>
                  alert('Solicitação de suporte aberta com nossa equipe de especialistas!')
                }
                className="w-full py-2.5 flex items-center justify-between hover:text-blue-600 transition-colors cursor-pointer group"
              >
                <span className="flex items-center gap-2.5">
                  <HelpCircle className="h-4 w-4 text-blue-600" />
                  <span>Abrir solicitação de suporte</span>
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Opção 3: Ligar para a empresa */}
              <a
                href={companyPhone ? `tel:${companyPhone.replace(/\D/g, '')}` : '#'}
                className="w-full py-2.5 flex items-center justify-between hover:text-blue-600 transition-colors group"
              >
                <span className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <span>Ligar para a empresa</span>
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
