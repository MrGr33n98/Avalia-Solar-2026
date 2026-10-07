'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowDownToLine,
  Calendar,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileCheck,
  FileCode,
  FileSpreadsheet,
  FileText,
  Heart,
  HelpCircle,
  Info,
  MessageCircle,
  MoreHorizontal,
  Share2,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  Wrench,
  Zap,
} from 'lucide-react';
import type { MarketplaceProposal, MarketplaceProposalVersion } from '@/lib/api';
import {
  canDecide,
  formatDate,
  formatMoney,
  getProposalDisplayPrice,
  getProposalLocation,
  getProposalRawTerm,
  getProposalStatusTone,
  proposalChatUrl,
  proposalStatus,
  technicalFields,
  termValue,
} from '@/lib/marketplace-proposals';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function CompanyMark({ proposal }: { proposal: MarketplaceProposal }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-xs font-bold text-primary border border-primary/20">
      {proposal.company.logo_url && !failed ? (
        <Image
          src={proposal.company.logo_url}
          alt=""
          fill
          sizes="40px"
          className="object-contain p-1"
          onError={() => setFailed(true)}
        />
      ) : (
        proposal.company.name
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part[0])
          .join('')
      )}
    </span>
  );
}

export function StatusBadge({ proposal }: { proposal: MarketplaceProposal }) {
  const { badgeTone, dotTone } = getProposalStatusTone(proposal);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 shrink-0 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide shadow-2xs',
        badgeTone
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', dotTone)} aria-hidden="true" />
      <span>{proposalStatus(proposal)}</span>
    </span>
  );
}

export function VersionContent({ version }: { version: MarketplaceProposalVersion }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs">
        <h3 className="text-base font-bold text-foreground">{version.title || 'Proposta Técnica e Comercial'}</h3>
        <p className="mt-2.5 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
          {version.summary || 'Resumo executivo ainda não informado pela empresa.'}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-4 rounded-2xl border border-border/80 bg-muted/20 p-4 text-xs sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground font-medium">Valor total</dt>
          <dd className="mt-1 text-sm font-bold tabular-nums text-primary">
            {formatMoney(version.total_cents, version.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground font-medium">Validade da proposta</dt>
          <dd className="mt-1 font-semibold text-foreground">{formatDate(version.valid_until)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground font-medium">Versão</dt>
          <dd className="mt-1 font-semibold text-foreground">v{version.number}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground font-medium">Publicada em</dt>
          <dd className="mt-1 font-semibold text-foreground">{formatDate(version.published_at)}</dd>
        </div>
      </dl>

      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
        <h4 className="flex items-center gap-2 text-sm font-bold text-foreground border-b border-border/60 pb-3">
          <Wrench className="h-4 w-4 text-primary" />
          <span>Equipamentos e Serviços</span>
        </h4>
        {version.items.length ? (
          <ul className="divide-y divide-border/60">
            {version.items.map((item) => (
              <li key={item.id} className="py-3.5 text-xs first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">{item.name}</span>
                  <span className="font-bold tabular-nums text-primary">
                    {formatMoney(item.total_cents, version.currency)}
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground">
                  <span className="font-medium text-foreground">{item.quantity} {item.unit}</span>
                  {item.description ? ` · ${item.description}` : ''}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-3 text-xs text-muted-foreground">Equipamentos ainda não detalhados individualmente.</p>
        )}
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
        <h4 className="flex items-center gap-2 text-sm font-bold text-foreground border-b border-border/60 pb-3">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>Condições, prazos e garantias</span>
        </h4>
        {version.terms.length ? (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {version.terms.map((term) => (
              <div key={term.id} className="rounded-xl border border-border/60 bg-muted/20 p-3">
                <dt className="font-semibold text-muted-foreground">{term.label}</dt>
                <dd className="mt-1 font-bold text-foreground whitespace-pre-line">{term.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="py-3 text-xs text-muted-foreground">
            Condições ainda não informadas. Confirme os detalhes com a empresa.
          </p>
        )}
      </div>
    </div>
  );
}

export function ProposalSummary({
  proposal,
  onMeeting,
  onChoose,
  onNegotiate,
  onProject,
  initialTab = 'summary',
}: {
  proposal: MarketplaceProposal;
  onMeeting: () => void;
  onChoose: () => void;
  onNegotiate: () => void;
  onProject: () => void;
  initialTab?: 'summary' | 'complete' | 'financial';
}) {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  // Default images gallery
  const galleryImages = [
    (proposal.company as { banner_url?: string | null }).banner_url || '/energia-solar-avalia-solar.webp',
    '/painel-solar-avalia-solar.webp',
    '/inversor-solar-avalia-solar.webp',
  ];

  const powerVal = getProposalRawTerm(proposal, ['system_power', 'power_kwp', 'installed_power', 'potencia']) || '8,25 kWp';
  const genVal = getProposalRawTerm(proposal, ['monthly_generation', 'generation_kwh', 'estimated_generation', 'geracao']) || '960 kWh/mês';
  const deadlineVal = getProposalRawTerm(proposal, ['installation_deadline', 'installation_time', 'prazo']) || '30 dias';
  const displayPrice = getProposalDisplayPrice(proposal);

  const mockDocuments = [
    { name: `Proposta_Comercial_${proposal.company.name.replace(/\s+/g, '_')}.pdf`, size: '1,4 MB', type: 'pdf' },
    { name: 'Projeto_Tecnico.pdf', size: '2,1 MB', type: 'pdf' },
    { name: 'Memoria_de_Calculo.pdf', size: '1,8 MB', type: 'pdf' },
    { name: 'Condicoes_Garantia.pdf', size: '0,9 MB', type: 'pdf' },
  ];

  if (!proposal.version) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-border bg-muted/40 p-6 text-center shadow-xs">
          <FileText className="mx-auto h-10 w-10 text-primary" />
          <h3 className="mt-3 text-lg font-bold">Proposta em preparação</h3>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
            A empresa recebeu sua solicitação e está preparando os detalhes técnicos e comerciais.
            Você verá o valor, os equipamentos e as condições aqui assim que a proposta for publicada.
          </p>
        </div>
        <Button
          asChild
          className="w-full gap-2 font-semibold shadow-xs"
        >
          <Link href={proposalChatUrl(proposal)}>
            <MessageCircle className="h-4 w-4" />
            Conversar com a empresa
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Toolbar on top of Detail Page */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            asChild
            size="sm"
            className="gap-1.5 rounded-xl font-semibold shadow-xs"
          >
            <Link href={proposalChatUrl(proposal)}>
              <MessageCircle className="h-4 w-4" />
              <span>Conversar com a empresa</span>
            </Link>
          </Button>

          {(canDecide(proposal) || proposal.status === 'accepted') && (
            <Button
              variant="outline"
              size="sm"
              onClick={onMeeting}
              className="gap-1.5 rounded-xl font-semibold border-border"
            >
              <CalendarClock className="h-4 w-4 text-primary" />
              <span>Agendar reunião</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (navigator.clipboard) {
                void navigator.clipboard.writeText(window.location.href);
              }
            }}
            className="gap-1.5 rounded-xl font-medium text-xs border-border"
            title="Compartilhar proposta"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Compartilhar</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFavorited(!isFavorited)}
            className={cn(
              'gap-1.5 rounded-xl font-medium text-xs border-border',
              isFavorited && 'text-rose-600 border-rose-200 bg-rose-50'
            )}
            title="Favoritar"
          >
            <Heart className={cn('h-3.5 w-3.5', isFavorited && 'fill-rose-600')} />
            <span className="hidden sm:inline">{isFavorited ? 'Favoritada' : 'Favoritar'}</span>
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          asChild
          className="gap-1 rounded-xl text-xs font-semibold border-primary/30 text-primary hover:bg-primary/5"
        >
          <Link href={`/companies/${proposal.company.id}`}>
            <span>Ver perfil da empresa</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {/* Main Detail Navigation Tabs (7 tabs matching Design Page 2) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex h-auto w-full overflow-x-auto rounded-xl bg-muted/60 p-1 scrollbar-none justify-start sm:justify-between">
          <TabsTrigger value="summary" className="rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap">
            Visão geral
          </TabsTrigger>
          <TabsTrigger value="equipments" className="rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap">
            Equipamentos
          </TabsTrigger>
          <TabsTrigger value="financial" className="rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap">
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="documents" className="rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap">
            Documentos
          </TabsTrigger>
          <TabsTrigger value="terms" className="rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap">
            Condições
          </TabsTrigger>
          <TabsTrigger value="company" className="rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap">
            Empresa
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap">
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Visão Geral */}
        <TabsContent value="summary" className="mt-6 space-y-6 focus-visible:outline-none">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column (2 cols): Hero Image, Metrics, Equipments, Guarantees */}
            <div className="space-y-6 lg:col-span-2">
              {/* Hero Image & Thumbnail Selector */}
              <div className="space-y-3">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-2xs">
                  <img
                    src={galleryImages[activeImgIndex]}
                    alt="Imagem da proposta"
                    className="h-full w-full object-cover transition-all duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-2 text-white">
                    <div>
                      <h3 className="text-xl font-bold drop-shadow-md">
                        {proposal.version?.title || 'Sistema Residencial 8,25 kWp'}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-white/20 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-semibold border border-white/30">
                          {proposal.request?.project_profile || 'Residencial'}
                        </span>
                        <span className="rounded-full bg-white/20 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-semibold border border-white/30">
                          On-grid
                        </span>
                        <span className="rounded-full bg-emerald-500/80 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-semibold border border-emerald-300/40">
                          Economia de até 95% na conta
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Thumbnails row */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {galleryImages.map((img, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setActiveImgIndex(idx)}
                      className={cn(
                        'relative aspect-[16/9] h-14 overflow-hidden rounded-xl border-2 transition-all shrink-0',
                        activeImgIndex === idx ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-70 hover:opacity-100'
                      )}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* 4 Highlight Metrics Cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-border/70 bg-card p-3.5 text-center shadow-2xs">
                  <Zap className="mx-auto h-5 w-5 text-amber-500" />
                  <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Potência
                  </span>
                  <span className="mt-0.5 block text-sm font-bold text-foreground">
                    {powerVal}
                  </span>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card p-3.5 text-center shadow-2xs">
                  <Sparkles className="mx-auto h-5 w-5 text-blue-500" />
                  <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Geração estimada
                  </span>
                  <span className="mt-0.5 block text-sm font-bold text-foreground">
                    {genVal}
                  </span>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card p-3.5 text-center shadow-2xs">
                  <FileText className="mx-auto h-5 w-5 text-emerald-500" />
                  <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Valor total
                  </span>
                  <span className="mt-0.5 block text-sm font-bold text-primary tabular-nums">
                    {displayPrice.formatted}
                  </span>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card p-3.5 text-center shadow-2xs">
                  <Calendar className="mx-auto h-5 w-5 text-violet-500" />
                  <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Prazo de instalação
                  </span>
                  <span className="mt-0.5 block text-sm font-bold text-foreground">
                    {deadlineVal}
                  </span>
                </div>
              </div>

              {/* Summary Description text */}
              <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-2xs">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Projeto completo de energia solar residencial com equipamentos de alta eficiência, instalação especializada e garantia estendida.
                </p>
              </div>

              {/* Equipamentos Principais Block */}
              <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground">Equipamentos principais</h4>
                  <button
                    type="button"
                    onClick={() => setActiveTab('equipments')}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Ver todos
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <p className="font-bold text-xs text-foreground">Jinko Solar 590W</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Módulo fotovoltaico · 14 unidades</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <p className="font-bold text-xs text-foreground">Growatt MID 8KTL3-X</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Inversor · 1 unidade</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <p className="font-bold text-xs text-foreground">Estrutura de fixação</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Alumínio · 1 conjunto</p>
                  </div>
                </div>
              </div>

              {/* Condições e Garantias Block */}
              <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-2xs space-y-3">
                <h4 className="text-sm font-bold text-foreground">Condições e garantias</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/20 p-3">
                    <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">Garantia dos equipamentos</p>
                      <p className="text-muted-foreground text-[11px] mt-0.5">12 anos (painéis) / 5 anos (inversor)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/20 p-3">
                    <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">Garantia de instalação</p>
                      <p className="text-muted-foreground text-[11px] mt-0.5">2 anos</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/20 p-3">
                    <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">Prazo de instalação</p>
                      <p className="text-muted-foreground text-[11px] mt-0.5">30 dias após aprovação</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/20 p-3">
                    <FileCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">Suporte técnico</p>
                      <p className="text-muted-foreground text-[11px] mt-0.5">Incluso por 1 ano</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (1 col): Financial Summary, Status Timeline, Documents */}
            <div className="space-y-6">
              {/* Resumo Financeiro Card */}
              <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
                <h4 className="text-sm font-bold text-foreground border-b border-border/60 pb-3">
                  Resumo financeiro
                </h4>
                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <dt>Valor dos equipamentos</dt>
                    <dd className="font-medium tabular-nums text-foreground">R$ 24.800,00</dd>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <dt>Serviços de instalação</dt>
                    <dd className="font-medium tabular-nums text-foreground">R$ 3.700,00</dd>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <dt>Descontos</dt>
                    <dd className="font-medium tabular-nums text-emerald-600">- R$ 0,00</dd>
                  </div>
                  <div className="flex justify-between border-t border-border/60 pt-3 text-sm font-bold">
                    <dt className="text-foreground">Valor total</dt>
                    <dd className="tabular-nums text-primary">{displayPrice.formatted}</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  onClick={() => setActiveTab('financial')}
                  className="text-xs font-semibold text-primary hover:underline block"
                >
                  Ver condições completas &gt;
                </button>
              </div>

              {/* Status da Proposta Timeline */}
              <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
                <h4 className="text-sm font-bold text-foreground border-b border-border/60 pb-3">
                  Status da proposta
                </h4>
                <ol className="space-y-3.5 text-xs">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-foreground">Proposta recebida</p>
                      <p className="text-[10px] text-muted-foreground">06 de out. de 2026 às 10:24</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-foreground">Em análise</p>
                      <p className="text-[10px] text-muted-foreground">Aguardando sua avaliação</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="h-4 w-4 rounded-full border-2 border-muted-foreground/40 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-muted-foreground">Negociação</p>
                      <p className="text-[10px] text-muted-foreground">Aguardando atualização</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="h-4 w-4 rounded-full border-2 border-muted-foreground/40 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-muted-foreground">Finalização</p>
                      <p className="text-[10px] text-muted-foreground">Aguardando aceite</p>
                    </div>
                  </li>
                </ol>
              </div>

              {/* Documentos da Proposta Card */}
              <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-3">
                <h4 className="text-sm font-bold text-foreground border-b border-border/60 pb-3">
                  Documentos da proposta
                </h4>
                <ul className="space-y-2 text-xs">
                  {mockDocuments.map((doc) => (
                    <li
                      key={doc.name}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/20 p-2.5 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-rose-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{doc.name}</p>
                          <p className="text-[10px] text-muted-foreground">{doc.size}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-primary">
                        <Download className="h-3.5 w-3.5" />
                        <span className="sr-only">Baixar {doc.name}</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Equipamentos */}
        <TabsContent value="equipments" className="mt-6 space-y-4 focus-visible:outline-none">
          {proposal.version ? (
            <VersionContent version={proposal.version} />
          ) : (
            <p className="text-xs text-muted-foreground">A empresa está preparando o detalhamento técnico.</p>
          )}
        </TabsContent>

        {/* Tab 3: Financeiro */}
        <TabsContent value="financial" className="mt-6 space-y-4 focus-visible:outline-none">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-2xs">
            <h3 className="text-base font-bold text-foreground">Condições comerciais e financeiras</h3>
            <p className="text-2xl font-bold tabular-nums text-primary">
              {displayPrice.formatted}
            </p>
            <dl className="space-y-3 text-xs border-t border-border/60 pt-4">
              {technicalFields.slice(3).map((field) => (
                <div key={field.label} className="rounded-xl border border-border/60 bg-muted/20 p-3">
                  <dt className="font-semibold text-muted-foreground">{field.label}</dt>
                  <dd className="mt-1 font-bold text-foreground">{termValue(proposal, field.keys)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </TabsContent>

        {/* Tab 4: Documentos */}
        <TabsContent value="documents" className="mt-6 space-y-4 focus-visible:outline-none">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-2xs">
            <h3 className="text-base font-bold text-foreground">Arquivos da proposta</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {mockDocuments.map((doc) => (
                <li
                  key={doc.name}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-rose-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{doc.name}</p>
                      <p className="text-[11px] text-muted-foreground">{doc.size}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-semibold shrink-0">
                    <Download className="h-3.5 w-3.5" />
                    <span>Baixar</span>
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>

        {/* Tab 5: Condições */}
        <TabsContent value="terms" className="mt-6 space-y-4 focus-visible:outline-none">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-2xs">
            <h3 className="text-base font-bold text-foreground">Condições gerais do projeto</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {technicalFields.map((field) => (
                <div key={field.label} className="rounded-xl border border-border/60 bg-muted/20 p-3">
                  <dt className="font-semibold text-muted-foreground">{field.label}</dt>
                  <dd className="mt-1 font-bold text-foreground">{termValue(proposal, field.keys)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </TabsContent>

        {/* Tab 6: Empresa */}
        <TabsContent value="company" className="mt-6 space-y-4 focus-visible:outline-none">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <CompanyMark proposal={proposal} />
              <div>
                <h3 className="text-base font-bold text-foreground">{proposal.company.name}</h3>
                <p className="text-xs text-muted-foreground">{getProposalLocation(proposal)}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Empresa parceira credenciada e verificada pelo Avalia Solar.
            </p>
            <Button asChild variant="outline" size="sm" className="font-semibold text-xs">
              <Link href={`/companies/${proposal.company.id}`}>Ver perfil público da empresa</Link>
            </Button>
          </div>
        </TabsContent>

        {/* Tab 7: Histórico */}
        <TabsContent value="history" className="mt-6 space-y-4 focus-visible:outline-none">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-2xs">
            <h3 className="text-base font-bold text-foreground">Histórico de edições e revisões</h3>
            <p className="text-xs text-muted-foreground">
              Consulte todas as alterações publicadas para esta proposta.
            </p>
            <Button variant="outline" size="sm" onClick={onNegotiate} className="font-semibold text-xs">
              Abrir histórico de versões
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Buttons Bar at bottom of details */}
      <div className="grid gap-3 sm:grid-cols-2 pt-4 border-t border-border/60">
        <Button
          asChild
          size="lg"
          className="gap-2 rounded-xl font-bold shadow-xs"
        >
          <Link href={proposalChatUrl(proposal)}>
            <MessageCircle className="h-4 w-4" />
            <span>Conversar com a empresa</span>
          </Link>
        </Button>
        {(canDecide(proposal) || proposal.status === 'accepted') && (
          <Button variant="outline" size="lg" onClick={onMeeting} className="gap-2 rounded-xl font-bold border-border">
            <CalendarClock className="h-4 w-4 text-primary" />
            <span>Agendar reunião</span>
          </Button>
        )}
      </div>

      {canDecide(proposal) && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Button variant="outline" size="lg" onClick={onNegotiate} className="rounded-xl font-bold border-border">
            Solicitar ajustes
          </Button>
          <Button size="lg" onClick={onChoose} className="gap-2 rounded-xl font-bold bg-primary shadow-xs">
            <Check className="h-4 w-4" />
            <span>Escolher esta proposta</span>
          </Button>
        </div>
      )}

      {proposal.status === 'accepted' && (
        <Button size="lg" onClick={onProject} className="w-full gap-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 shadow-xs text-white">
          <ShieldCheck className="h-5 w-5" />
          <span>Acompanhar projeto em andamento</span>
        </Button>
      )}
    </div>
  );
}

