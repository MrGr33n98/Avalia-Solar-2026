'use client';

import { useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Award,
  BarChart2,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Flame,
  Globe,
  Layers,
  LayoutGrid,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SalesOutreachTemplates from '@/components/sales/SalesOutreachTemplates';
import SolarRoiCalculator from '@/components/sales/SolarRoiCalculator';

type ContactMember = {
  id: number;
  name: string;
  role: string;
  decisionRole: 'Decision Maker' | 'Champion' | 'Influencer' | 'Approver' | 'Gatekeeper';
  influence: 'Alta' | 'Média' | 'Baixa';
  sentiment: 'Positivo' | 'Neutro' | 'Negativo';
  email: string;
  phone: string;
  linkedin?: string;
  lastContact: string;
};

export default function Company360View({
  companyName = 'WEG Equipamentos Elétricos S/A',
  city = 'Jaraguá do Sul',
  state = 'SC',
  segment = 'Fabricante / Integrador',
}: {
  companyName?: string;
  city?: string;
  state?: string;
  segment?: string;
}) {
  const [activeTab, setActiveTab] = useState('overview');

  const committeeMembers: ContactMember[] = [
    {
      id: 1,
      name: 'Carlos Silva',
      role: 'CEO & Founder',
      decisionRole: 'Decision Maker',
      influence: 'Alta',
      sentiment: 'Positivo',
      email: 'carlos.silva@weg.net',
      phone: '(47) 99887-1122',
      linkedin: 'linkedin.com/in/carlossilva-weg',
      lastContact: 'Ontem, 15:30',
    },
    {
      id: 2,
      name: 'Marina Souza',
      role: 'Gerente de Marketing',
      decisionRole: 'Champion',
      influence: 'Média',
      sentiment: 'Positivo',
      email: 'marina.souza@weg.net',
      phone: '(47) 99123-4455',
      linkedin: 'linkedin.com/in/marinasouza',
      lastContact: 'Há 3 dias',
    },
    {
      id: 3,
      name: 'João Pedro',
      role: 'Diretor Financeiro (CFO)',
      decisionRole: 'Approver',
      influence: 'Alta',
      sentiment: 'Neutro',
      email: 'joao.pedro@weg.net',
      phone: '(47) 98844-5566',
      lastContact: 'Há 5 dias',
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-blue-900 hover:bg-blue-50">
          <Eye className="mr-1 h-3.5 w-3.5 text-blue-700" /> Ver Ficha 360°
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white border-slate-200 p-6">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="border-0 bg-blue-900 font-bold text-white">Company 360° Sales OS</Badge>
                <Badge variant="outline" className="border-slate-300 bg-slate-50 text-[11px] font-semibold text-slate-700">
                  {segment}
                </Badge>
                <Badge className="border-0 bg-emerald-100 font-bold text-emerald-800 text-[11px]">
                  Trust Score: 92/100
                </Badge>
              </div>
              <DialogTitle className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {companyName}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" /> {city}, {state} · 
                <Globe className="h-3.5 w-3.5 text-slate-400 ml-1" /> weg.net · 
                <Building2 className="h-3.5 w-3.5 text-slate-400 ml-1" /> CNPJ: 84.429.695/0001-11
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              <SolarRoiCalculator companyName={companyName} />
              <SalesOutreachTemplates companyName={companyName} city={city} />
            </div>
          </div>
        </DialogHeader>

        {/* 360 Degree Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4 w-full">
          <TabsList className="grid w-full grid-cols-5 bg-slate-100 p-1 text-xs">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:font-bold">
              Visão Geral 360°
            </TabsTrigger>
            <TabsTrigger value="committee" className="data-[state=active]:bg-white data-[state=active]:font-bold">
              Comitê de Compra ({committeeMembers.length})
            </TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-white data-[state=active]:font-bold">
              Timeline Unificada
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="data-[state=active]:bg-white data-[state=active]:font-bold">
              Oportunidades (1)
            </TabsTrigger>
            <TabsTrigger value="intelligence" className="data-[state=active]:bg-white data-[state=active]:font-bold">
              Inteligência Marketplace
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
                  <Badge variant="outline" className="border-blue-300 bg-white font-bold text-blue-900 text-[10px]">
                    Perfil Público Ativo
                  </Badge>
                </CardHeader>
                <CardContent className="p-4 space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-white p-3 border border-slate-200">
                      <p className="text-[10px] uppercase font-bold text-slate-500">Reputação / Rating</p>
                      <p className="mt-1 text-base font-extrabold text-amber-600 flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-500 text-amber-500" /> 4.8 ★
                        <span className="text-xs font-medium text-slate-500">(38 avaliações)</span>
                      </p>
                    </div>

                    <div className="rounded-lg bg-white p-3 border border-slate-200">
                      <p className="text-[10px] uppercase font-bold text-slate-500">Leads Recebidos (30d)</p>
                      <p className="mt-1 text-base font-extrabold text-blue-950 flex items-center gap-1">
                        <Users className="h-4 w-4 text-blue-700" /> 8 Oportunidades B2C
                      </p>
                    </div>

                    <div className="rounded-lg bg-white p-3 border border-slate-200">
                      <p className="text-[10px] uppercase font-bold text-slate-500">Visualizações de Perfil</p>
                      <p className="mt-1 text-base font-extrabold text-slate-900 flex items-center gap-1">
                        <Eye className="h-4 w-4 text-slate-600" /> 431 acessos
                      </p>
                    </div>

                    <div className="rounded-lg bg-white p-3 border border-slate-200">
                      <p className="text-[10px] uppercase font-bold text-slate-500">Plano Atual</p>
                      <p className="mt-1 text-base font-extrabold text-slate-700 flex items-center gap-1">
                        Plano Gratuito (Free)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                      <span>Completude do Perfil Público:</span>
                      <span className="text-blue-900 font-bold">90%</span>
                    </div>
                    <Progress value={90} className="h-2 bg-slate-200" />
                  </div>

                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-amber-950 space-y-1">
                    <p className="font-bold flex items-center gap-1 text-xs">
                      <Flame className="h-4 w-4 text-amber-600" /> Sinal de Venda Detectado (Hot Prospect):
                    </p>
                    <p className="text-[11px] text-amber-900 leading-relaxed">
                      A WEG recebe demanda orgânica no marketplace mas ainda utiliza plano Gratuito. Alto potencial para fechamento do plano <strong>PRO Anual</strong>.
                    </p>
                  </div>
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
                  <Badge className="border-0 bg-emerald-600 font-bold text-white text-[10px]">
                    Sales Score 92/100
                  </Badge>
                </CardHeader>

                <CardContent className="p-4 space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                      <p className="text-[10px] uppercase font-bold text-slate-500">Estágio Comercial</p>
                      <p className="mt-1 text-sm font-bold text-blue-900">3. Qualificado B2B</p>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                      <p className="text-[10px] uppercase font-bold text-slate-500">Responsável (Owner)</p>
                      <p className="mt-1 text-sm font-bold text-slate-900">Founder Comercial</p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-1.5">
                    <p className="font-bold text-blue-950 text-xs flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-blue-700" /> Próxima Melhor Ação (Next Best Action):
                    </p>
                    <p className="text-[11px] text-blue-900 leading-relaxed font-medium">
                      Apresentar proposta de <strong>Usina Usufruída 150kWp</strong> destacando a economia mensal de R$ 3.150 e o histórico de 38 avaliações positivas no portal.
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">Decisor Principal:</span>
                      <span className="font-semibold text-blue-900">Carlos Silva (CEO)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-1.5">
                      <span className="font-semibold text-slate-600">Última Interação:</span>
                      <span className="text-slate-500">Ontem às 15:30 (Ligação)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Buying Committee Tab */}
          <TabsContent value="committee" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Comitê de Compra (Buying Committee)</h3>
                <p className="text-xs text-slate-500">
                  Mapeamento dos decisores, influenciadores e aprovadores financeiros da empresa.
                </p>
              </div>
              <Button size="sm" className="bg-blue-900 font-bold text-white text-xs hover:bg-blue-950">
                <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Adicionar Decisor
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {committeeMembers.map((member) => (
                <Card key={member.id} className="border-slate-200 bg-white shadow-2xs hover:border-blue-400 transition">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.role}</p>
                      </div>
                      <Badge className="border-0 bg-blue-900 font-semibold text-white text-[10px]">
                        {member.decisionRole}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-b border-slate-100 py-2">
                      <div>
                        <span className="text-slate-500">Influência:</span>{' '}
                        <strong className="text-slate-900">{member.influence}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Sentimento:</span>{' '}
                        <strong className="text-emerald-700">{member.sentiment}</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-400 text-[11px]">Contato: {member.lastContact}</span>
                      <Button
                        size="sm"
                        onClick={() => {
                          const clean = member.phone.replace(/\D/g, '');
                          window.open(`https://wa.me/55${clean}`, '_blank');
                        }}
                        className="h-7 bg-emerald-600 hover:bg-emerald-700 font-bold text-white text-[11px] px-2.5"
                      >
                        <MessageSquare className="mr-1 h-3 w-3" /> Whats
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="mt-4 space-y-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Timeline Unificada de Atividades</h3>

              <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                <div className="relative flex items-start gap-4 pl-8">
                  <div className="absolute left-0 rounded-full bg-blue-900 p-1.5 text-white">
                    <Phone className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">☎ Chamada Realizada com Carlos Silva (CEO)</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Duração: 04:32 · Apresentado diagnóstico inicial. Demonstrou forte interesse no payback em 3.4 anos.
                    </p>
                    <span className="text-[10px] text-slate-400">Ontem às 15:30</span>
                  </div>
                </div>

                <div className="relative flex items-start gap-4 pl-8">
                  <div className="absolute left-0 rounded-full bg-emerald-600 p-1.5 text-white">
                    <MessageSquare className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">WhatsApp Enviado para Marina Souza (Marketing)</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Script de follow-up com dados de demanda do marketplace.
                    </p>
                    <span className="text-[10px] text-slate-400">Há 3 dias</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Opportunities Tab */}
          <TabsContent value="opportunities" className="mt-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Projeto B2B 150kWp — WEG</h4>
                  <p className="text-xs text-slate-500">Estágio: 3. Qualificado B2B · Probabilidade: 60%</p>
                </div>
                <span className="text-base font-extrabold text-blue-950">R$ 450.000</span>
              </div>
            </div>
          </TabsContent>

          {/* Marketplace Tab */}
          <TabsContent value="intelligence" className="mt-4 space-y-4">
            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-2 text-xs">
              <h4 className="font-bold text-blue-950 text-sm flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-blue-700" /> Oportunidades Recomendadas pelo Algoritmo
              </h4>
              <p className="text-blue-900 leading-relaxed">
                A empresa possui excelente reputação (4.8★) e alto volume de acessos. O momento é ideal para oferecer o plano <strong>Selo Verificado + Soluções PRO</strong> para converter mais demandas da região de Jaraguá do Sul.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
