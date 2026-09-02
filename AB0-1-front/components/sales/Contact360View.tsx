'use client';

import { useCallback, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Globe,
  Linkedin,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  PhoneCall,
  Plus,
  RotateCw,
  ShieldCheck,
  Sparkles,
  User,
  UserCheck,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { buildWhatsAppUrl } from '@/lib/phone';
import CallLoggerModal from '@/components/sales/CallLoggerModal';

type Contact360Data = {
  id: number;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  job_title?: string;
  linkedin_url?: string;
  decision_role?: string;
  is_primary?: boolean;
  account?: {
    id: number;
    name: string;
    city?: string;
    state?: string;
  } | null;
  employments?: Array<{
    id: number;
    sales_account_id: number;
    account_name?: string;
    job_title?: string;
    department?: string;
    seniority?: string;
    relationship_type: string;
    is_current: boolean;
    is_primary: boolean;
  }>;
  buying_opportunities?: Array<{
    id: number;
    opportunity_id: number;
    opportunity_name?: string;
    role: string;
    influence: string;
    support_level: string;
    is_primary: boolean;
  }>;
  activities?: Array<{
    id: number;
    activity_type: string;
    subject: string;
    occurred_at: string;
  }>;
  tasks?: Array<{
    id: number;
    title: string;
    due_at?: string;
    completed_at?: string;
  }>;
};

export default function Contact360View({
  contactId,
  contactName = 'Contato Comercial',
  jobTitle = 'Decisor Comercial',
  accountName = 'Empresa Prospect',
}: {
  contactId?: number;
  contactName?: string;
  jobTitle?: string;
  accountName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactData, setContactData] = useState<Contact360Data | null>(null);

  const fetchContactDetails = useCallback(() => {
    if (!contactId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/v1/sales/contacts/${contactId}`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Não foi possível carregar os detalhes do contato.');
        return res.json();
      })
      .then((data) => {
        if (data?.contact) {
          setContactData(data.contact);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Erro ao buscar dados.');
      })
      .finally(() => setLoading(false));
  }, [contactId]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && contactId && !contactData) {
      fetchContactDetails();
    }
  };

  const name = contactData ? [contactData.first_name, contactData.last_name].filter(Boolean).join(' ') : contactName;
  const title = contactData?.job_title || jobTitle;
  const company = contactData?.account?.name || accountName;
  const email = contactData?.email;
  const phone = contactData?.phone;
  const whatsapp = contactData?.whatsapp || phone;
  const linkedin = contactData?.linkedin_url;
  const role = contactData?.decision_role || 'Decision Maker';
  const employments = contactData?.employments ?? [];
  const buyingOpps = contactData?.buying_opportunities ?? [];
  const activities = contactData?.activities ?? [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-blue-900 hover:bg-blue-50">
          <User className="mr-1 h-3.5 w-3.5 text-blue-700" /> Perfil 360°
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-slate-200 p-6">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="border-0 bg-blue-900 font-bold text-white">People Graph 360°</Badge>
                <Badge variant="outline" className="border-slate-300 bg-slate-50 text-[11px] font-semibold text-slate-700">
                  {role}
                </Badge>
              </div>
              <DialogTitle className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {name}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <Briefcase className="h-3.5 w-3.5 text-slate-400" /> {title} na <strong className="text-slate-700">{company}</strong>
              </DialogDescription>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center gap-2">
              <CallLoggerModal
                contactId={contactId}
                contactName={name}
                phone={phone || whatsapp}
                onSuccess={fetchContactDetails}
              />
              {whatsapp && (
                <Button
                  size="sm"
                  onClick={() => window.open(buildWhatsAppUrl(whatsapp, `Olá ${contactData?.first_name || ''}, tudo bem?`), '_blank')}
                  className="h-8 bg-emerald-600 hover:bg-emerald-700 font-bold text-white text-xs shadow-xs"
                >
                  <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> WhatsApp
                </Button>
              )}
              {email && (
                <Button
                  size="sm"
                  onClick={() => window.open(`mailto:${email}`, '_self')}
                  variant="outline"
                  className="h-8 border-slate-300 bg-white font-semibold text-slate-800 text-xs shadow-xs hover:bg-slate-50"
                >
                  <Mail className="mr-1.5 h-3.5 w-3.5 text-slate-600" /> E-mail
                </Button>
              )}
              {linkedin && (
                <Button
                  size="sm"
                  onClick={() => window.open(linkedin.startsWith('http') ? linkedin : `https://${linkedin}`, '_blank')}
                  variant="outline"
                  className="h-8 border-slate-300 bg-white font-semibold text-blue-800 text-xs shadow-xs hover:bg-blue-50"
                >
                  <Linkedin className="mr-1.5 h-3.5 w-3.5 text-blue-700" /> LinkedIn
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RotateCw className="mx-auto h-8 w-8 animate-spin text-blue-900" />
            <p className="text-sm font-semibold text-slate-600">Carregando dados da pessoa...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center space-y-3">
            <AlertCircle className="mx-auto h-8 w-8 text-red-600" />
            <p className="text-sm font-semibold text-slate-900">{error}</p>
            <Button onClick={fetchContactDetails} variant="outline" size="sm" className="font-semibold">
              <RotateCw className="mr-1.5 h-3.5 w-3.5" /> Tentar Novamente
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4 w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1 text-xs">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:font-bold">
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="employments" className="data-[state=active]:bg-white data-[state=active]:font-bold">
                Relações Profissionais ({employments.length})
              </TabsTrigger>
              <TabsTrigger value="committee" className="data-[state=active]:bg-white data-[state=active]:font-bold">
                Comitê de Compra ({buyingOpps.length})
              </TabsTrigger>
              <TabsTrigger value="timeline" className="data-[state=active]:bg-white data-[state=active]:font-bold">
                Timeline ({activities.length})
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <Card className="border-slate-200 bg-white">
                  <CardHeader className="p-4 border-b border-slate-100">
                    <CardTitle className="text-sm font-bold text-slate-900">Pontos de Contato</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500 font-semibold">E-mail:</span>
                      <strong className="text-slate-900">{email || '—'}</strong>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500 font-semibold">Telefone:</span>
                      <strong className="text-slate-900">{phone || '—'}</strong>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500 font-semibold">WhatsApp:</span>
                      <strong className="text-emerald-700">{whatsapp || '—'}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold">LinkedIn:</span>
                      <strong className="text-blue-900 truncate max-w-[200px]">{linkedin || '—'}</strong>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 bg-white">
                  <CardHeader className="p-4 border-b border-slate-100">
                    <CardTitle className="text-sm font-bold text-slate-900">Papel Comercial no CRM</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500 font-semibold">Papel de Decisão:</span>
                      <Badge className="border-0 bg-blue-900 font-bold text-white text-[10px]">{role}</Badge>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500 font-semibold">Empresa Principal:</span>
                      <strong className="text-slate-900">{company}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold">Contato Principal da Conta:</span>
                      <strong className="text-slate-900">{contactData?.is_primary ? 'Sim' : 'Não'}</strong>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Employments Graph Tab */}
            <TabsContent value="employments" className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Histórico & Relações de Trabalho (People Graph)</h3>

                {employments.length === 0 ? (
                  <div className="py-6 text-center space-y-1 text-xs">
                    <Building2 className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="font-semibold text-slate-700">Apenas o vínculo atual com {company}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {employments.map((e) => (
                      <div key={e.id} className="rounded-lg border border-slate-200 p-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{e.account_name || company}</p>
                          <p className="text-slate-500">{e.job_title || title} · Relação: {e.relationship_type}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {e.is_primary && (
                            <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-900 text-[10px] font-bold">
                              Empresa Principal
                            </Badge>
                          )}
                          {e.is_current ? (
                            <Badge className="border-0 bg-emerald-600 font-bold text-white text-[10px]">Ativo</Badge>
                          ) : (
                            <Badge variant="outline" className="border-slate-300 text-slate-500 text-[10px]">Anterior</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Buying Committee Roles Tab */}
            <TabsContent value="committee" className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Participação em Comitês de Compra</h3>

                {buyingOpps.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    Nenhum vínculo ativo com oportunidades comerciais no pipeline.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {buyingOpps.map((bo) => (
                      <div key={bo.id} className="rounded-lg border border-slate-200 p-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{bo.opportunity_name || 'Oportunidade B2B'}</p>
                          <p className="text-slate-500">Papel: <strong className="text-blue-900">{bo.role}</strong> · Influência: {bo.influence}</p>
                        </div>
                        <Badge className="border-0 bg-emerald-600 font-bold text-white text-[10px]">
                          Suporte: {bo.support_level}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Interações Pessoais Registradas</h3>

                {activities.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    Nenhuma atividade registrada para este contato. Use a ação &quot;Registrar Chamada&quot; para iniciar o histórico.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activities.map((a) => (
                      <div key={a.id} className="border-b border-slate-100 pb-2 text-xs">
                        <p className="font-bold text-slate-900">{a.subject}</p>
                        <span className="text-[10px] text-slate-400">{a.occurred_at}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
