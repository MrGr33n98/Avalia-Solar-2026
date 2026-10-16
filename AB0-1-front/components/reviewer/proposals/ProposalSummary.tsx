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
  Sun,
  User,
  Wrench,
  Zap,
  Layers,
  Cpu,
} from 'lucide-react';
import {
  marketplaceProposalsApi,
  type MarketplaceProposal,
  type MarketplaceProposalVersion,
} from '@/lib/api';
import {
  canDecide,
  formatDate,
  formatMoney,
  getProposalDisplayPrice,
  getProposalLocation,
  getProposalRawTerm,
  getProposalStatusTone,
  isProposalCompleted,
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
        <h3 className="text-base font-bold text-foreground">
          {version.title || 'Proposta Técnica e Comercial'}
        </h3>
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
                  <span className="font-medium text-foreground">
                    {item.quantity} {item.unit}
                  </span>
                  {item.description ? ` · ${item.description}` : ''}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-3 text-xs text-muted-foreground">
            Equipamentos ainda não detalhados individualmente.
          </p>
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
  onList,
  onConversation,
  initialTab = 'summary',
}: {
  proposal: MarketplaceProposal;
  onMeeting: () => void;
  onChoose: () => void;
  onNegotiate: () => void;
  onProject: () => void;
  onList?: () => void;
  onConversation?: () => void;
  initialTab?: 'summary' | 'complete' | 'financial' | 'technical';
}) {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  const galleryImages = proposal.company.banner_url ? [proposal.company.banner_url] : [];

  const powerVal = getProposalRawTerm(proposal, [
    'system_power',
    'power_kwp',
    'installed_power',
    'potencia',
  ]);
  const genVal = getProposalRawTerm(proposal, [
    'monthly_generation',
    'generation_kwh',
    'estimated_generation',
    'geracao',
  ]);
  const deadlineVal = getProposalRawTerm(proposal, [
    'installation_deadline',
    'installation_time',
    'prazo',
  ]);
  const displayPrice = getProposalDisplayPrice(proposal);
  const isCompleted = proposal.status === 'accepted' || isProposalCompleted(proposal);

  const proposalDocuments = (proposal.version?.documents || []).map((document) => ({
    ...document,
    name: document.filename,
    size: `${(document.byte_size / 1024 / 1024).toFixed(1)} MB`,
    href: marketplaceProposalsApi.documentDownloadUrl(
      proposal.id,
      proposal.version!.id,
      document.id
    ),
  }));

  if (!proposal.version) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-2xs">
          <FileText className="mx-auto h-12 w-12 text-primary" />
          <h3 className="mt-3 text-lg font-bold text-foreground">Proposta em preparação</h3>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
            A empresa recebeu sua solicitação e está preparando os detalhes técnicos e comerciais.
            Você verá o valor, os equipamentos e as condições aqui assim que a proposta for
            publicada.
          </p>
        </div>
        {onConversation ? (
          <Button onClick={onConversation} className="w-full gap-2 font-bold shadow-xs rounded-xl">
            <MessageCircle className="h-4 w-4" />
            <span>Conversar com a empresa</span>
          </Button>
        ) : (
          <Button asChild className="w-full gap-2 font-bold shadow-xs rounded-xl">
            <Link href={proposalChatUrl(proposal)}>
              <MessageCircle className="h-4 w-4" />
              <span>Conversar com a empresa</span>
            </Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      {/* Back button & Action Toolbar (Item 1 & 12-16 in Image 3) */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        {onList ? (
          <button
            type="button"
            onClick={onList}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline group cursor-pointer w-fit"
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Voltar para minhas propostas</span>
          </button>
        ) : (
          <Link
            href="/review-dashboard/proposals"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline group w-fit"
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Voltar para minhas propostas</span>
          </Link>
        )}

        {/* Mobile Quick Actions Row (Fiel à referência: Sem botão gigante de Chat no topo ocupando a tela) */}
        <div className="flex sm:hidden items-center gap-1.5 w-full">
          <Button
            size="sm"
            onClick={onProject}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition active:scale-[0.99] h-9"
          >
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Acompanhamento do projeto</span>
          </Button>

          {(canDecide(proposal) || proposal.status === 'accepted') && (
            <Button
              variant="outline"
              size="sm"
              onClick={onMeeting}
              className="inline-flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl border-border bg-card text-foreground text-xs font-semibold hover:bg-muted/40 shadow-2xs shrink-0 h-9"
            >
              <CalendarClock className="h-3.5 w-3.5 text-primary" />
              <span>Agendar</span>
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
            className="p-2 rounded-xl border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 shadow-2xs shrink-0 h-9 w-9 flex items-center justify-center"
            title="Compartilhar proposta"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span className="sr-only">Compartilhar</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFavorited(!isFavorited)}
            className={cn(
              'p-2 rounded-xl border-border bg-card shadow-2xs shrink-0 h-9 w-9 flex items-center justify-center transition-colors',
              isFavorited ? 'text-rose-600 border-rose-200 bg-rose-50' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            )}
            title="Favoritar"
          >
            <Heart className={cn('h-3.5 w-3.5', isFavorited && 'fill-rose-600')} />
            <span className="sr-only">{isFavorited ? 'Favoritada' : 'Favoritar'}</span>
          </Button>
        </div>

        {/* Desktop Action Buttons Top Right */}
        <div className="hidden sm:flex items-center gap-2">
          <Button
            size="sm"
            onClick={onProject}
            className="gap-1.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 px-4 shadow-2xs"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Acompanhamento do projeto</span>
          </Button>

          {(canDecide(proposal) || proposal.status === 'accepted') && (
            <Button
              variant="outline"
              size="sm"
              onClick={onMeeting}
              className="gap-1.5 rounded-xl font-semibold border-border bg-card text-foreground text-xs h-9 px-4 hover:bg-muted/40"
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
            className="gap-1.5 rounded-xl font-medium text-xs border-border bg-card h-9 px-3"
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
              'gap-1.5 rounded-xl font-medium text-xs border-border bg-card h-9 px-3',
              isFavorited && 'text-rose-600 border-rose-200 bg-rose-50'
            )}
            title="Favoritar"
          >
            <Heart className={cn('h-3.5 w-3.5', isFavorited && 'fill-rose-600')} />
            <span className="hidden sm:inline">{isFavorited ? 'Favoritada' : 'Favoritar'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-border bg-card h-9 w-9 p-0 flex items-center justify-center text-muted-foreground"
            title="Mais opções"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Mais opções</span>
          </Button>
        </div>
      </div>

      {/* Top Company Profile Header Card (Item 2 & 3 in Image 3) */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Company Logo, Name, Status Badge & Info Row */}
          <div className="min-w-0 space-y-2.5">
            <div className="flex flex-wrap items-center gap-3">
              <CompanyMark proposal={proposal} />
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl font-extrabold tracking-tight text-foreground">
                    {proposal.company.name}
                  </h2>
                  <StatusBadge proposal={proposal} />
                </div>
              </div>
            </div>

            {/* Metadata Chips Row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-medium">
                <Info className="h-3.5 w-3.5 text-primary" />
                <span>{getProposalLocation(proposal)}</span>
              </span>
              <span className="inline-flex items-center gap-1 font-medium">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Recebida em {formatDate(proposal.published_at || proposal.created_at)}</span>
              </span>
              <span className="inline-flex items-center gap-1 font-mono font-semibold text-foreground">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span>Proposta {proposal.reference}</span>
              </span>
              {proposal.version?.valid_until && (
                <span className="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-900/40">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Válida até {formatDate(proposal.version.valid_until)} (30 dias)</span>
                </span>
              )}
            </div>
          </div>

          {/* Right: Consultant Box & View Profile Button (Item 3 in Image 3) */}
          <div className="flex flex-wrap items-center gap-3 shrink-0 rounded-xl border border-border/60 bg-muted/20 p-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-xs ring-2 ring-primary/20">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">João Silva</p>
                <p className="text-[11px] text-muted-foreground">Consultor comercial</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-1 rounded-xl text-xs font-semibold border-primary/30 text-primary hover:bg-primary/5 h-8 px-3 ml-auto"
            >
              <Link href={`/companies/${proposal.company.id}`}>
                <span>Ver perfil da empresa</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Detail Navigation Tabs (8 tabs matching Imagens 3, 4 e 5 - Sem colisão de texto) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex h-11 w-full items-center gap-1 overflow-x-auto no-scrollbar scrollbar-none rounded-xl border border-border/80 bg-card p-1 shadow-2xs justify-start">
          <TabsTrigger
            value="summary"
            className="shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            Visão geral
          </TabsTrigger>
          <TabsTrigger
            value="technical"
            className="shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            Projeto técnico
          </TabsTrigger>
          <TabsTrigger
            value="equipments"
            className="shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            Equipamentos
          </TabsTrigger>
          <TabsTrigger
            value="financial"
            className="shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            Financeiro
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            Documentos
          </TabsTrigger>
          <TabsTrigger
            value="terms"
            className="shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            Condições
          </TabsTrigger>
          <TabsTrigger
            value="company"
            className="shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            Empresa
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Visão Geral */}
        <TabsContent value="summary" className="mt-6 space-y-6 focus-visible:outline-none">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column (2 cols): Hero Image, Metrics, Equipments, Guarantees */}
            <div className="space-y-6 lg:col-span-2">
              {/* Imagem real da empresa, quando disponível no payload */}
              <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-5">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-2xs">
                  <img
                    src={galleryImages[0] || '/painel-solar-avalia-solar.webp'}
                    alt={`Imagem da proposta de ${proposal.company.name}`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-xl font-extrabold tracking-tight drop-shadow-md">
                      {proposal.version?.title || 'Proposta comercial'}
                    </h3>
                    {proposal.request?.project_profile && (
                      <p className="mt-1 text-xs font-medium text-slate-200">
                        {proposal.request.project_profile}
                      </p>
                    )}
                  </div>
                </div>

                {/* Proposal Title, 4 Highlight Metrics Cards & Description (Item 6 in Image 3) */}
                <div className="space-y-4 pt-2 border-t border-border/60">
                  {/* 4 Metric Cards Grid */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-3.5 text-center shadow-2xs">
                      <Zap className="mx-auto h-5 w-5 text-amber-500" />
                      <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Potência
                      </span>
                      <span className="mt-0.5 block text-sm font-extrabold text-foreground">
                        {powerVal || 'A definir'}
                      </span>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-3.5 text-center shadow-2xs">
                      <Sparkles className="mx-auto h-5 w-5 text-blue-500" />
                      <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Geração estimada
                      </span>
                      <span className="mt-0.5 block text-sm font-extrabold text-foreground">
                        {genVal || 'A calcular'}
                      </span>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-3.5 text-center shadow-2xs">
                      <FileText className="mx-auto h-5 w-5 text-emerald-500" />
                      <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Valor total
                      </span>
                      <span className="mt-0.5 block text-sm font-extrabold text-primary tabular-nums">
                        {displayPrice.isAvailable ? displayPrice.formatted : 'Sob consulta'}
                      </span>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-3.5 text-center shadow-2xs">
                      <Calendar className="mx-auto h-5 w-5 text-violet-500" />
                      <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Prazo de instalação
                      </span>
                      <span className="mt-0.5 block text-sm font-extrabold text-foreground">
                        {deadlineVal || 'A combinar'}
                      </span>
                    </div>
                  </div>

                  {/* Summary Description Paragraph */}
                  <p className="text-xs leading-relaxed text-muted-foreground bg-muted/30 p-3.5 rounded-xl border border-border/50">
                    {proposal.version?.summary || 'Resumo ainda não informado pela empresa.'}
                  </p>

                  {/* Tags Chips Row */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="rounded-full bg-muted/80 text-muted-foreground border border-border/60 px-3 py-1 text-xs font-medium">
                      {proposal.request?.project_profile || 'Perfil não informado'}
                    </span>
                    {getProposalLocation(proposal) && (
                      <span className="rounded-full bg-muted/80 text-muted-foreground border border-border/60 px-3 py-1 text-xs font-medium">
                        {getProposalLocation(proposal)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Equipamentos Principais Block */}
              <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <h4 className="text-base font-extrabold text-foreground">
                    Equipamentos principais
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActiveTab('equipments')}
                    className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <span>Ver todos</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {proposal.version?.items && proposal.version.items.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {proposal.version.items.slice(0, 3).map((item, idx) => {
                      const IconComp = idx === 0 ? Zap : idx === 1 ? Sparkles : Wrench;
                      const iconColor =
                        idx === 0
                          ? 'text-primary bg-primary/10'
                          : idx === 1
                            ? 'text-blue-500 bg-blue-500/10'
                            : 'text-amber-500 bg-amber-500/10';
                      return (
                        <div
                          key={item.id || idx}
                          className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-2 hover:border-primary/40 transition-colors"
                        >
                          <div
                            className={cn(
                              'h-10 w-10 rounded-lg flex items-center justify-center',
                              iconColor
                            )}
                          >
                            <IconComp className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-foreground truncate">
                              {item.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">
                              {item.kind || 'Componente'}
                            </p>
                            <span className="mt-2 inline-block rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground">
                              {item.quantity} {item.unit || 'un'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab('equipments')}
                            className="text-[11px] font-bold text-primary hover:underline block pt-1"
                          >
                            Ver detalhes
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-border/60 bg-muted/10 p-4 text-xs text-muted-foreground">
                    <p>Equipamentos e especificações técnicas vinculadas à proposta comercial.</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('equipments')}
                      className="mt-2 font-bold text-primary hover:underline"
                    >
                      Ver especificações na aba Equipamentos →
                    </button>
                  </div>
                )}
              </div>

              {/* Condições e Garantias Block */}
              <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
                <h4 className="text-base font-extrabold text-foreground border-b border-border/60 pb-3">
                  Condições e garantias
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-3.5">
                    <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-foreground">Garantia dos equipamentos</p>
                      <p className="text-muted-foreground text-[11px] mt-0.5">
                        {getProposalRawTerm(proposal, [
                          'equipment_warranty',
                          'garantia_equipamentos',
                          'garantia',
                        ]) || 'Não informado'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-3.5">
                    <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-foreground">Garantia de instalação</p>
                      <p className="text-muted-foreground text-[11px] mt-0.5">
                        {getProposalRawTerm(proposal, [
                          'service_warranty',
                          'installation_warranty',
                          'garantia_instalacao',
                        ]) || 'Não informado'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-3.5">
                    <Clock className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-foreground">Prazo de instalação</p>
                      <p className="text-muted-foreground text-[11px] mt-0.5">
                        {deadlineVal || 'Não informado'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-3.5">
                    <FileCheck className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-foreground">Condições de pagamento</p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('financial')}
                        className="text-[11px] font-bold text-primary hover:underline mt-0.5 block"
                      >
                        Ver condições completas
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-3.5 sm:col-span-2">
                    <Wrench className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-foreground">Suporte técnico</p>
                      <p className="text-muted-foreground text-[11px] mt-0.5">
                        Incluso por 1 ano sem custo adicional
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Fechamento e Decisão da Proposta (Fiel à referência móvel) */}
              {canDecide(proposal) && (
                <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-foreground">Decisão da proposta</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Garantia de {getProposalRawTerm(proposal, ['equipment_warranty', 'garantia']) || '2 a 5 anos'} • Prazo: {deadlineVal || '15 a 45 dias'}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="lg"
                    onClick={onChoose}
                    className="w-full gap-2 rounded-xl font-extrabold bg-[#F5B800] hover:bg-[#E5AC00] text-slate-950 text-xs sm:text-sm h-11 shadow-xs transition active:scale-[0.99]"
                  >
                    <Check className="h-4 w-4 stroke-[2.5]" />
                    <span>Aceitar e escolher {proposal.company.name}</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Right Column (1 col): Financial Summary, Status Timeline, Documents (Items 7, 8, 11 in Image 3) */}
            <div className="space-y-6">
              {/* Resumo Financeiro Card (Item 7 in Image 3) */}
              <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
                <h4 className="text-base font-extrabold text-foreground border-b border-border/60 pb-3">
                  Resumo financeiro
                </h4>
                <dl className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <dt>Valor dos equipamentos</dt>
                    <dd className="font-semibold tabular-nums text-foreground">R$ 24.800,00</dd>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <dt>Serviços de instalação</dt>
                    <dd className="font-semibold tabular-nums text-foreground">R$ 3.700,00</dd>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <dt>Descontos</dt>
                    <dd className="font-semibold tabular-nums text-emerald-600">- R$ 0,00</dd>
                  </div>
                  <div className="flex justify-between border-t border-border/60 pt-3 text-base font-extrabold">
                    <dt className="text-foreground">Valor total</dt>
                    <dd className="tabular-nums text-primary text-xl">{displayPrice.formatted}</dd>
                  </div>
                </dl>
                <div className="pt-2 border-t border-border/60 flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-medium">Condições de pagamento</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('financial')}
                    className="font-bold text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>Ver condições</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Status da Proposta Timeline Card (Item 8 in Image 3) */}
              <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
                <h4 className="text-base font-extrabold text-foreground border-b border-border/60 pb-3">
                  Status da proposta
                </h4>
                <ol className="space-y-4 text-xs">
                  <li className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 shrink-0 mt-0.5">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Proposta recebida</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        06 de out. de 2026 às 10:24
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shrink-0 mt-0.5 ring-4 ring-blue-100 dark:ring-blue-950/60">
                      <Clock className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="font-bold text-blue-600 dark:text-blue-400">Em análise</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Aguardando sua avaliação
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-border bg-muted/40 text-muted-foreground shrink-0 mt-0.5">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="font-semibold text-muted-foreground">Negociação</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Aguardando atualização
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-border bg-muted/40 text-muted-foreground shrink-0 mt-0.5">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="font-semibold text-muted-foreground">Finalização</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Aguardando aceite</p>
                    </div>
                  </li>
                </ol>
              </div>

              {/* Documentos da Proposta Card (Item 11 in Image 3) */}
              <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-3">
                <h4 className="text-base font-extrabold text-foreground border-b border-border/60 pb-3">
                  Documentos da proposta
                </h4>
                {proposalDocuments.length ? (
                  <ul className="space-y-2.5 text-xs">
                    {proposalDocuments.map((doc) => (
                      <li
                        key={doc.name}
                        className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/20 p-3 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[10px]">
                            PDF
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-foreground text-xs">{doc.name}</p>
                            <p className="text-[10px] text-muted-foreground">{doc.size}</p>
                          </div>
                        </div>
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                        >
                          <a href={doc.href}>
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Baixar {doc.name}</span>
                          </a>
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-2 text-xs text-muted-foreground">
                    Nenhum documento anexado a esta proposta.
                  </p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Projeto Técnico */}
        <TabsContent value="technical" className="mt-6 space-y-6 focus-visible:outline-none">
          {/* Header Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-foreground">
                  Projeto de Engenharia e Memorial Descritivo
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Especificações elétricas, dimensionamento de telhado e normas técnicas aplicadas
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Normas NBR 16690 e 5410</span>
              </span>
            </div>

            {/* 4 Indicadores principais */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-1">
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-center">
                <Zap className="mx-auto h-4 w-4 text-amber-500" />
                <span className="mt-1 block text-[10px] font-bold uppercase text-muted-foreground">
                  Potência de Pico
                </span>
                <span className="text-sm font-extrabold text-foreground">
                  {powerVal || 'A definir'}
                </span>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-center">
                <Sun className="mx-auto h-4 w-4 text-blue-500" />
                <span className="mt-1 block text-[10px] font-bold uppercase text-muted-foreground">
                  Geração Média
                </span>
                <span className="text-sm font-extrabold text-foreground">
                  {genVal || 'A calcular'}
                </span>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-center">
                <Layers className="mx-auto h-4 w-4 text-emerald-500" />
                <span className="mt-1 block text-[10px] font-bold uppercase text-muted-foreground">
                  Área Estimada
                </span>
                <span className="text-sm font-extrabold text-foreground">
                  {getProposalRawTerm(proposal, ['required_area', 'area_m2', 'area_util']) ||
                    'Não informado'}
                </span>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-center">
                <Cpu className="mx-auto h-4 w-4 text-violet-500" />
                <span className="mt-1 block text-[10px] font-bold uppercase text-muted-foreground">
                  Padrão da Rede
                </span>
                <span className="text-sm font-extrabold text-foreground">
                  {getProposalRawTerm(proposal, ['grid_voltage', 'padrao_entrada', 'tensao']) ||
                    'Não informado'}
                </span>
              </div>
            </div>
          </div>

          {/* Cards em Grid 2 Colunas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Arranjo Fotovoltaico (Módulos) */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
              <h4 className="flex items-center gap-2 text-sm font-bold text-foreground border-b border-border/60 pb-3">
                <Sun className="h-4 w-4 text-amber-500" />
                <span>Arranjo Fotovoltaico (Módulos)</span>
              </h4>
              <ul className="space-y-3 text-xs">
                {proposal.version?.items.filter(
                  (i) => /módulo|modulo|painel|placa/i.test(i.name || '') || i.kind === 'module'
                ).length ? (
                  proposal.version.items
                    .filter(
                      (i) => /módulo|modulo|painel|placa/i.test(i.name || '') || i.kind === 'module'
                    )
                    .map((item) => (
                      <li
                        key={item.id}
                        className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-1"
                      >
                        <div className="flex justify-between font-bold text-foreground">
                          <span>{item.name}</span>
                          <span className="text-primary font-bold">
                            {item.quantity} {item.unit || 'un'}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-muted-foreground">{item.description}</p>
                        )}
                      </li>
                    ))
                ) : (
                  <li className="rounded-xl border border-border/60 bg-muted/20 p-3 text-muted-foreground">
                    Módulos fotovoltaicos monocristalinos de alta eficiência (Half-Cell / N-Type
                    Tier-1).
                  </li>
                )}
                <li className="grid grid-cols-2 gap-2 text-muted-foreground pt-1">
                  <div className="rounded-lg bg-muted/30 p-2.5">
                    <span className="block text-[10px] font-semibold">Orientação Preferencial</span>
                    <span className="font-bold text-foreground text-xs">
                      {getProposalRawTerm(proposal, ['azimuth', 'azimute', 'orientacao']) ||
                        'Não informado'}
                    </span>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-2.5">
                    <span className="block text-[10px] font-semibold">Inclinação Recomendada</span>
                    <span className="font-bold text-foreground text-xs">
                      {getProposalRawTerm(proposal, ['tilt_angle', 'inclinacao', 'angulo']) ||
                        'Não informado'}
                    </span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Inversor e Topologia */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
              <h4 className="flex items-center gap-2 text-sm font-bold text-foreground border-b border-border/60 pb-3">
                <Cpu className="h-4 w-4 text-primary" />
                <span>Inversor e Topologia Elétrica</span>
              </h4>
              <ul className="space-y-3 text-xs">
                {proposal.version?.items.filter(
                  (i) => /inversor|microinversor/i.test(i.name || '') || i.kind === 'inverter'
                ).length ? (
                  proposal.version.items
                    .filter(
                      (i) => /inversor|microinversor/i.test(i.name || '') || i.kind === 'inverter'
                    )
                    .map((item) => (
                      <li
                        key={item.id}
                        className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-1"
                      >
                        <div className="flex justify-between font-bold text-foreground">
                          <span>{item.name}</span>
                          <span className="text-primary font-bold">
                            {item.quantity} {item.unit || 'un'}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-muted-foreground">{item.description}</p>
                        )}
                      </li>
                    ))
                ) : (
                  <li className="rounded-xl border border-border/60 bg-muted/20 p-3 text-muted-foreground">
                    Dados do inversor ainda não informados pela empresa.
                  </li>
                )}
                <li className="grid grid-cols-2 gap-2 text-muted-foreground pt-1">
                  <div className="rounded-lg bg-muted/30 p-2.5">
                    <span className="block text-[10px] font-semibold">Eficiência Nominal</span>
                    <span className="font-bold text-foreground text-xs">Não informado</span>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-2.5">
                    <span className="block text-[10px] font-semibold">Comunicação</span>
                    <span className="font-bold text-foreground text-xs">Não informado</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Estrutura de Fixação */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
              <h4 className="flex items-center gap-2 text-sm font-bold text-foreground border-b border-border/60 pb-3">
                <Layers className="h-4 w-4 text-emerald-600" />
                <span>Estrutura de Fixação e Telhado</span>
              </h4>
              <dl className="space-y-2.5 text-xs">
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                  <dt className="text-muted-foreground font-medium">Tipo de cobertura</dt>
                  <dd className="mt-1 font-bold text-foreground">
                    {getProposalRawTerm(proposal, [
                      'roof_type',
                      'tipo_telhado',
                      'tipo_estrutura',
                    ]) || 'Não informado'}
                  </dd>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                  <dt className="text-muted-foreground font-medium">Material da fixação</dt>
                  <dd className="mt-1 font-bold text-foreground">Não informado</dd>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                  <dt className="text-muted-foreground font-medium">Carga de vento projetada</dt>
                  <dd className="mt-1 font-bold text-foreground">Não informado</dd>
                </div>
              </dl>
            </div>

            {/* Proteção, Homologação e Concessionária */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
              <h4 className="flex items-center gap-2 text-sm font-bold text-foreground border-b border-border/60 pb-3">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span>Proteção, Homologação e Concessionária</span>
              </h4>
              <dl className="space-y-2.5 text-xs">
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                  <dt className="text-muted-foreground font-medium">
                    Proteções elétricas (String Box)
                  </dt>
                  <dd className="mt-1 font-bold text-foreground">Não informado</dd>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                  <dt className="text-muted-foreground font-medium">
                    Homologação na Distribuidora
                  </dt>
                  <dd className="mt-1 font-bold text-foreground">Não informado</dd>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                  <dt className="text-muted-foreground font-medium">Responsável Técnico</dt>
                  <dd className="mt-1 font-bold text-foreground">
                    {getProposalRawTerm(proposal, ['art_cft', 'responsavel_tecnico']) ||
                      'Não informado'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Equipamentos */}
        <TabsContent value="equipments" className="mt-6 space-y-4 focus-visible:outline-none">
          {proposal.version ? (
            <VersionContent version={proposal.version} />
          ) : (
            <p className="text-xs text-muted-foreground">
              A empresa está preparando o detalhamento técnico.
            </p>
          )}
        </TabsContent>

        {/* Tab 3: Financeiro */}
        <TabsContent value="financial" className="mt-6 space-y-4 focus-visible:outline-none">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-2xs">
            <h3 className="text-lg font-extrabold text-foreground">
              Condições comerciais e financeiras
            </h3>
            <p className="text-3xl font-extrabold tabular-nums text-primary">
              {displayPrice.formatted}
            </p>
            <dl className="space-y-3 text-xs border-t border-border/60 pt-4">
              {technicalFields.slice(3).map((field) => (
                <div
                  key={field.label}
                  className="rounded-xl border border-border/60 bg-muted/20 p-3.5"
                >
                  <dt className="font-bold text-muted-foreground">{field.label}</dt>
                  <dd className="mt-1 font-bold text-foreground">
                    {termValue(proposal, field.keys)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </TabsContent>

        {/* Tab 4: Documentos */}
        <TabsContent value="documents" className="mt-6 space-y-4 focus-visible:outline-none">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-2xs">
            <h3 className="text-lg font-extrabold text-foreground">Arquivos da proposta</h3>
            {proposalDocuments.length ? (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {proposalDocuments.map((doc) => (
                  <li
                    key={doc.name}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-3.5 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[11px]">
                        PDF
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-foreground text-xs">{doc.name}</p>
                        <p className="text-[11px] text-muted-foreground">{doc.size}</p>
                      </div>
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs font-bold shrink-0 rounded-xl"
                    >
                      <a href={doc.href}>
                        <Download className="h-3.5 w-3.5" />
                        <span>Baixar</span>
                      </a>
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-xs text-muted-foreground">
                Nenhum arquivo anexado a esta proposta até o momento.
              </p>
            )}
          </div>
        </TabsContent>

        {/* Tab 5: Condições */}
        <TabsContent value="terms" className="mt-6 space-y-4 focus-visible:outline-none">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-2xs">
            <h3 className="text-lg font-extrabold text-foreground">Condições gerais do projeto</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {technicalFields.map((field) => (
                <div
                  key={field.label}
                  className="rounded-xl border border-border/60 bg-muted/20 p-3.5"
                >
                  <dt className="font-bold text-muted-foreground">{field.label}</dt>
                  <dd className="mt-1 font-bold text-foreground">
                    {termValue(proposal, field.keys)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </TabsContent>

        {/* Tab 6: Empresa */}
        <TabsContent value="company" className="mt-6 space-y-4 focus-visible:outline-none">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <CompanyMark proposal={proposal} />
              <div>
                <h3 className="text-lg font-extrabold text-foreground">{proposal.company.name}</h3>
                <p className="text-xs font-medium text-muted-foreground">
                  {getProposalLocation(proposal)}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Empresa parceira credenciada e verificada pelo Avalia Solar.
            </p>
            <Button asChild variant="outline" size="sm" className="font-bold text-xs rounded-xl">
              <Link href={`/companies/${proposal.company.id}`}>Ver perfil público da empresa</Link>
            </Button>
          </div>
        </TabsContent>

        {/* Tab 7: Histórico */}
        <TabsContent value="history" className="mt-6 space-y-4 focus-visible:outline-none">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-2xs">
            <h3 className="text-lg font-extrabold text-foreground">
              Histórico de edições e revisões
            </h3>
            <p className="text-xs text-muted-foreground">
              Consulte todas as alterações publicadas para esta proposta.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onNegotiate}
              className="font-bold text-xs rounded-xl"
            >
              Abrir histórico de versões
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Desktop Action Buttons Bar at bottom of details */}
      <div className="hidden sm:grid sm:grid-cols-2 gap-3 pt-4 border-t border-border/60">
        {onConversation ? (
          <Button
            size="lg"
            variant="outline"
            onClick={onConversation}
            className="gap-2 rounded-xl font-bold border-border bg-card shadow-xs"
          >
            <MessageCircle className="h-4 w-4 text-blue-600" />
            <span>Conversar com a empresa</span>
          </Button>
        ) : (
          <Button asChild size="lg" variant="outline" className="gap-2 rounded-xl font-bold border-border bg-card shadow-xs">
            <Link href={proposalChatUrl(proposal)}>
              <MessageCircle className="h-4 w-4 text-blue-600" />
              <span>Conversar com a empresa</span>
            </Link>
          </Button>
        )}
        {(canDecide(proposal) || proposal.status === 'accepted') && (
          <Button
            variant="outline"
            size="lg"
            onClick={onMeeting}
            className="gap-2 rounded-xl font-bold border-border bg-card"
          >
            <CalendarClock className="h-4 w-4 text-primary" />
            <span>Agendar reunião</span>
          </Button>
        )}
      </div>

      {canDecide(proposal) && (
        <div className="hidden sm:grid sm:grid-cols-2 gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={onNegotiate}
            className="rounded-xl font-bold border-border bg-card"
          >
            Solicitar ajustes
          </Button>
          <Button
            size="lg"
            onClick={onChoose}
            className="gap-2 rounded-xl font-bold bg-[#F5B800] hover:bg-[#E5AC00] text-slate-950 shadow-xs"
          >
            <Check className="h-4 w-4 stroke-[2.5]" />
            <span>Escolher esta proposta</span>
          </Button>
        </div>
      )}

      <div className="hidden sm:block">
        <Button
          size="lg"
          onClick={onProject}
          className="w-full gap-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 shadow-xs text-white"
        >
          <ShieldCheck className="h-5 w-5" />
          <span>Acompanhamento do projeto</span>
        </Button>
      </div>

      {/* Mobile Sticky Bottom Action Bar (Chat integrado no rodapé + Escolher Empresa) */}
      <div className="fixed bottom-14 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-2.5 sm:hidden shadow-lg">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          {onConversation ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onConversation}
              className="flex-1 gap-1.5 rounded-xl font-bold border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs h-10 shadow-2xs hover:bg-slate-50"
            >
              <MessageCircle className="h-4 w-4 text-blue-600" />
              <span>Conversar</span>
            </Button>
          ) : (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="flex-1 gap-1.5 rounded-xl font-bold border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs h-10 shadow-2xs hover:bg-slate-50"
            >
              <Link href={proposalChatUrl(proposal)}>
                <MessageCircle className="h-4 w-4 text-blue-600" />
                <span>Conversar</span>
              </Link>
            </Button>
          )}

          {canDecide(proposal) ? (
            <Button
              size="sm"
              onClick={onChoose}
              className="flex-1 gap-1.5 rounded-xl font-extrabold bg-[#F5B800] hover:bg-[#E5AC00] text-slate-950 text-xs h-10 shadow-xs active:scale-[0.99] transition"
            >
              <Check className="h-4 w-4 stroke-[2.5]" />
              <span>Escolher empresa</span>
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={onMeeting}
              className="flex-1 gap-1.5 rounded-xl font-bold border-slate-200 text-xs h-10"
            >
              <CalendarClock className="h-4 w-4 text-blue-600" />
              <span>Agendar</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
