'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Building2,
  Eye,
  Globe,
  MapPin,
  MessageSquare,
  Phone,
  RotateCw,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SalesOutreachTemplates from '@/components/sales/SalesOutreachTemplates';
import SolarRoiCalculator from '@/components/sales/SolarRoiCalculator';
import NotesPanel from '@/components/sales/NotesPanel';
import SiteSurveyForm from '@/components/sales/SiteSurveyForm';

type DetailedAccount = {
  id: number;
  name: string;
  domain?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  segment?: string | null;
  status?: string | null;
  tags?: Array<{ id: number; name: string; color?: string | null }>;
  owner_name?: string | null;
  contacts?: Array<{
    id: number;
    first_name: string;
    last_name?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    job_title?: string;
    decision_role?: string;
    is_primary?: boolean;
  }>;
  opportunities?: Array<{
    id: number;
    name: string;
    value_cents?: number;
    probability?: number;
    stage_id?: number;
  }>;
  activities?: Array<{
    id: number;
    activity_type: string;
    subject: string;
    body?: string;
    occurred_at: string;
  }>;
  tasks?: Array<{
    id: number;
    title: string;
    due_at?: string;
    completed_at?: string;
    priority?: string;
  }>;
  solar_project_id?: number;
  marketplace?: {
    id: number;
    name: string;
    slug?: string;
    rating_avg?: number;
    rating_count?: number;
    verified?: boolean;
    city?: string;
    state?: string;
  } | null;
};

export default function Company360View({
  accountId,
  companyName = 'Conta de Vendas',
  city = '—',
  state = '—',
  segment = 'Integrador / Instalador',
  domain,
  solarProjectId,
  openByDefault = false,
}: {
  accountId?: number;
  companyName?: string;
  city?: string;
  state?: string;
  segment?: string;
  domain?: string;
  solarProjectId?: number;
  openByDefault?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountData, setAccountData] = useState<DetailedAccount | null>(null);

  const fetchDetails = useCallback(() => {
    if (!accountId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/v1/sales/accounts/${accountId}`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Não foi possível carregar os detalhes da conta.');
        return res.json();
      })
      .then((data) => {
        if (data?.account) {
          setAccountData(data.account);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Erro ao buscar dados.');
      })
      .finally(() => setLoading(false));
  }, [accountId]);

  useEffect(() => {
    if (openByDefault) {
      setOpen(true);
      fetchDetails();
    }
  }, [openByDefault, fetchDetails]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && accountId && !accountData) {
      fetchDetails();
    }
  };

  const name = accountData?.name || companyName;
  const locationCity = accountData?.city || city;
  const locationState = accountData?.state || state;
  const activeSegment = accountData?.segment || segment;
  const activeDomain = accountData?.domain || domain || accountData?.website;
  const contacts = accountData?.contacts ?? [];
  const opportunities = accountData?.opportunities ?? [];
  const activities = accountData?.activities ?? [];
  const marketplace = accountData?.marketplace;
  const tags = accountData?.tags ?? [];
  const activeSolarProjectId = solarProjectId || accountData?.solar_project_id;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs font-bold text-blue-900 hover:bg-blue-50"
        >
          <Eye className="mr-1 h-3.5 w-3.5 text-blue-700" /> Ver Ficha 360°
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-5xl max-h-[90vh] overflow-y-auto bg-white border-slate-200 p-3 sm:p-6">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="border-0 bg-blue-900 font-bold text-white">
                  Company 360° Sales OS
                </Badge>
                <Badge
                  variant="outline"
                  className="border-slate-300 bg-slate-50 text-[11px] font-semibold text-slate-700"
                >
                  {activeSegment}
                </Badge>
                {marketplace?.verified && (
                  <Badge className="border-0 bg-emerald-100 font-bold text-emerald-800 text-[11px] flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-emerald-700" /> Selo Verificado
                  </Badge>
                )}
              </div>
              <DialogTitle className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {name}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" /> {locationCity}, {locationState}
                {activeDomain && (
                  <>
                    <Globe className="h-3.5 w-3.5 text-slate-400 ml-1" /> {activeDomain}
                  </>
                )}
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              <SolarRoiCalculator companyName={name} />
              <SalesOutreachTemplates companyName={name} city={locationCity} />
            </div>
          </div>
        </DialogHeader>

        {accountId && <NotesPanel accountId={accountId} />}
        {activeSolarProjectId && <SiteSurveyForm projectId={activeSolarProjectId} />}

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RotateCw className="mx-auto h-8 w-8 animate-spin text-blue-900" />
            <p className="text-sm font-semibold text-slate-600">
              Carregando inteligência 360° da conta...
            </p>
          </div>
        ) : error ? (
          <div className="py-12 text-center space-y-3">
            <AlertCircle className="mx-auto h-8 w-8 text-red-600" />
            <p className="text-sm font-semibold text-slate-900">{error}</p>
            <Button onClick={fetchDetails} variant="outline" size="sm" className="font-semibold">
              <RotateCw className="mr-1.5 h-3.5 w-3.5" /> Tentar Novamente
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4 w-full">
            <TabsList className="flex w-full gap-1 overflow-x-auto bg-slate-100 p-1 text-xs">
              <TabsTrigger
                value="overview"
                className="min-w-max data-[state=active]:bg-white data-[state=active]:font-bold"
              >
                Visão Geral 360°
              </TabsTrigger>
              <TabsTrigger
                value="committee"
                className="min-w-max data-[state=active]:bg-white data-[state=active]:font-bold"
              >
                Comitê ({contacts.length})
              </TabsTrigger>
              <TabsTrigger
                value="timeline"
                className="min-w-max data-[state=active]:bg-white data-[state=active]:font-bold"
              >
                Timeline ({activities.length})
              </TabsTrigger>
              <TabsTrigger
                value="opportunities"
                className="min-w-max data-[state=active]:bg-white data-[state=active]:font-bold"
              >
                Oportunidades ({opportunities.length})
              </TabsTrigger>
              <TabsTrigger
                value="intelligence"
                className="min-w-max data-[state=active]:bg-white data-[state=active]:font-bold"
              >
                Marketplace Intel
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Marketplace Intelligence Side */}
                <Card className="border-blue-200 bg-blue-50/30 shadow-2xs">
                  <CardHeader className="p-4 border-b border-blue-100 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded bg-blue-900 p-1.5 text-white">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-sm font-bold text-slate-900">
                        Marketplace Intelligence (Avalia Solar)
                      </CardTitle>
                    </div>
                    {marketplace ? (
                      <Badge
                        variant="outline"
                        className="border-blue-300 bg-white font-bold text-blue-900 text-[10px]"
                      >
                        Perfil Vinculado (#{marketplace.id})
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-amber-300 bg-amber-50 font-bold text-amber-900 text-[10px]"
                      >
                        Não Vinculado ao Portal
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="p-4 space-y-3.5 text-xs">
                    {marketplace ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-white p-3 border border-slate-200">
                          <p className="text-[10px] uppercase font-bold text-slate-500">
                            Reputação Pública
                          </p>
                          <p className="mt-1 text-base font-extrabold text-amber-600 flex items-center gap-1">
                            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />{' '}
                            {marketplace.rating_avg
                              ? `${marketplace.rating_avg.toFixed(1)} ★`
                              : 'Sem nota'}
                            <span className="text-xs font-medium text-slate-500">
                              ({marketplace.rating_count ?? 0} avaliações)
                            </span>
                          </p>
                        </div>

                        <div className="rounded-lg bg-white p-3 border border-slate-200">
                          <p className="text-[10px] uppercase font-bold text-slate-500">
                            Status no Portal
                          </p>
                          <p className="mt-1 text-sm font-bold text-slate-900">
                            {marketplace.verified ? 'Empresa Verificada' : 'Perfil Não Reclamado'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-white p-4 border border-dashed border-slate-300 text-center space-y-2">
                        <Building2 className="mx-auto h-8 w-8 text-slate-400" />
                        <p className="text-xs font-semibold text-slate-700">
                          Esta Conta de Vendas ainda não está vinculada a um perfil cadastrado no
                          Marketplace Avalia Solar.
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Vincule a empresa para visualizar métricas de tráfego, avaliações e
                          demandas B2C recebidas.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Sales Intelligence Side */}
                <Card className="border-slate-200 bg-white shadow-2xs">
                  <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded bg-blue-900 p-1.5 text-white">
                        <Target className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-sm font-bold text-slate-900">
                        Sales Intelligence & Prospecção
                      </CardTitle>
                    </div>
                    <Badge className="border-0 bg-blue-900 font-bold text-white text-[10px]">
                      {accountData?.status || 'Prospect'}
                    </Badge>
                  </CardHeader>
                  {tags.length > 0 && (
                    <CardContent className="flex flex-wrap gap-1 border-b border-slate-100 p-4">
                      {tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          style={{ color: tag.color || '#1d4ed8' }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </CardContent>
                  )}

                  <CardContent className="p-4 space-y-3.5 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                        <p className="text-[10px] uppercase font-bold text-slate-500">
                          Estágio Comercial
                        </p>
                        <p className="mt-1 text-sm font-bold text-blue-900">
                          {accountData?.status ? accountData.status.toUpperCase() : 'NOVO PROSPECT'}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                        <p className="text-[10px] uppercase font-bold text-slate-500">
                          Responsável (Owner)
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {accountData?.owner_name || 'Vendedor Interno'}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-1.5">
                      <p className="font-bold text-blue-950 text-xs flex items-center gap-1.5">
                        <Zap className="h-4 w-4 text-blue-700" /> Próxima Melhor Ação (Next Best
                        Action):
                      </p>
                      <p className="text-[11px] text-blue-900 leading-relaxed font-medium">
                        {contacts.length === 0
                          ? 'Mapear o decisor comercial (CEO ou Diretor) para iniciar a abordagem B2B.'
                          : `Entrar em contato com ${contacts[0].first_name} ${contacts[0].last_name || ''} para apresentar o plano de verificação B2B.`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Buying Committee Tab */}
            <TabsContent value="committee" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Comitê de Compra (Buying Committee)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pessoas e decisores conhecidos na operação de vendas.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-blue-900 font-bold text-white text-xs hover:bg-blue-950"
                >
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Adicionar Decisor
                </Button>
              </div>

              {contacts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center space-y-2">
                  <Users className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-800">
                    Nenhum decisor cadastrado neste comitê
                  </p>
                  <p className="text-xs text-slate-500">
                    Adicione contatos como CEO, CFO ou Gerente de Vendas para gerenciar a abordagem.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {contacts.map((c) => (
                    <Card
                      key={c.id}
                      className="border-slate-200 bg-white shadow-2xs hover:border-blue-400 transition"
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {c.first_name} {c.last_name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {c.job_title || 'Cargo não especificado'}
                            </p>
                          </div>
                          {c.decision_role && (
                            <Badge className="border-0 bg-blue-900 font-semibold text-white text-[10px]">
                              {c.decision_role}
                            </Badge>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-600 border-t border-b border-slate-100 py-2 space-y-1">
                          {c.email && <p>E-mail: {c.email}</p>}
                          {c.phone && <p>Telefone: {c.phone}</p>}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          {c.whatsapp && (
                            <Button
                              size="sm"
                              onClick={() => {
                                const clean = c.whatsapp!.replace(/\D/g, '');
                                window.open(`https://wa.me/55${clean}`, '_blank');
                              }}
                              className="h-7 bg-emerald-600 hover:bg-emerald-700 font-bold text-white text-[11px] px-2.5"
                            >
                              <MessageSquare className="mr-1 h-3 w-3" /> WhatsApp
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Timeline Unificada de Atividades
                </h3>

                {activities.length === 0 ? (
                  <div className="py-8 text-center space-y-1">
                    <Activity className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">
                      Nenhuma atividade registrada ainda
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Registre chamadas, reuniões e notas para construir o histórico.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                    {activities.map((act) => (
                      <div key={act.id} className="relative flex items-start gap-4 pl-8">
                        <div className="absolute left-0 rounded-full bg-blue-900 p-1.5 text-white">
                          <Phone className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{act.subject}</p>
                          {act.body && <p className="text-xs text-slate-600 mt-0.5">{act.body}</p>}
                          <span className="text-[10px] text-slate-400">{act.occurred_at}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Opportunities Tab */}
            <TabsContent value="opportunities" className="mt-4">
              {opportunities.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center space-y-2">
                  <Target className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-800">
                    Nenhuma oportunidade aberta
                  </p>
                  <p className="text-xs text-slate-500">
                    Crie uma oportunidade de contratação ou upgrade de plano no Avalia Solar.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {opportunities.map((opp) => (
                    <div
                      key={opp.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{opp.name}</h4>
                        <p className="text-xs text-slate-500">
                          Probabilidade: {opp.probability ?? 50}%
                        </p>
                      </div>
                      <span className="text-base font-extrabold text-blue-950">
                        R${' '}
                        {((opp.value_cents ?? 0) / 100).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Marketplace Intelligence Tab */}
            <TabsContent value="intelligence" className="mt-4 space-y-4">
              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-2 text-xs">
                <h4 className="font-bold text-blue-950 text-sm flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-blue-700" /> Sinais Comerciais do Marketplace
                </h4>
                <p className="text-blue-900 leading-relaxed">
                  {marketplace
                    ? `A empresa está vinculada ao perfil #${marketplace.id} no portal. Utilize a nota de reputação pública e os comentários dos clientes como argumento na abordagem de vendas.`
                    : 'Esta conta ainda não possui vínculo com o cadastro do Marketplace Avalia Solar. Vincule o ID da empresa para sincronizar avaliações e leads orgânicos.'}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
