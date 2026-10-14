'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Link2,
  PlayCircle,
  Save,
  Settings2,
  ExternalLink,
  Copy,
  Check,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Users,
  Eye,
  HelpCircle,
  ArrowRight,
  Info,
  Smartphone,
  Globe,
  Share2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchApi, type Company } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { startDashboardTour } from '@/lib/tour';
import Link from 'next/link';

interface CompanySettingsProps {
  companyId: string;
  company?: Company;
}

type CtaField =
  | 'cta_primary_label'
  | 'cta_primary_url'
  | 'cta_secondary_label'
  | 'cta_secondary_url'
  | 'cta_whatsapp_template'
  | 'cta_utm_source'
  | 'cta_utm_medium'
  | 'cta_utm_campaign';

type CtaForm = Record<CtaField, string>;

const formFromCompany = (company?: Company): CtaForm => ({
  cta_primary_label: company?.cta_primary_label ?? '',
  cta_primary_url: company?.cta_primary_url ?? '',
  cta_secondary_label: company?.cta_secondary_label ?? '',
  cta_secondary_url: company?.cta_secondary_url ?? '',
  cta_whatsapp_template: company?.cta_whatsapp_template ?? '',
  cta_utm_source: company?.cta_utm_source ?? '',
  cta_utm_medium: company?.cta_utm_medium ?? '',
  cta_utm_campaign: company?.cta_utm_campaign ?? '',
});

export default function CompanySettings({ companyId, company }: CompanySettingsProps) {
  const { toast } = useToast();
  const [form, setForm] = useState<CtaForm>(() => formFromCompany(company));
  const [isSaving, setIsSaving] = useState(false);
  const [pendingChangeId, setPendingChangeId] = useState<number | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'conversion' | 'utm' | 'team_quick' | 'guide'>('conversion');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setForm(formFromCompany(company));
    setPendingChangeId(null);
  }, [company]);

  const originalForm = useMemo(() => formFromCompany(company), [company]);
  const hasChanges = JSON.stringify(form) !== JSON.stringify(originalForm);
  const configuredCtas = [form.cta_primary_url, form.cta_secondary_url].filter(Boolean).length;

  const updateField = (field: CtaField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();
    if (!hasChanges || isSaving) return;

    setIsSaving(true);

    try {
      const response = await fetchApi<{ message: string; pending_change: { id: number } }>(
        '/company_dashboard/update_ctas',
        {
          method: 'POST',
          params: { company_id: companyId },
          body: JSON.stringify(form),
        }
      );

      setPendingChangeId(response.pending_change.id);
      toast({
        title: 'Configurações enviadas para aprovação',
        description: 'As alterações foram registradas e estarão ativas após validação.',
      });
    } catch (error) {
      console.error('Erro ao atualizar CTAs:', error);
      toast({
        title: 'Não foi possível salvar',
        description: 'Revise os campos e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Montagem dinâmica da URL parametrizada com UTMs
  const generatedParamUrl = useMemo(() => {
    const baseUrl = form.cta_primary_url.trim();
    if (!baseUrl) return '';

    try {
      const url = new URL(baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`);
      if (form.cta_utm_source) url.searchParams.set('utm_source', form.cta_utm_source.trim());
      if (form.cta_utm_medium) url.searchParams.set('utm_medium', form.cta_utm_medium.trim());
      if (form.cta_utm_campaign) url.searchParams.set('utm_campaign', form.cta_utm_campaign.trim());
      return url.toString();
    } catch {
      let combined = baseUrl;
      const params: string[] = [];
      if (form.cta_utm_source) params.push(`utm_source=${encodeURIComponent(form.cta_utm_source.trim())}`);
      if (form.cta_utm_medium) params.push(`utm_medium=${encodeURIComponent(form.cta_utm_medium.trim())}`);
      if (form.cta_utm_campaign) params.push(`utm_campaign=${encodeURIComponent(form.cta_utm_campaign.trim())}`);
      if (params.length > 0) {
        combined += (combined.includes('?') ? '&' : '?') + params.join('&');
      }
      return combined;
    }
  }, [form.cta_primary_url, form.cta_utm_source, form.cta_utm_medium, form.cta_utm_campaign]);

  const handleCopyGeneratedUrl = () => {
    if (!generatedParamUrl) return;
    navigator.clipboard.writeText(generatedParamUrl);
    setCopiedLink(true);
    toast({
      title: 'Link copiado!',
      description: 'URL com parâmetros de rastreamento copiada para a área de transferência.',
    });
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* 1. Header do Painel de Configurações Estilo G2 Enterprise */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-card border border-border/60 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider bg-primary/10 text-primary border-primary/20">
              Perfil B2B Verificado
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-muted-foreground/70" />
              {company?.name || 'Empresa'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Configurações de Conversão & Perfil
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Defina os pontos de contato principais, botões de ação e parâmetros de rastreamento do seu perfil público.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 border border-border/40 text-xs text-muted-foreground">
            <CheckCircle2 className={`w-4 h-4 ${configuredCtas > 0 ? 'text-emerald-500' : 'text-amber-500'}`} />
            <span className="font-semibold text-foreground">{configuredCtas}/2</span>
            <span>CTAs ativos</span>
          </div>

          <Button
            onClick={() => handleSubmit()}
            disabled={!hasChanges || isSaving}
            className="h-10 px-5 text-xs font-semibold shadow-sm"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Enviando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>

      {/* 2. Alerta de Moderação / Pending Change */}
      <AnimatePresence>
        {pendingChangeId && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <AlertTitle className="text-xs font-bold">Alteração #{pendingChangeId} enviada para aprovação</AlertTitle>
              <AlertDescription className="text-xs text-emerald-800 dark:text-emerald-300">
                Seu perfil público mantém a configuração ativa atual até a publicação automática da revisão técnica.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Navegação em Abas Segmentadas Estilo my.g2.com */}
      <Tabs defaultValue="conversion" className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-11 w-full bg-muted/60 p-1 rounded-xl border border-border/40">
          <TabsTrigger value="conversion" className="text-xs flex items-center gap-2 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Chamadas para Ação</span>
          </TabsTrigger>
          <TabsTrigger value="utm" className="text-xs flex items-center gap-2 font-medium">
            <Share2 className="w-3.5 h-3.5 text-primary" />
            <span>Rastreamento & UTMs</span>
          </TabsTrigger>
          <TabsTrigger value="team_quick" className="text-xs flex items-center gap-2 font-medium">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span>Equipe & Membros</span>
          </TabsTrigger>
          <TabsTrigger value="guide" className="text-xs flex items-center gap-2 font-medium">
            <HelpCircle className="w-3.5 h-3.5 text-primary" />
            <span>Guia & Tour</span>
          </TabsTrigger>
        </TabsList>

        {/* ========================================================
            ABA 1: CHAMADAS PARA AÇÃO (CTAs) E WHATSAPP
            ======================================================== */}
        <TabsContent value="conversion" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Coluna Esquerda: Formulário de CTAs */}
            <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
              {/* Card CTA Principal */}
              <Card className="bg-card border-border/60 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-muted/20 border-b border-border/40 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-black">
                        1
                      </div>
                      Botão de Ação Principal (CTA Primário)
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                      Destaque Superior
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground">
                    Exibido com destaque máximo no topo do perfil público e nos cards do ranking.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="cta-primary-label" className="text-xs font-semibold text-foreground">
                      Texto do Botão
                    </Label>
                    <Input
                      id="cta-primary-label"
                      value={form.cta_primary_label}
                      onChange={(e) => updateField('cta_primary_label', e.target.value)}
                      placeholder="Ex: Solicitar Orçamento Grátis"
                      className="h-10 text-xs bg-background"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="cta-primary-url" className="text-xs font-semibold text-foreground">
                      URL de Destino
                    </Label>
                    <div className="relative">
                      <Link2 className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                      <Input
                        id="cta-primary-url"
                        type="url"
                        value={form.cta_primary_url}
                        onChange={(e) => updateField('cta_primary_url', e.target.value)}
                        placeholder="https://suaempresa.com.br/orcamento"
                        className="h-10 text-xs pl-9 bg-background font-mono"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Direcione o visitante para sua landing page ou formulário de captação de leads.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Card CTA Secundário */}
              <Card className="bg-card border-border/60 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-muted/20 border-b border-border/40 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-muted text-muted-foreground flex items-center justify-center text-xs font-black">
                        2
                      </div>
                      Botão de Ação Secundário (Opcional)
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      Ação Secundária
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground">
                    Ideal para baixar catálogo técnico, portfólio de obras ou contato alternativo.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="cta-secondary-label" className="text-xs font-semibold text-foreground">
                      Texto do Botão
                    </Label>
                    <Input
                      id="cta-secondary-label"
                      value={form.cta_secondary_label}
                      onChange={(e) => updateField('cta_secondary_label', e.target.value)}
                      placeholder="Ex: Falar com Consultor"
                      className="h-10 text-xs bg-background"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="cta-secondary-url" className="text-xs font-semibold text-foreground">
                      URL de Destino
                    </Label>
                    <div className="relative">
                      <Link2 className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                      <Input
                        id="cta-secondary-url"
                        type="url"
                        value={form.cta_secondary_url}
                        onChange={(e) => updateField('cta_secondary_url', e.target.value)}
                        placeholder="https://suaempresa.com.br/contato"
                        className="h-10 text-xs pl-9 bg-background font-mono"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card WhatsApp Oficial */}
              <Card className="bg-card border-border/60 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-muted/20 border-b border-border/40 pb-4">
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Template de Mensagem do WhatsApp
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Mensagem pré-preenchida que o cliente encontrará ao iniciar a conversa pelo WhatsApp.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 space-y-3">
                  <Textarea
                    id="cta-whatsapp-template"
                    value={form.cta_whatsapp_template}
                    onChange={(e) => updateField('cta_whatsapp_template', e.target.value)}
                    placeholder="Olá! Encontrei sua empresa no Avalia Solar e gostaria de solicitar um orçamento para o meu telhado."
                    rows={4}
                    className="text-xs bg-background resize-none leading-relaxed"
                  />
                  <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                    <span>Dica: mencione que o contato veio através do Avalia Solar.</span>
                    <span>{form.cta_whatsapp_template.length} caracteres</span>
                  </div>
                </CardContent>
              </Card>

              {/* Botão de Envio Inferior */}
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={!hasChanges || isSaving}
                  className="h-10 px-6 text-xs font-semibold shadow-sm"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Enviando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>

            {/* Coluna Direita: Live Previews Interativos (Buyer Experience) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Simulador de Card Público do Perfil */}
              <Card className="bg-gradient-to-br from-card to-muted/30 border-border/60 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="pb-3 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-primary" />
                      Visualização do Comprador (Preview)
                    </CardTitle>
                    <Badge variant="secondary" className="text-[9px] uppercase font-bold">
                      Ao Vivo
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground">
                    Como os compradores solares visualizam seus botões no perfil público.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  <div className="p-4 rounded-xl bg-card border border-border/40 shadow-sm space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                        {(company?.name || 'AS').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-foreground">{company?.name || 'Sua Empresa Solar'}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-500" />
                          Perfil Oficial Avalia Solar
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 space-y-2">
                      <Button
                        className="w-full h-10 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm flex items-center justify-center gap-1.5"
                        asChild={Boolean(form.cta_primary_url)}
                      >
                        {form.cta_primary_url ? (
                          <a href={form.cta_primary_url} target="_blank" rel="noopener noreferrer">
                            <span>{form.cta_primary_label || 'Solicitar Orçamento'}</span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                          </a>
                        ) : (
                          <span>{form.cta_primary_label || 'Solicitar Orçamento'}</span>
                        )}
                      </Button>

                      {form.cta_secondary_label && (
                        <Button
                          variant="outline"
                          className="w-full h-9 text-xs font-medium border-border/60"
                          asChild={Boolean(form.cta_secondary_url)}
                        >
                          {form.cta_secondary_url ? (
                            <a href={form.cta_secondary_url} target="_blank" rel="noopener noreferrer">
                              <span>{form.cta_secondary_label}</span>
                              <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                            </a>
                          ) : (
                            <span>{form.cta_secondary_label}</span>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Simulador de Chat WhatsApp */}
                  {form.cta_whatsapp_template && (
                    <div className="p-4 rounded-xl bg-[#EFEAE2] dark:bg-slate-900 border border-border/40 space-y-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                        <Smartphone className="w-3 h-3" />
                        Prévia da Mensagem no WhatsApp
                      </div>
                      <div className="p-3 bg-white dark:bg-emerald-950/40 rounded-xl rounded-tl-none shadow-sm text-xs text-slate-800 dark:text-emerald-100 leading-relaxed border border-emerald-200/50 dark:border-emerald-800/50">
                        {form.cta_whatsapp_template}
                        <div className="text-[9px] text-right text-muted-foreground mt-1 font-mono">
                          14:30 • Entregue ✓✓
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Card de Boas Práticas G2 */}
              <Card className="bg-card border-border/60 shadow-sm rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Boas Práticas de Conversão B2B
                </div>
                <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside">
                  <li>Use verbos de ação claros: <strong>Solicitar Orçamento</strong> converte 32% mais que <em>Clique Aqui</em>.</li>
                  <li>Mantenha a URL de destino com formulário direto, evitando páginas genéricas de início.</li>
                  <li>Configure os parâmetros UTM para mensurar o retorno de cada canal no seu Google Analytics.</li>
                </ul>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ========================================================
            ABA 2: ATRIBUIÇÃO DE CAMPANHA & UTMS COM LIVE GENERATOR
            ======================================================== */}
        <TabsContent value="utm" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-6">
              <Card className="bg-card border-border/60 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-muted/20 border-b border-border/40 pb-4">
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-primary" />
                    Parâmetros de Rastreamento UTM
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Adicione tags padronizadas aos seus links para identificar a origem exata dos leads no seu CRM ou Google Analytics.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="cta-utm-source" className="text-xs font-semibold text-foreground">
                        Origem (utm_source)
                      </Label>
                      <Input
                        id="cta-utm-source"
                        value={form.cta_utm_source}
                        onChange={(e) => updateField('cta_utm_source', e.target.value)}
                        placeholder="avalia-solar"
                        className="h-10 text-xs bg-background font-mono"
                      />
                      <span className="text-[10px] text-muted-foreground">Ex: avalia-solar</span>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="cta-utm-medium" className="text-xs font-semibold text-foreground">
                        Mídia (utm_medium)
                      </Label>
                      <Input
                        id="cta-utm-medium"
                        value={form.cta_utm_medium}
                        onChange={(e) => updateField('cta_utm_medium', e.target.value)}
                        placeholder="perfil-empresa"
                        className="h-10 text-xs bg-background font-mono"
                      />
                      <span className="text-[10px] text-muted-foreground">Ex: perfil-empresa</span>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="cta-utm-campaign" className="text-xs font-semibold text-foreground">
                        Campanha (utm_campaign)
                      </Label>
                      <Input
                        id="cta-utm-campaign"
                        value={form.cta_utm_campaign}
                        onChange={(e) => updateField('cta_utm_campaign', e.target.value)}
                        placeholder="solar-2026"
                        className="h-10 text-xs bg-background font-mono"
                      />
                      <span className="text-[10px] text-muted-foreground">Ex: solar-2026</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/40 flex justify-end">
                    <Button
                      onClick={() => handleSubmit()}
                      disabled={!hasChanges || isSaving}
                      className="h-9 px-4 text-xs font-semibold"
                    >
                      <Save className="w-3.5 h-3.5 mr-1.5" />
                      {isSaving ? 'Salvando...' : 'Salvar Parâmetros'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Coluna Direita: Live Generator Box */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="bg-card border-border/60 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-muted/20 border-b border-border/40 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-primary" />
                      Link Parametrizado Gerado
                    </CardTitle>
                    <Badge variant="outline" className="text-[9px] uppercase font-bold text-primary">
                      Live UTM
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground">
                    URL completa montada dinamicamente pronta para teste ou divulgação externa.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-5 space-y-3">
                  <div className="p-3 bg-muted/40 rounded-xl border border-border/50 font-mono text-xs text-foreground break-all leading-relaxed select-all">
                    {generatedParamUrl || (
                      <span className="text-muted-foreground italic font-sans text-xs">
                        Preencha o CTA Principal na aba ao lado para gerar o link rastreado...
                      </span>
                    )}
                  </div>

                  <Button
                    onClick={handleCopyGeneratedUrl}
                    disabled={!generatedParamUrl}
                    variant="outline"
                    className="w-full h-9 text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Link Copiado com Sucesso!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar URL com UTMs</span>
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ========================================================
            ABA 3: GESTÃO DE EQUIPE & MEMBROS (INTEGRAÇÃO B2B)
            ======================================================== */}
        <TabsContent value="team_quick" className="mt-6 space-y-6">
          <Card className="bg-card border-border/60 shadow-sm rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold text-foreground">Administração da Equipe da Empresa</h3>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                  Gerencie colaboradores, atribua papéis (Proprietário, Gerente, Editor, Visualizador) e envie convites transacionais protegidos por tokens.
                </p>
              </div>

              <Button asChild className="h-10 px-5 text-xs font-semibold shrink-0">
                <Link href="/dashboard/settings/team">
                  <span>Abrir Gestão de Equipe</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* ========================================================
            ABA 4: GUIA DE ORIENTAÇÃO & TOUR
            ======================================================== */}
        <TabsContent value="guide" className="mt-6 space-y-6">
          <Card className="bg-card border-border/60 shadow-sm rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <PlayCircle className="w-6 h-6" />
                  <h3 className="text-lg font-bold text-foreground">Tour Guiado da Plataforma</h3>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                  Reinicie o passo a passo interativo para conhecer todos os recursos do painel B2B, rankings e ferramentas de reputação.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => startDashboardTour()}
                className="h-10 px-5 text-xs font-semibold shrink-0"
              >
                <PlayCircle className="w-4 h-4 mr-2 text-primary" />
                Iniciar Tour Guiado
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
