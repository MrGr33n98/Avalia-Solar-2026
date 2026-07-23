'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Phone,
  MessageSquare,
  Mail,
  Clock,
  Shield,
  Wrench,
  Eye,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Zap,
  MousePointer2,
  HeadphonesIcon,
  Star,
  ChevronDown,
  Info,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { fetchApi } from '@/lib/api';
import MetricCard from './MetricCard';

interface SupportTrainingDashboardProps {
  companyId: string;
  company?: any;
  stats?: any;
}

interface SupportFormData {
  phone: string;
  phone_alt: string;
  whatsapp: string;
  whatsapp_enabled: boolean;
  cta_whatsapp_template: string;
  email_public: string;
  working_hours: string;
  response_time_sla: string;
  response_sla_minutes: number | null;
  post_sales_support: boolean;
  post_sales_capacity: string[];
  installation_warranty_years: number | null;
  warranty_years: number | null;
}

const SLA_OPTIONS = [
  { value: '30', label: 'Até 30 minutos', slaLabel: '30min' },
  { value: '60', label: 'Até 1 hora', slaLabel: '1h' },
  { value: '120', label: 'Até 2 horas', slaLabel: '2h' },
  { value: '240', label: 'Até 4 horas', slaLabel: '4h' },
  { value: '480', label: 'Até 8 horas (1 dia útil)', slaLabel: '8h' },
  { value: '1440', label: 'Até 24 horas', slaLabel: '24h' },
  { value: '2880', label: 'Até 48 horas', slaLabel: '48h' },
];

const POST_SALES_CAPABILITIES = [
  { key: 'monitoring', label: 'Monitoramento remoto', icon: '📡' },
  { key: 'preventive_maintenance', label: 'Manutenção preventiva', icon: '🔧' },
  { key: 'corrective_maintenance', label: 'Manutenção corretiva', icon: '⚡' },
  { key: 'cleaning', label: 'Limpeza de painéis', icon: '🧹' },
  { key: 'inverter_replacement', label: 'Troca de inversores', icon: '🔄' },
  { key: 'expansion', label: 'Ampliação do sistema', icon: '📈' },
  { key: 'insurance_support', label: 'Suporte a seguros', icon: '🛡️' },
  { key: 'performance_reports', label: 'Relatórios de performance', icon: '📊' },
];

const WORKING_HOURS_PRESETS = [
  { value: 'seg-sex-8-18', label: 'Seg a Sex, 8h às 18h' },
  { value: 'seg-sex-9-18', label: 'Seg a Sex, 9h às 18h' },
  { value: 'seg-sab-8-17', label: 'Seg a Sáb, 8h às 17h' },
  { value: 'seg-sab-8-12', label: 'Seg a Sáb, 8h às 12h (meio período)' },
  { value: 'custom', label: 'Horário personalizado' },
];

function getWorkingHoursPreset(value: string): string {
  const match = WORKING_HOURS_PRESETS.find((p) => p.value === value);
  if (match) return match.value;
  if (!value) return '';
  return 'custom';
}

export default function SupportTrainingDashboard({
  companyId,
  company,
  stats,
}: SupportTrainingDashboardProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Form state initialized from company data
  const [form, setForm] = useState<SupportFormData>({
    phone: '',
    phone_alt: '',
    whatsapp: '',
    whatsapp_enabled: false,
    cta_whatsapp_template: '',
    email_public: '',
    working_hours: '',
    response_time_sla: '',
    response_sla_minutes: null,
    post_sales_support: false,
    post_sales_capacity: [],
    installation_warranty_years: null,
    warranty_years: null,
  });

  const [workingHoursPreset, setWorkingHoursPreset] = useState('');

  // Initialize form from company data
  useEffect(() => {
    if (!company) return;
    const newForm: SupportFormData = {
      phone: company.phone || '',
      phone_alt: company.phone_alt || '',
      whatsapp: company.whatsapp || '',
      whatsapp_enabled: company.whatsapp_enabled || company.cta_whatsapp_enabled || false,
      cta_whatsapp_template: company.cta_whatsapp_template || '',
      email_public: company.email_public || '',
      working_hours: company.working_hours || '',
      response_time_sla: company.response_time_sla || '',
      response_sla_minutes: company.response_sla_minutes || null,
      post_sales_support: company.post_sales_support || false,
      post_sales_capacity: Array.isArray(company.post_sales_capacity) ? company.post_sales_capacity : [],
      installation_warranty_years: company.installation_warranty_years || null,
      warranty_years: company.warranty_years || null,
    };
    setForm(newForm);
    setWorkingHoursPreset(getWorkingHoursPreset(newForm.working_hours));
  }, [company]);

  // Fetch real analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setAnalyticsLoading(true);
        const data = await fetchApi<any>('/company_dashboard/analytics/overview', {
          params: { company_id: companyId },
        });
        setAnalytics(data);
      } catch (err) {
        console.error('[SupportDashboard] Error fetching analytics:', err);
      } finally {
        setAnalyticsLoading(false);
      }
    };
    fetchAnalytics();
  }, [companyId]);

  // Completeness calculation
  const completeness = useMemo(() => {
    const checks = [
      { label: 'Telefone', done: !!form.phone },
      { label: 'WhatsApp', done: !!form.whatsapp && form.whatsapp_enabled },
      { label: 'Email público', done: !!form.email_public },
      { label: 'Horário comercial', done: !!form.working_hours },
      { label: 'SLA de resposta', done: !!form.response_sla_minutes },
      { label: 'Suporte pós-venda', done: form.post_sales_support },
      { label: 'Garantia definida', done: !!form.installation_warranty_years || !!form.warranty_years },
      { label: 'Mensagem WhatsApp', done: !!form.cta_whatsapp_template },
    ];
    const doneCount = checks.filter((c) => c.done).length;
    return {
      checks,
      total: checks.length,
      done: doneCount,
      percent: Math.round((doneCount / checks.length) * 100),
    };
  }, [form]);

  // Metric values from real analytics
  const whatsappClicks30d = analytics?.whatsapp_clicks_30d ?? stats?.whatsappClicks ?? 0;
  const ctaClicks30d = analytics?.cta_clicks_30d ?? stats?.ctaClicks ?? 0;
  const profileViews30d = analytics?.views_30d ?? stats?.profileViews ?? 0;

  const updateField = useCallback(
    <K extends keyof SupportFormData>(key: K, value: SupportFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setSaveStatus('idle');
    },
    []
  );

  const togglePostSalesCapability = useCallback((key: string) => {
    setForm((prev) => ({
      ...prev,
      post_sales_capacity: prev.post_sales_capacity.includes(key)
        ? prev.post_sales_capacity.filter((k) => k !== key)
        : [...prev.post_sales_capacity, key],
    }));
    setSaveStatus('idle');
  }, []);

  // Save handler
  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');
    try {
      const payload = {
        company_id: companyId,
        company: {
          phone: form.phone,
          phone_alt: form.phone_alt,
          whatsapp: form.whatsapp,
          whatsapp_enabled: form.whatsapp_enabled,
          cta_whatsapp_enabled: form.whatsapp_enabled,
          cta_whatsapp_template: form.cta_whatsapp_template,
          email_public: form.email_public,
          working_hours: form.working_hours,
          response_time_sla: form.response_time_sla,
          response_sla_minutes: form.response_sla_minutes,
          post_sales_support: form.post_sales_support,
          post_sales_capacity: form.post_sales_capacity,
          installation_warranty_years: form.installation_warranty_years,
          warranty_years: form.warranty_years,
        },
      };

      await fetchApi('/company_dashboard/update_info', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSaveStatus('success');
      toast({
        title: 'Configurações salvas',
        description: 'Suas alterações de suporte foram enviadas para aprovação.',
      });

      setTimeout(() => setSaveStatus('idle'), 4000);
    } catch (err) {
      console.error('[SupportDashboard] Save error:', err);
      setSaveStatus('error');
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-8">
        {/* ═══════════════════════════════ HEADER ═══════════════════════════════ */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary mb-1">
              <HeadphonesIcon className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Canais e Atendimento
              </span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 leading-none">
              Suporte e <span className="text-primary">Treinamento</span>
            </h2>
            <p className="text-sm text-slate-500 max-w-lg font-medium leading-relaxed">
              Configure seus canais de atendimento, horários e garantias. Tudo que você configurar aqui aparece no seu perfil público.
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className={`h-12 px-8 rounded-xl font-bold text-sm shadow-lg transition-all active:scale-95 ${
              saveStatus === 'success'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : saveStatus === 'error'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-primary hover:bg-primary/90'
            } text-white`}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : saveStatus === 'success' ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Salvo com sucesso
              </>
            ) : saveStatus === 'error' ? (
              <>
                <AlertCircle className="h-4 w-4 mr-2" />
                Erro — tentar novamente
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>

        {/* ═══════════════════════ METRICS (REAL DATA) ═══════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Cliques WhatsApp"
            value={analyticsLoading ? '...' : whatsappClicks30d}
            icon={MessageSquare}
            description="Últimos 30 dias"
            color="green"
          />
          <MetricCard
            title="Cliques CTA"
            value={analyticsLoading ? '...' : ctaClicks30d}
            icon={MousePointer2}
            description="Últimos 30 dias"
            color="blue"
          />
          <MetricCard
            title="Visualizações"
            value={analyticsLoading ? '...' : profileViews30d}
            icon={Eye}
            description="Perfil visto nos últimos 30 dias"
            color="purple"
          />
          <MetricCard
            title="Completude do Suporte"
            value={`${completeness.percent}%`}
            icon={Shield}
            description={`${completeness.done} de ${completeness.total} itens configurados`}
            color={completeness.percent >= 80 ? 'green' : completeness.percent >= 50 ? 'yellow' : 'pink'}
          />
        </div>

        {/* ═══════════════════ COMPLETENESS BAR ═══════════════════ */}
        {completeness.percent < 100 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-md bg-amber-100">
                    <TrendingUp className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-900 mb-2">
                      Complete seu perfil de suporte para atrair mais clientes
                    </p>
                    <div className="w-full bg-amber-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-amber-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${completeness.percent}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {completeness.checks
                        .filter((c) => !c.done)
                        .map((c) => (
                          <Badge key={c.label} variant="outline" className="text-[10px] border-amber-300 text-amber-700 bg-white">
                            {c.label}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ═══════════════════ LEFT COLUMN — FORMS ═══════════════════ */}
          <div className="lg:col-span-8 space-y-8">
            {/* ── CANAIS DE ATENDIMENTO ── */}
            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardHeader className="pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-bold text-slate-900">Canais de Atendimento</CardTitle>
                </div>
                <CardDescription className="text-slate-500">
                  Configure os canais pelos quais seus clientes podem entrar em contato.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* WhatsApp Section */}
                <div className="space-y-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-emerald-600" />
                      <Label className="text-sm font-bold text-emerald-900">WhatsApp</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3.5 w-3.5 text-slate-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-xs">
                            Empresas com WhatsApp ativo recebem em média 3x mais contatos
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={form.whatsapp_enabled}
                      onCheckedChange={(v) => updateField('whatsapp_enabled', v)}
                    />
                  </div>

                  {form.whatsapp_enabled && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-slate-600">Número com DDD</Label>
                        <Input
                          value={form.whatsapp}
                          onChange={(e) => updateField('whatsapp', e.target.value)}
                          placeholder="+55 48 99999-9999"
                          className="h-11 rounded-lg border-slate-200"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-slate-600">Mensagem padrão</Label>
                        <Textarea
                          value={form.cta_whatsapp_template}
                          onChange={(e) => updateField('cta_whatsapp_template', e.target.value)}
                          placeholder="Olá! Tenho interesse em soluções de energia solar. Podem me ajudar?"
                          rows={3}
                          className="rounded-lg border-slate-200 resize-none text-sm"
                        />
                        <p className="text-[10px] text-slate-400">
                          {(form.cta_whatsapp_template || '').length}/160 caracteres
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-600">Telefone principal</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        value={form.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        placeholder="(48) 3333-4444"
                        className="h-11 pl-10 rounded-lg border-slate-200"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-600">Telefone alternativo</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        value={form.phone_alt}
                        onChange={(e) => updateField('phone_alt', e.target.value)}
                        placeholder="(48) 3333-5555"
                        className="h-11 pl-10 rounded-lg border-slate-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Email público de contato</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      value={form.email_public}
                      onChange={(e) => updateField('email_public', e.target.value)}
                      placeholder="contato@suaempresa.com.br"
                      className="h-11 pl-10 rounded-lg border-slate-200"
                      type="email"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── HORÁRIO E SLA ── */}
            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardHeader className="pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-bold text-slate-900">Horário e Tempo de Resposta</CardTitle>
                </div>
                <CardDescription className="text-slate-500">
                  Defina quando sua equipe atende e o SLA de primeira resposta. Essas informações aparecem no seu perfil público.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Horário comercial</Label>
                  <Select
                    value={workingHoursPreset}
                    onValueChange={(v) => {
                      setWorkingHoursPreset(v);
                      if (v !== 'custom') {
                        const preset = WORKING_HOURS_PRESETS.find((p) => p.value === v);
                        updateField('working_hours', preset?.label || v);
                      }
                    }}
                  >
                    <SelectTrigger className="h-11 rounded-lg border-slate-200">
                      <SelectValue placeholder="Selecione seu horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {WORKING_HOURS_PRESETS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {workingHoursPreset === 'custom' && (
                    <Input
                      value={form.working_hours}
                      onChange={(e) => updateField('working_hours', e.target.value)}
                      placeholder="Ex: Seg a Sex, 8h às 18h / Sáb, 8h às 12h"
                      className="h-11 mt-2 rounded-lg border-slate-200"
                    />
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-medium text-slate-600">SLA de primeira resposta</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">
                          O SLA é exibido publicamente no seu perfil. Empresas com SLA menor que 2h aparecem com destaque no ranking.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select
                    value={form.response_sla_minutes?.toString() || ''}
                    onValueChange={(v) => {
                      const minutes = parseInt(v, 10);
                      const opt = SLA_OPTIONS.find((o) => o.value === v);
                      updateField('response_sla_minutes', minutes);
                      updateField('response_time_sla', opt?.slaLabel || `${minutes}min`);
                    }}
                  >
                    <SelectTrigger className="h-11 rounded-lg border-slate-200">
                      <SelectValue placeholder="Selecione o tempo máximo de primeira resposta" />
                    </SelectTrigger>
                    <SelectContent>
                      {SLA_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.response_sla_minutes && form.response_sla_minutes <= 120 && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3" />
                      Excelente! Respostas rápidas aumentam a confiança do cliente.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ── PÓS-VENDA E GARANTIAS ── */}
            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardHeader className="pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-bold text-slate-900">Pós-Venda e Garantias</CardTitle>
                </div>
                <CardDescription className="text-slate-500">
                  Informe ao cliente o que ele pode esperar depois da instalação. Empresas com pós-venda ativo recebem mais avaliações positivas.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Post-sales toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-slate-900">Suporte pós-venda ativo</Label>
                    <p className="text-xs text-slate-500">Mostrar no perfil que você oferece suporte após a instalação</p>
                  </div>
                  <Switch
                    checked={form.post_sales_support}
                    onCheckedChange={(v) => updateField('post_sales_support', v)}
                  />
                </div>

                {/* Capabilities */}
                {form.post_sales_support && (
                  <div className="space-y-3">
                    <Label className="text-xs font-medium text-slate-600">Capacidades de pós-venda</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {POST_SALES_CAPABILITIES.map((cap) => {
                        const isSelected = form.post_sales_capacity.includes(cap.key);
                        return (
                          <button
                            key={cap.key}
                            onClick={() => togglePostSalesCapability(cap.key)}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left text-sm transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/5 text-primary font-medium'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <span className="text-base">{cap.icon}</span>
                            <span>{cap.label}</span>
                            {isSelected && <CheckCircle2 className="h-3.5 w-3.5 ml-auto text-primary" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Warranties */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-600">Garantia de instalação (anos)</Label>
                    <Select
                      value={form.installation_warranty_years?.toString() || ''}
                      onValueChange={(v) => updateField('installation_warranty_years', parseInt(v, 10))}
                    >
                      <SelectTrigger className="h-11 rounded-lg border-slate-200">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 5, 7, 10, 15, 20, 25].map((y) => (
                          <SelectItem key={y} value={y.toString()}>
                            {y} {y === 1 ? 'ano' : 'anos'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-600">Garantia geral (anos)</Label>
                    <Select
                      value={form.warranty_years?.toString() || ''}
                      onValueChange={(v) => updateField('warranty_years', parseInt(v, 10))}
                    >
                      <SelectTrigger className="h-11 rounded-lg border-slate-200">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 5, 7, 10, 15, 20, 25].map((y) => (
                          <SelectItem key={y} value={y.toString()}>
                            {y} {y === 1 ? 'ano' : 'anos'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ═══════════════════ RIGHT COLUMN — PREVIEW + TIPS ═══════════════════ */}
          <div className="lg:col-span-4 space-y-6">
            {/* ── PUBLIC PROFILE PREVIEW ── */}
            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm sticky top-6">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-slate-500" />
                  <CardTitle className="text-sm font-bold text-slate-700">Preview do Perfil Público</CardTitle>
                </div>
                <CardDescription className="text-xs text-slate-500">
                  Como o visitante vê suas informações de suporte
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                  {/* Company mini header */}
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <HeadphonesIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{company?.name || 'Sua Empresa'}</p>
                      <p className="text-[10px] text-slate-500">Informações de Suporte</p>
                    </div>
                  </div>

                  {/* Preview items */}
                  <div className="space-y-2.5">
                    {form.whatsapp_enabled && form.whatsapp ? (
                      <PreviewItem
                        icon={<MessageSquare className="h-3.5 w-3.5 text-emerald-600" />}
                        label="WhatsApp"
                        value={form.whatsapp}
                        highlight
                      />
                    ) : (
                      <PreviewItem
                        icon={<MessageSquare className="h-3.5 w-3.5 text-slate-300" />}
                        label="WhatsApp"
                        value="Não configurado"
                        muted
                      />
                    )}

                    {form.phone ? (
                      <PreviewItem
                        icon={<Phone className="h-3.5 w-3.5 text-blue-600" />}
                        label="Telefone"
                        value={form.phone}
                      />
                    ) : (
                      <PreviewItem
                        icon={<Phone className="h-3.5 w-3.5 text-slate-300" />}
                        label="Telefone"
                        value="Não informado"
                        muted
                      />
                    )}

                    {form.email_public ? (
                      <PreviewItem
                        icon={<Mail className="h-3.5 w-3.5 text-blue-600" />}
                        label="Email"
                        value={form.email_public}
                      />
                    ) : (
                      <PreviewItem
                        icon={<Mail className="h-3.5 w-3.5 text-slate-300" />}
                        label="Email"
                        value="Não informado"
                        muted
                      />
                    )}

                    {form.working_hours ? (
                      <PreviewItem
                        icon={<Clock className="h-3.5 w-3.5 text-blue-600" />}
                        label="Horário"
                        value={form.working_hours}
                      />
                    ) : (
                      <PreviewItem
                        icon={<Clock className="h-3.5 w-3.5 text-slate-300" />}
                        label="Horário"
                        value="Não definido"
                        muted
                      />
                    )}

                    {form.response_sla_minutes ? (
                      <PreviewItem
                        icon={<Zap className="h-3.5 w-3.5 text-amber-500" />}
                        label="Resposta em"
                        value={form.response_time_sla || `${form.response_sla_minutes}min`}
                      />
                    ) : (
                      <PreviewItem
                        icon={<Zap className="h-3.5 w-3.5 text-slate-300" />}
                        label="SLA"
                        value="Não definido"
                        muted
                      />
                    )}

                    <PreviewItem
                      icon={<Shield className="h-3.5 w-3.5 text-blue-600" />}
                      label="Pós-venda"
                      value={form.post_sales_support ? 'Disponível' : 'Não informado'}
                      muted={!form.post_sales_support}
                    />

                    {(form.installation_warranty_years || form.warranty_years) && (
                      <PreviewItem
                        icon={<Star className="h-3.5 w-3.5 text-amber-500" />}
                        label="Garantia"
                        value={`${form.installation_warranty_years || form.warranty_years} anos`}
                      />
                    )}
                  </div>

                  {/* Post-sales capabilities */}
                  {form.post_sales_support && form.post_sales_capacity.length > 0 && (
                    <div className="pt-2 border-t border-slate-200">
                      <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2">Serviços pós-venda</p>
                      <div className="flex flex-wrap gap-1.5">
                        {form.post_sales_capacity.map((key) => {
                          const cap = POST_SALES_CAPABILITIES.find((c) => c.key === key);
                          return (
                            <Badge key={key} variant="outline" className="text-[10px] border-slate-200 text-slate-600 bg-white">
                              {cap?.icon} {cap?.label || key}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {company?.slug && (
                  <a
                    href={`/empresas/${company.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 mt-3 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Ver página pública
                  </a>
                )}
              </CardContent>
            </Card>

            {/* ── TIPS CARD ── */}
            <Card className="rounded-2xl border-blue-100 bg-blue-50/50">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-bold text-blue-900">Dicas de suporte</p>
                </div>
                <ul className="space-y-2 text-xs text-blue-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                    <span>Empresas com WhatsApp ativo recebem <strong>3x mais contatos</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                    <span>Definir horário evita mensagens fora do expediente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                    <span>SLA menor que 2h gera <strong>destaque no ranking</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                    <span>Pós-venda ativo gera mais avaliações positivas</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// ─── Helper Component ───────────────────────────────────────
function PreviewItem({
  icon,
  label,
  value,
  muted = false,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  muted?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg ${highlight ? 'bg-emerald-50' : ''}`}>
      {icon}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{label}</p>
        <p className={`text-xs truncate ${muted ? 'text-slate-400 italic' : 'text-slate-700 font-medium'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
