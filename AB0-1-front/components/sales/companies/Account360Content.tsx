'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  RotateCw,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  UserCheck,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { salesApi } from '@/lib/api/sales/client';
import { salesKeys } from '@/lib/api/sales/queryKeys';
import type { DetailedAccount } from '@/lib/api/sales/types';
import { buildWhatsAppUrl } from '@/lib/phone';
import SalesOutreachTemplates from '@/components/sales/SalesOutreachTemplates';
import SolarRoiCalculator from '@/components/sales/SolarRoiCalculator';
import NotesPanel from '@/components/sales/NotesPanel';
import CreateContactModal from '@/components/sales/create/CreateContactModal';
import CreateTaskModal from '@/components/sales/create/CreateTaskModal';
import CreateActivityModal from '@/components/sales/create/CreateActivityModal';
import SendEmailModal from '@/components/sales/create/SendEmailModal';
import CreateOpportunityDialog from '@/components/sales/opportunities/CreateOpportunityDialog';

export interface Account360ContentProps {
  accountId: number;
  mode?: 'full_page' | 'quick_view';
  initialAccount?: DetailedAccount | null;
  onClose?: () => void;
}

const formatCurrency = (cents?: number | null) => {
  if (cents === null || cents === undefined) return '—';
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (iso?: string | null) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('pt-BR');
  } catch {
    return '—';
  }
};

const formatDateTime = (iso?: string | null) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

export default function Account360Content({
  accountId,
  mode = 'full_page',
  initialAccount,
  onClose,
}: Account360ContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Active tab state: synced with URL in full_page mode
  const currentTabFromUrl = searchParams.get('tab') || 'overview';
  const [localTab, setLocalTab] = useState(currentTabFromUrl);
  const activeTab = mode === 'full_page' ? currentTabFromUrl : localTab;

  const handleTabChange = (nextTab: string) => {
    if (mode === 'full_page') {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', nextTab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    } else {
      setLocalTab(nextTab);
    }
  };

  // Modals state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedRecipientEmail, setSelectedRecipientEmail] = useState<string | null>(null);
  const [selectedRecipientName, setSelectedRecipientName] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isOpportunityModalOpen, setIsOpportunityModalOpen] = useState(false);

  // TanStack Query for account detail
  const {
    data: account,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<DetailedAccount>({
    queryKey: salesKeys.accountDetail(accountId),
    queryFn: ({ signal }) => salesApi.getAccount(accountId, { signal }),
    initialData: initialAccount || undefined,
    enabled: Number.isInteger(accountId) && accountId > 0,
    staleTime: 30_000,
  });

  // TanStack Query for timeline events
  const {
    data: timelineData,
    isLoading: isTimelineLoading,
    refetch: refetchTimeline,
  } = useQuery({
    queryKey: salesKeys.accountTimeline(accountId),
    queryFn: ({ signal }) => salesApi.getAccountTimeline(accountId, { signal }),
    enabled: Number.isInteger(accountId) && accountId > 0,
    staleTime: 15_000,
  });

  const handleRefreshAll = () => {
    queryClient.invalidateQueries({ queryKey: salesKeys.accountDetail(accountId) });
    queryClient.invalidateQueries({ queryKey: salesKeys.accountTimeline(accountId) });
    refetch();
    refetchTimeline();
  };

  if (isLoading && !account) {
    return (
      <div className="py-20 text-center space-y-4 bg-white rounded-xl border border-slate-200 p-8 shadow-2xs">
        <RotateCw className="mx-auto h-8 w-8 animate-spin text-blue-900" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-slate-800">Carregando Ficha 360° da Empresa...</p>
          <p className="text-xs text-slate-500">
            Obtendo dados cadastrais, comitê, inteligência de mercado e oportunidades
          </p>
        </div>
      </div>
    );
  }

  if (isError || !account) {
    const errorMsg =
      error instanceof Error ? error.message : 'Não foi possível carregar os dados desta empresa.';
    const is404 = errorMsg.includes('404') || errorMsg.includes('não encontrada');
    const is403 = errorMsg.includes('403') || errorMsg.includes('não autorizado');

    return (
      <div className="py-16 text-center space-y-4 bg-white rounded-xl border border-slate-200 p-8 shadow-2xs max-w-xl mx-auto my-8">
        <AlertCircle className="mx-auto h-10 w-10 text-red-600" />
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900">
            {is404
              ? 'Empresa não encontrada'
              : is403
              ? 'Acesso Restrito'
              : 'Falha ao carregar conta'}
          </h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto">{errorMsg}</p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          {mode === 'full_page' ? (
            <Link href="/dashboard/sales/accounts">
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Voltar para Empresas
              </Button>
            </Link>
          ) : (
            onClose && (
              <Button onClick={onClose} variant="outline" size="sm" className="text-xs font-semibold">
                Fechar Preview
              </Button>
            )
          )}
          <Button onClick={() => refetch()} size="sm" className="bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold">
            <RotateCw className="mr-1.5 h-3.5 w-3.5" /> Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  const contacts = account.contacts ?? [];
  const opportunities = account.opportunities ?? [];
  const activities = account.activities ?? [];
  const tasks = account.tasks ?? [];
  const marketplace = account.marketplace;
  const tags = account.tags ?? [];
  const summary = account.summary;
  const nextBestAction = account.next_best_action;

  // Real Fit Score and Data Quality without fictitious fallbacks
  const rawFitScore =
    typeof account.fit_score === 'number'
      ? account.fit_score
      : account.fit_score?.score ?? null;

  const rawDataQuality =
    typeof account.data_quality === 'number'
      ? account.data_quality
      : account.data_quality?.score ?? null;

  const missingFields =
    typeof account.data_quality === 'object' && account.data_quality?.missing_fields
      ? account.data_quality.missing_fields
      : [];

  const handleOpenEmailToContact = (c?: { id?: number; email?: string | null; first_name?: string; last_name?: string | null }) => {
    setSelectedContactId(c?.id || null);
    setSelectedRecipientEmail(c?.email || account.email || null);
    setSelectedRecipientName(c ? [c.first_name, c.last_name].filter(Boolean).join(' ') : account.name);
    setIsEmailModalOpen(true);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Breadcrumb & Navigation for Full Page */}
      {mode === 'full_page' && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link
              href="/dashboard/sales"
              className="hover:text-blue-900 transition-colors font-medium"
            >
              CRM
            </Link>
            <span>/</span>
            <Link
              href="/dashboard/sales/accounts"
              className="hover:text-blue-900 transition-colors font-medium"
            >
              Empresas
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-900 truncate max-w-xs">{account.name}</span>
          </div>

          <Link href="/dashboard/sales/accounts">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Voltar à Lista
            </Button>
          </Link>
        </div>
      )}

      {/* Main Account Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-0 bg-blue-900 font-bold text-white text-[11px] px-2.5 py-0.5">
                Conta Comercial #{account.id}
              </Badge>
              {account.segment && (
                <Badge
                  variant="outline"
                  className="border-slate-300 bg-slate-50 text-[11px] font-semibold text-slate-700"
                >
                  {account.segment}
                </Badge>
              )}
              {account.status && (
                <Badge
                  variant="outline"
                  className="border-blue-200 bg-blue-50 text-[11px] font-bold text-blue-900 uppercase"
                >
                  {account.status}
                </Badge>
              )}
              {marketplace?.verified && (
                <Badge className="border-0 bg-emerald-100 font-bold text-emerald-800 text-[11px] flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-700" /> Selo Verificado
                </Badge>
              )}
              {marketplace ? (
                <Badge
                  variant="outline"
                  className={`text-[11px] font-semibold ${
                    marketplace.claimed
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-800'
                      : 'border-slate-300 bg-slate-100 text-slate-600'
                  }`}
                >
                  {marketplace.claimed ? 'Perfil Reivindicado' : 'Perfil Não Reclamado'}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-amber-200 bg-amber-50 text-[11px] font-semibold text-amber-800"
                >
                  Sem vínculo ao Marketplace
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-900 border border-blue-100 shrink-0">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                  {account.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  {(account.city || account.state) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      {[account.city, account.state].filter(Boolean).join(', ')}
                    </span>
                  )}
                  {account.domain && (
                    <a
                      href={account.website || `https://${account.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-700 hover:underline font-medium"
                    >
                      <Globe className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      {account.domain}
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  )}
                  {account.phone && (
                    <a
                      href={`tel:${account.phone}`}
                      className="flex items-center gap-1 hover:text-slate-900 font-medium"
                    >
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      {account.phone}
                    </a>
                  )}
                  {account.email && (
                    <a
                      href={`mailto:${account.email}`}
                      className="flex items-center gap-1 hover:text-slate-900 font-medium"
                    >
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      {account.email}
                    </a>
                  )}
                  {account.owner_name && (
                    <span className="flex items-center gap-1 text-slate-700 font-medium bg-slate-100 px-2 py-0.5 rounded">
                      <UserCheck className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      Owner: {account.owner_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {mode === 'quick_view' && (
              <Link href={`/dashboard/sales/accounts/${account.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-bold text-blue-900 border-blue-200 hover:bg-blue-50"
                >
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5 text-blue-700" /> Abrir Ficha Completa
                </Button>
              </Link>
            )}

            <Button
              size="sm"
              onClick={() => handleOpenEmailToContact()}
              className="h-8 text-xs font-bold bg-blue-900 hover:bg-blue-950 text-white shadow-2xs"
            >
              <Send className="mr-1.5 h-3.5 w-3.5" /> Enviar E-mail
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsActivityModalOpen(true)}
              className="h-8 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Phone className="mr-1.5 h-3.5 w-3.5 text-slate-600" /> Registrar Chamada
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsTaskModalOpen(true)}
              className="h-8 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5 text-slate-600" /> Criar Tarefa
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsOpportunityModalOpen(true)}
              className="h-8 text-xs font-bold text-emerald-800 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
            >
              <Target className="mr-1.5 h-3.5 w-3.5 text-emerald-700" /> Nova Oportunidade
            </Button>

            <SolarRoiCalculator companyName={account.name} />
            <SalesOutreachTemplates companyName={account.name} city={account.city || ''} />
          </div>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Tags:</span>
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                style={{
                  color: tag.color || '#1d4ed8',
                  borderColor: `${tag.color || '#93c5fd'}55`,
                  backgroundColor: `${tag.color || '#dbeafe'}22`,
                }}
                className="text-[11px] font-medium"
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="flex w-full justify-start gap-1 overflow-x-auto bg-slate-100/90 p-1 text-xs border border-slate-200/80 rounded-lg">
          <TabsTrigger
            value="overview"
            className="min-w-max data-[state=active]:bg-white data-[state=active]:font-bold data-[state=active]:text-blue-900 shadow-2xs"
          >
            Visão Geral 360°
          </TabsTrigger>
          <TabsTrigger
            value="people"
            className="min-w-max data-[state=active]:bg-white data-[state=active]:font-bold data-[state=active]:text-blue-900 shadow-2xs"
          >
            Pessoas & Decisores ({contacts.length})
          </TabsTrigger>
          <TabsTrigger
            value="timeline"
            className="min-w-max data-[state=active]:bg-white data-[state=active]:font-bold data-[state=active]:text-blue-900 shadow-2xs"
          >
            Timeline & Histórico ({summary?.activities_count ?? activities.length})
          </TabsTrigger>
          <TabsTrigger
            value="deals"
            className="min-w-max data-[state=active]:bg-white data-[state=active]:font-bold data-[state=active]:text-blue-900 shadow-2xs"
          >
            Oportunidades ({opportunities.length})
          </TabsTrigger>
          <TabsTrigger
            value="marketplace"
            className="min-w-max data-[state=active]:bg-white data-[state=active]:font-bold data-[state=active]:text-blue-900 shadow-2xs"
          >
            Marketplace Intel
          </TabsTrigger>
        </TabsList>

        {/* ===================== TAB: OVERVIEW ===================== */}
        <TabsContent value="overview" className="mt-4 space-y-6">
          {/* KPI Cards Row (Real Data) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-slate-200 bg-white shadow-2xs">
              <CardContent className="p-4 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Oportunidades Abertas
                </p>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-blue-950">
                    {summary?.open_opportunities_count ??
                      opportunities.filter((o) => o.status === 'open').length}
                  </span>
                  <span className="text-xs font-semibold text-blue-800">
                    {formatCurrency(
                      summary?.open_pipeline_value_cents ??
                        opportunities
                          .filter((o) => o.status === 'open')
                          .reduce((acc, curr) => acc + (curr.value_cents || 0), 0)
                    )}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Total em negociação no funil</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-2xs">
              <CardContent className="p-4 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Oportunidades Ganhas
                </p>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-emerald-900">
                    {summary?.won_opportunities_count ??
                      opportunities.filter((o) => o.status === 'won').length}
                  </span>
                  <span className="text-xs font-semibold text-emerald-800">
                    {formatCurrency(
                      summary?.won_pipeline_value_cents ??
                        opportunities
                          .filter((o) => o.status === 'won')
                          .reduce((acc, curr) => acc + (curr.value_cents || 0), 0)
                    )}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Receita total convertida</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-2xs">
              <CardContent className="p-4 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Atividades Comerciais
                </p>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-slate-900">
                    {summary?.activities_count ?? activities.length}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">
                    Última: {formatDate(summary?.last_activity_at || activities[0]?.occurred_at)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Ligações, reuniões e notas</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-2xs">
              <CardContent className="p-4 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  E-mails Registrados
                </p>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-indigo-950">
                    {summary?.emails_sent_count ?? 0}
                  </span>
                  <span className="text-xs font-semibold text-indigo-800">
                    {summary?.emails_opened_count ?? 0} aberturas
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  {summary?.last_email_sent_at
                    ? `Último envio: ${formatDate(summary.last_email_sent_at)}`
                    : 'Nenhum e-mail enviado'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Intelligence Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Real Next Best Action */}
            <Card className="border-blue-200 bg-blue-50/40 shadow-2xs flex flex-col justify-between">
              <CardHeader className="p-4 border-b border-blue-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-blue-900 p-1.5 text-white">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900">
                      Próxima Melhor Ação (Next Best Action)
                    </CardTitle>
                    <p className="text-[11px] text-slate-500">
                      Recomendação prescritiva baseada no estágio e engajamento
                    </p>
                  </div>
                </div>
                {nextBestAction?.priority && (
                  <Badge
                    className={`text-[10px] font-bold uppercase border-0 ${
                      nextBestAction.priority === 'urgent' || nextBestAction.priority === 'high'
                        ? 'bg-red-100 text-red-800'
                        : nextBestAction.priority === 'medium'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    Prioridade: {nextBestAction.priority}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-bold text-blue-950">
                    {nextBestAction?.title ||
                      (contacts.length === 0
                        ? 'Mapear Decisores Comerciais'
                        : 'Iniciar Abordagem de Qualificação')}
                  </p>
                  <p className="text-slate-700 leading-relaxed font-normal">
                    {nextBestAction?.reason ||
                      (contacts.length === 0
                        ? 'Esta conta não possui decisores ou contatos cadastrados. Adicione contatos para permitir abordagem multicanal.'
                        : `A empresa possui ${contacts.length} contato(s). Faça o primeiro contato comercial com o decisor principal.`)}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (contacts.length === 0) {
                        setIsContactModalOpen(true);
                      } else {
                        handleOpenEmailToContact(contacts[0]);
                      }
                    }}
                    className="h-8 text-xs font-bold bg-blue-900 hover:bg-blue-950 text-white"
                  >
                    {nextBestAction?.cta_label ||
                      (contacts.length === 0 ? 'Adicionar Decisor' : 'Abordar por E-mail')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsTaskModalOpen(true)}
                    className="h-8 text-xs font-semibold"
                  >
                    Criar Tarefa de Acompanhamento
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Fit Score & Data Quality */}
            <Card className="border-slate-200 bg-white shadow-2xs">
              <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-emerald-800 p-1.5 text-white">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900">
                      Qualidade Cadastral & Fit Score
                    </CardTitle>
                    <p className="text-[11px] text-slate-500">Auditoria objetiva de dados do CRM</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Fit Score</p>
                    <div className="mt-1 flex items-baseline gap-1">
                      {rawFitScore !== null ? (
                        <>
                          <span className="text-xl font-extrabold text-emerald-800">
                            {rawFitScore}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">/ 100</span>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">Não calculado</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Aderência do segmento, porte e região
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Data Quality</p>
                    <div className="mt-1 flex items-baseline gap-1">
                      {rawDataQuality !== null ? (
                        <>
                          <span className="text-xl font-extrabold text-blue-900">
                            {rawDataQuality}%
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">Não calculado</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Completude dos campos chave</p>
                  </div>
                </div>

                {missingFields.length > 0 && (
                  <div className="rounded-lg bg-amber-50/70 border border-amber-200 p-3 space-y-1.5">
                    <p className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-700 shrink-0" /> Campos
                      recomendados para preenchimento:
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {missingFields.map((field) => (
                        <Badge
                          key={field}
                          variant="outline"
                          className="text-[10px] font-medium border-amber-300 bg-white text-amber-800"
                        >
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===================== TAB: PEOPLE & DECISORS ===================== */}
        <TabsContent value="people" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Pessoas & Comitê Comercial ({contacts.length})
              </h3>
              <p className="text-xs text-slate-500">
                Decisores, influenciadores e contatos vinculados a esta conta.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsContactModalOpen(true)}
              className="bg-blue-900 hover:bg-blue-950 font-bold text-white text-xs"
            >
              <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Adicionar Contato / Decisor
            </Button>
          </div>

          {contacts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center space-y-3">
              <Users className="mx-auto h-8 w-8 text-slate-400" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">
                  Nenhum decisor ou contato cadastrado
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Adicione executivos, engenheiros ou compradores desta empresa para organizar o
                  processo comercial.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setIsContactModalOpen(true)}
                className="bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs"
              >
                <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Cadastrar Primeiro Contato
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.map((c) => {
                const waUrl = buildWhatsAppUrl(c.whatsapp || c.phone);
                return (
                  <Card
                    key={c.id}
                    className="border-slate-200 bg-white shadow-2xs hover:border-blue-400 transition"
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold text-slate-900">
                              {c.first_name} {c.last_name || ''}
                            </p>
                            {c.is_primary && (
                              <Badge className="text-[10px] bg-emerald-100 text-emerald-800 border-0 font-bold px-1.5 py-0">
                                Principal
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {c.job_title || 'Cargo não informado'}
                          </p>
                        </div>
                        {c.decision_role && (
                          <Badge className="border-0 bg-blue-900 font-semibold text-white text-[10px] shrink-0">
                            {c.decision_role}
                          </Badge>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-600 border-t border-b border-slate-100 py-2 space-y-1">
                        {c.email ? (
                          <p className="flex items-center gap-1.5 truncate">
                            <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                            <a href={`mailto:${c.email}`} className="hover:text-blue-900 truncate">
                              {c.email}
                            </a>
                          </p>
                        ) : (
                          <p className="text-slate-400 italic">E-mail não informado</p>
                        )}
                        {(c.phone || c.whatsapp) && (
                          <p className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>{c.phone || c.whatsapp}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        {waUrl !== '#' && (
                          <Button
                            size="sm"
                            onClick={() => window.open(waUrl, '_blank', 'noopener,noreferrer')}
                            className="h-7 bg-emerald-600 hover:bg-emerald-700 font-bold text-white text-[11px] px-2.5"
                          >
                            <MessageSquare className="mr-1 h-3 w-3" /> WhatsApp
                          </Button>
                        )}
                        {c.email && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEmailToContact(c)}
                            className="h-7 text-[11px] font-semibold text-slate-700"
                          >
                            <Mail className="mr-1 h-3 w-3 text-slate-500" /> E-mail
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ===================== TAB: TIMELINE & NOTES ===================== */}
        <TabsContent value="timeline" className="mt-4 space-y-6">
          {/* Notes Composer in Timeline */}
          <NotesPanel accountId={accountId} />

          {/* Unified Timeline Feed */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Histórico & Eventos da Conta</h3>
                <p className="text-xs text-slate-500">
                  Atividades, notas, e-mails comerciais e tarefas em ordem cronológica.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshAll}
                className="h-7 text-xs font-semibold text-slate-600"
              >
                <RotateCw className="mr-1.5 h-3 w-3" /> Atualizar
              </Button>
            </div>

            {isTimelineLoading && !timelineData ? (
              <div className="py-8 text-center space-y-2">
                <RotateCw className="mx-auto h-6 w-6 animate-spin text-blue-900" />
                <p className="text-xs text-slate-500">Carregando feed de atividades...</p>
              </div>
            ) : timelineData?.events && timelineData.events.length > 0 ? (
              <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                {timelineData.events.map((ev) => (
                  <div key={ev.id} className="relative flex items-start gap-4 pl-8">
                    <div className="absolute left-0 rounded-full bg-blue-900 p-1.5 text-white">
                      {ev.kind === 'email' ? (
                        <Mail className="h-3.5 w-3.5" />
                      ) : ev.kind === 'note' ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : ev.kind === 'task' ? (
                        <Calendar className="h-3.5 w-3.5" />
                      ) : (
                        <Phone className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-3 w-full space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900">{ev.title}</span>
                        <span className="text-[10px] text-slate-400">
                          {formatDateTime(ev.occurred_at)}
                        </span>
                      </div>
                      {ev.description && (
                        <p className="text-xs text-slate-600 whitespace-pre-wrap">
                          {ev.description}
                        </p>
                      )}
                      {ev.actor_name && (
                        <p className="text-[10px] text-slate-400">Por: {ev.actor_name}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length > 0 ? (
              <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                {activities.map((act) => (
                  <div key={act.id} className="relative flex items-start gap-4 pl-8">
                    <div className="absolute left-0 rounded-full bg-blue-900 p-1.5 text-white">
                      <Phone className="h-3.5 w-3.5" />
                    </div>
                    <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-3 w-full space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900">{act.subject}</p>
                        <span className="text-[10px] text-slate-400">
                          {formatDateTime(act.occurred_at)}
                        </span>
                      </div>
                      {act.body && (
                        <p className="text-xs text-slate-600 whitespace-pre-wrap">{act.body}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center space-y-2">
                <Activity className="mx-auto h-8 w-8 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">
                  Nenhuma atividade ou nota registrada ainda
                </p>
                <p className="text-[11px] text-slate-400">
                  Utilize os botões no topo para registrar chamadas, tarefas ou enviar e-mails.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ===================== TAB: OPPORTUNITIES ===================== */}
        <TabsContent value="deals" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Oportunidades Comerciais ({opportunities.length})
              </h3>
              <p className="text-xs text-slate-500">
                Projetos solares, contratações e expansões em andamento nesta conta.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsOpportunityModalOpen(true)}
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs"
            >
              <Target className="mr-1.5 h-3.5 w-3.5" /> Nova Oportunidade
            </Button>
          </div>

          {opportunities.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center space-y-3">
              <Target className="mx-auto h-8 w-8 text-slate-400" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">
                  Nenhuma oportunidade aberta nesta conta
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Crie uma oportunidade comercial para acompanhar valores, previsões e estágios do
                  funil de vendas.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setIsOpportunityModalOpen(true)}
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs"
              >
                <Target className="mr-1.5 h-3.5 w-3.5" /> Criar Primeira Oportunidade
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-blue-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{opp.name}</h4>
                      {opp.status && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold uppercase ${
                            opp.status === 'won'
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                              : opp.status === 'lost'
                              ? 'border-red-300 bg-red-50 text-red-800'
                              : 'border-blue-300 bg-blue-50 text-blue-800'
                          }`}
                        >
                          {opp.status}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>
                        Probabilidade:{' '}
                        {opp.probability !== null && opp.probability !== undefined
                          ? `${opp.probability}%`
                          : 'Não informada'}
                      </span>
                      {opp.expected_close_date && (
                        <span>Previsão: {formatDate(opp.expected_close_date)}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-extrabold text-blue-950 block">
                      {formatCurrency(opp.value_cents)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ===================== TAB: MARKETPLACE INTEL ===================== */}
        <TabsContent value="marketplace" className="mt-4 space-y-4">
          <Card className="border-blue-200 bg-blue-50/30 shadow-2xs">
            <CardHeader className="p-4 border-b border-blue-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-900 p-1.5 text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Marketplace Intelligence (Avalia Solar)
                  </CardTitle>
                  <p className="text-[11px] text-slate-500">
                    Inteligência de demanda pública e reputação no portal
                  </p>
                </div>
              </div>
              {marketplace ? (
                <Badge className="border-0 bg-blue-900 text-white font-bold text-[10px]">
                  ID #{marketplace.id}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-amber-300 bg-amber-50 font-bold text-amber-900 text-[10px]"
                >
                  Não Vinculado
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              {marketplace ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg bg-white p-3 border border-slate-200">
                      <p className="text-[10px] uppercase font-bold text-slate-500">
                        Reputação Pública
                      </p>
                      <p className="mt-1 text-base font-extrabold text-amber-600 flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                        {marketplace.rating_avg ? `${marketplace.rating_avg.toFixed(1)} ★` : 'Sem nota'}
                        <span className="text-xs font-medium text-slate-500">
                          ({marketplace.rating_count ?? 0} avaliações)
                        </span>
                      </p>
                    </div>

                    <div className="rounded-lg bg-white p-3 border border-slate-200">
                      <p className="text-[10px] uppercase font-bold text-slate-500">
                        Selo de Auditoria
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-900 flex items-center gap-1">
                        {marketplace.verified ? (
                          <>
                            <ShieldCheck className="h-4 w-4 text-emerald-600" /> Empresa Verificada
                          </>
                        ) : (
                          'Padrão (Sem Selo)'
                        )}
                      </p>
                    </div>

                    <div className="rounded-lg bg-white p-3 border border-slate-200">
                      <p className="text-[10px] uppercase font-bold text-slate-500">
                        Posse do Perfil
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {marketplace.claimed ? 'Perfil Reivindicado' : 'Perfil Não Reclamado'}
                      </p>
                    </div>
                  </div>

                  {marketplace.slug && (
                    <div className="rounded-lg bg-white p-4 border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900">Perfil Público da Empresa</p>
                        <p className="text-[11px] text-slate-500">
                          https://avaliasolar.com.br/empresa/{marketplace.slug}
                        </p>
                      </div>
                      <a
                        href={`https://avaliasolar.com.br/empresa/${marketplace.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs font-bold text-blue-900 border-blue-200 hover:bg-blue-50"
                        >
                          <ExternalLink className="mr-1.5 h-3.5 w-3.5 text-blue-700" /> Ver no Portal
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg bg-white p-6 border border-dashed border-slate-300 text-center space-y-2">
                  <Building2 className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="text-xs font-bold text-slate-800">
                    Esta Conta Comercial ainda não está vinculada a um perfil público
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                    Ao vincular a conta a uma empresa do portal Avalia Solar, os sinais de demanda
                    B2C, selos de qualidade e histórico de avaliações são automaticamente
                    sincronizados nesta ficha.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals for Quick Actions */}
      <SendEmailModal
        open={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        accountId={accountId}
        contactId={selectedContactId}
        contactEmail={selectedRecipientEmail}
        contactName={selectedRecipientName}
        companyName={account.name}
        onSuccess={() => {
          handleRefreshAll();
          setIsEmailModalOpen(false);
        }}
      />

      <CreateContactModal
        open={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        accountId={accountId}
        onSuccess={() => {
          handleRefreshAll();
          setIsContactModalOpen(false);
        }}
      />

      <CreateTaskModal
        open={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        accountId={accountId}
        onSuccess={() => {
          handleRefreshAll();
          setIsTaskModalOpen(false);
        }}
      />

      <CreateActivityModal
        open={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        accountId={accountId}
        onSuccess={() => {
          handleRefreshAll();
          setIsActivityModalOpen(false);
        }}
      />

      <CreateOpportunityDialog
        open={isOpportunityModalOpen}
        onOpenChange={setIsOpportunityModalOpen}
        accountId={accountId}
        onSuccess={() => {
          handleRefreshAll();
          setIsOpportunityModalOpen(false);
        }}
      />
    </div>
  );
}
