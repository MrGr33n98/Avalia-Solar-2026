'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  FilePlus2,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Power,
  QrCode,
  Star,
  Home,
  Building2,
  Wrench,
  Zap,
  ClipboardList,
  Eye,
  TrendingUp,
  Calendar,
  Sparkles,
  Award,
  Link as LinkIcon,
  CreditCard,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { buildApiUrl } from '@/lib/api-config';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics/consolidated';

type ReviewFormSettings = {
  criteria: string[];
  comment_required: boolean;
  thank_you_message: string;
  whatsapp_message: string;
};

type ReviewForm = {
  id: number;
  name: string;
  public_title: string;
  public_description: string;
  form_type: string;
  token: string;
  status: 'active' | 'inactive';
  public_path: string;
  settings: ReviewFormSettings;
  metrics: { views: number; submissions: number; conversion_rate: number };
  last_review_at?: string;
};

type EditorState = {
  id?: number;
  name: string;
  public_title: string;
  public_description: string;
  form_type: string;
  status: 'active' | 'inactive';
  settings: ReviewFormSettings;
};

const TEMPLATES = [
  {
    type: 'residential_solar',
    label: 'Solar residencial',
    criteria: [
      'Atendimento',
      'Clareza na proposta',
      'Qualidade da instalação',
      'Cumprimento de prazo',
      'Custo-benefício',
      'Suporte pós-venda',
    ],
  },
  {
    type: 'commercial_solar',
    label: 'Solar comercial',
    criteria: [
      'Diagnóstico técnico',
      'Qualidade do projeto',
      'Prazo de execução',
      'Comunicação',
      'Economia percebida',
      'Suporte pós-venda',
    ],
  },
  {
    type: 'ev_charger',
    label: 'Mobilidade elétrica',
    criteria: [
      'Atendimento',
      'Orientação técnica',
      'Instalação do carregador',
      'Facilidade de uso',
      'Segurança',
      'Suporte pós-venda',
    ],
  },
  {
    type: 'solar_maintenance',
    label: 'Manutenção / O&M',
    criteria: [
      'Agilidade no atendimento',
      'Diagnóstico do problem',
      'Qualidade do serviço',
      'Comunicação',
      'Preço justo',
      'Resultado final',
    ],
  },
  {
    type: 'general',
    label: 'Avaliação geral',
    criteria: ['Atendimento', 'Qualidade', 'Prazo', 'Custo-benefício', 'Recomendação'],
  },
];

const ALL_CRITERIA = Array.from(new Set(TEMPLATES.flatMap((template) => template.criteria)));

const getTemplateIcon = (type: string) => {
  switch (type) {
    case 'residential_solar':
      return Home;
    case 'commercial_solar':
      return Building2;
    case 'ev_charger':
      return Zap;
    case 'solar_maintenance':
      return Wrench;
    default:
      return ClipboardList;
  }
};

const getTemplateIconColor = (type: string) => {
  switch (type) {
    case 'residential_solar':
      return 'text-emerald-600 bg-emerald-50/55 border-emerald-200';
    case 'commercial_solar':
      return 'text-blue-600 bg-blue-50/55 border-blue-200';
    case 'ev_charger':
      return 'text-amber-600 bg-amber-50/55 border-amber-200';
    case 'solar_maintenance':
      return 'text-orange-600 bg-orange-50/55 border-orange-200';
    default:
      return 'text-slate-600 bg-slate-50/55 border-slate-200';
  }
};

const emptyEditor = (): EditorState => ({
  name: 'Avaliação geral',
  public_title: 'Avalie sua experiência com nossa empresa',
  public_description:
    'Sua opinião ajuda outros clientes a escolherem empresas confiáveis no Avalia Solar.',
  form_type: 'general',
  status: 'active',
  settings: {
    criteria: TEMPLATES[4].criteria,
    comment_required: true,
    thank_you_message: 'Obrigado! Sua avaliação foi enviada para moderação.',
    whatsapp_message:
      'Olá! Obrigado por escolher nossa empresa. Sua opinião é muito importante. Avalie sua experiência aqui:\n{{review_form_link}}',
  },
});

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Sem avaliações';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Sem avaliações';
  return date.toLocaleDateString('pt-BR');
};

export default function ReviewFormsManagement({ companyId }: { companyId: string }) {
  const { toast } = useToast();
  const [forms, setForms] = useState<ReviewForm[]>([]);
  const [summary, setSummary] = useState<{ recent_forms_count: number; recent_reviews_count: number }>({
    recent_forms_count: 0,
    recent_reviews_count: 0,
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'reviews'>('recent');

  const loadForms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchApi<{ review_forms: ReviewForm[]; summary: { recent_forms_count: number; recent_reviews_count: number } }>(
        '/company_admin/review_forms',
        { noCache: true, params: { company_id: companyId } }
      );
      setForms(response.review_forms);
      setSummary(response.summary || { recent_forms_count: 0, recent_reviews_count: 0 });
      setSelectedId((current) => current ?? response.review_forms[0]?.id ?? null);
    } catch {
      toast({ title: 'Não foi possível carregar os formulários', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [companyId, toast]);

  useEffect(() => {
    void loadForms();
    track('review_forms_page_viewed', { company_id: companyId });
  }, [companyId, loadForms]);

  const sortedForms = useMemo(() => {
    const list = [...forms];
    if (sortBy === 'reviews') {
      return list.sort((a, b) => b.metrics.submissions - a.metrics.submissions);
    }
    return list; // Já vem ordenado por recent_first (created_at desc) do backend
  }, [forms, sortBy]);

  const selected = forms.find((form) => form.id === selectedId) || null;

  const totals = useMemo(() => {
    const submissions = forms.reduce((sum, form) => sum + form.metrics.submissions, 0);
    const views = forms.reduce((sum, form) => sum + form.metrics.views, 0);
    const best = [...forms].sort(
      (a, b) => b.metrics.conversion_rate - a.metrics.conversion_rate
    )[0];
    return {
      active: forms.filter((form) => form.status === 'active').length,
      submissions,
      views,
      conversion: views ? ((submissions / views) * 100).toFixed(1) : '0.0',
      best: best?.name || 'Sem dados',
      bestRate: best ? `${best.metrics.conversion_rate}%` : '0.0%',
    };
  }, [forms]);

  const publicUrl = (form: ReviewForm) =>
    `${typeof window === 'undefined' ? '' : window.location.origin}${form.public_path}`;

  const saveForm = async () => {
    if (!editor) return;
    try {
      setSaving(true);
      const endpoint = editor.id
        ? `/company_admin/review_forms/${editor.id}`
        : '/company_admin/review_forms';
      const response = await fetchApi<{ review_form: ReviewForm }>(endpoint, {
        method: editor.id ? 'PATCH' : 'POST',
        body: JSON.stringify({ review_form: editor }),
        params: { company_id: companyId },
      });
      setForms((current) => {
        const exists = current.some((form) => form.id === response.review_form.id);
        return exists
          ? current.map((form) =>
              form.id === response.review_form.id ? response.review_form : form
            )
          : [response.review_form, ...current];
      });
      setSelectedId(response.review_form.id);
      setEditor(null);
      toast({ title: editor.id ? 'Formulário atualizado' : 'Formulário criado' });
    } catch (error) {
      toast({
        title: 'Não foi possível salvar',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const trackAction = async (form: ReviewForm, eventType: string) => {
    await fetchApi(`/company_admin/review_forms/${form.id}/event`, {
      method: 'POST',
      body: JSON.stringify({ event_type: eventType, source: 'dashboard' }),
      params: { company_id: companyId },
      retries: 1,
    }).catch(() => undefined);
  };

  const copyLink = async (form: ReviewForm) => {
    await navigator.clipboard.writeText(publicUrl(form));
    void trackAction(form, 'link_copied');
    toast({ title: 'Link copiado' });
  };

  const duplicate = async (form: ReviewForm) => {
    const response = await fetchApi<{ review_form: ReviewForm }>(
      `/company_admin/review_forms/${form.id}/duplicate`,
      { method: 'POST', params: { company_id: companyId } }
    );
    setForms((current) => [response.review_form, ...current]);
    setSelectedId(response.review_form.id);
    toast({ title: 'Formulário duplicado' });
  };

  const toggleStatus = async (form: ReviewForm) => {
    const response = await fetchApi<{ review_form: ReviewForm }>(
      `/company_admin/review_forms/${form.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          review_form: { status: form.status === 'active' ? 'inactive' : 'active' },
        }),
        params: { company_id: companyId },
      }
    );
    setForms((current) =>
      current.map((item) => (item.id === form.id ? response.review_form : item))
    );
    toast({
      title: response.review_form.status === 'active' ? 'Formulário ativado' : 'Formulário pausado',
    });
  };

  const metaRecommendationPercentage = Math.min(100, (totals.submissions / 60) * 100);

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando formulários...
      </div>
    );
  }

  if (editor) {
    return (
      <ReviewFormEditor
        value={editor}
        onChange={setEditor}
        onCancel={() => setEditor(null)}
        onSave={saveForm}
        saving={saving}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Topo / Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
            Reputação verificável
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 lg:text-3xl">
            Coletar Avaliações
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Crie formulários por tipo de projeto e compartilhe um link ou QR Code exclusivo com cada cliente.
          </p>
        </div>
        <Button
          onClick={() => setEditor(emptyEditor())}
          className="h-11 bg-blue-600 px-5 font-bold hover:bg-blue-700 text-white rounded-xl shadow-md transition-all shrink-0"
        >
          <FilePlus2 className="mr-2 h-4 w-4" />
          Novo formulário
        </Button>
      </div>

      {/* Passo a Passo Visual do Fluxo */}
      <div className="hidden border border-slate-200 bg-slate-50/50 p-4 md:block rounded-2xl">
        <div className="mx-auto flex max-w-4xl justify-between gap-4 text-xs font-bold text-slate-500">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[10px] font-black">1</span>
            <div>
              <p className="text-slate-900 font-extrabold">Escolha um modelo</p>
              <p className="text-[10px] text-slate-400 font-normal">Selecione o tipo de projeto</p>
            </div>
          </div>
          <span className="self-center text-slate-300">➔</span>
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[10px] font-black">2</span>
            <div>
              <p className="text-slate-900 font-extrabold">Compartilhe</p>
              <p className="text-[10px] text-slate-400 font-normal">WhatsApp, QR Code ou link</p>
            </div>
          </div>
          <span className="self-center text-slate-300">➔</span>
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[10px] font-black">3</span>
            <div>
              <p className="text-slate-900 font-extrabold">Receba avaliações</p>
              <p className="text-[10px] text-slate-400 font-normal">Clientes opinam em tempo real</p>
            </div>
          </div>
          <span className="self-center text-slate-300">➔</span>
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[10px] font-black">4</span>
            <div>
              <p className="text-slate-900 font-extrabold">Melhore a reputação</p>
              <p className="text-[10px] text-slate-400 font-normal">Mais reviews traem negócios</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Estatísticas (Stats Cards) */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Formulários ativos */}
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Formulários ativos</p>
              <p className="mt-2 truncate text-3xl font-black text-slate-950 leading-none">{totals.active}</p>
              <p className="mt-1.5 text-[10px] text-emerald-600 font-semibold">
                +{summary.recent_forms_count} nos últimos 7 dias
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <ClipboardList className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Reviews coletados */}
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reviews coletados</p>
              <p className="mt-2 truncate text-3xl font-black text-slate-950 leading-none">{totals.submissions}</p>
              <p className="mt-1.5 text-[10px] text-amber-600 font-semibold">
                +{summary.recent_reviews_count} nos últimos 7 dias
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-50">
              <Star className="h-6 w-6 fill-amber-500 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        {/* Conversão do link */}
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Conversão do link</p>
              <p className="mt-2 truncate text-3xl font-black text-slate-950 leading-none">{totals.conversion}%</p>
              <p className="mt-1.5 text-[10px] text-slate-500 font-medium">
                {totals.submissions} envios • {totals.views} visitas
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Melhor formulário */}
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Melhor desempenho</p>
              <p className="mt-2 truncate text-xl font-black text-slate-950 leading-tight max-w-[180px]">{totals.best}</p>
              <p className="mt-1 text-[10px] text-orange-600 font-semibold">
                {totals.bestRate} de conversão
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
              <Award className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {forms.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-slate-300 bg-white">
          <CardContent className="flex min-h-[340px] flex-col items-center justify-center p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <QrCode className="h-8 w-8" />
            </div>
            <h3 className="mt-5 text-xl font-black text-slate-950">Crie seu primeiro formulário</h3>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Comece com um template pronto e gere o link e o QR Code em poucos segundos.
            </p>
            <Button
              onClick={() => setEditor(emptyEditor())}
              className="mt-6 bg-blue-600 hover:bg-blue-700"
            >
              Criar formulário
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Layout Principal: 2 Colunas (Lista | Painel de Coleta) */
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_420px]">
          {/* Coluna Esquerda: Listagem + Ordenação + Banner */}
          <div className="space-y-4">
            {/* Header da Seção de Formulários */}
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-950 uppercase tracking-wider">Seus Formulários</h3>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'recent' | 'reviews')}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  <option value="recent">Mais recentes</option>
                  <option value="reviews">Mais avaliações</option>
                </select>
              </div>
            </div>

            {/* Listagem de Cards de Formulário */}
            <div className="space-y-3">
              {sortedForms.map((form) => {
                const isSelected = selectedId === form.id;
                const IconComponent = getTemplateIcon(form.form_type);
                return (
                  <Card
                    key={form.id}
                    onClick={() => setSelectedId(form.id)}
                    className={cn(
                      'cursor-pointer rounded-2xl border bg-white transition-all hover:border-slate-300',
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-100/60 shadow-sm'
                        : 'border-slate-200 hover:shadow-sm'
                    )}
                  >
                    <CardContent className="p-5 flex flex-col md:flex-row gap-4 items-start md:items-center">
                      {/* Ícone Redondo do Modelo */}
                      <div className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border",
                        getTemplateIconColor(form.form_type)
                      )}>
                        <IconComponent className="h-6 w-6" />
                      </div>

                      {/* Informações Principais */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-black text-slate-950 text-sm md:text-base leading-tight">
                            {form.name}
                          </h3>
                          <Badge
                            variant="outline"
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border',
                              form.status === 'active'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                : 'border-amber-200 bg-amber-50 text-amber-800'
                            )}
                          >
                            {form.status === 'active' ? 'Ativo' : 'Pausado'}
                          </Badge>
                        </div>
                        
                        <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                          {form.public_description || 'Formulário padrão para coleta de feedbacks.'}
                        </p>

                        {/* Tags de Critérios */}
                        {form.settings?.criteria && form.settings.criteria.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {form.settings.criteria.slice(0, 4).map((criterion) => (
                              <span
                                key={criterion}
                                className="inline-flex items-center text-[10px] bg-slate-50 border border-slate-200 text-slate-600 rounded-md px-1.5 py-0.5 font-semibold"
                              >
                                {criterion}
                              </span>
                            ))}
                            {form.settings.criteria.length > 4 && (
                              <span className="inline-flex items-center text-[10px] bg-slate-50 border border-slate-200 text-slate-600 rounded-md px-1.5 py-0.5 font-black">
                                +{form.settings.criteria.length - 4}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Linha de Métricas */}
                        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500 border-t border-slate-100 pt-3">
                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <strong className="text-slate-900 font-bold">{form.metrics.submissions}</strong> reviews
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5 text-slate-400" />
                            <strong className="text-slate-900 font-bold">{form.metrics.views}</strong> visitas
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                            <strong className="text-slate-900 font-bold">{form.metrics.conversion_rate}%</strong> conversão
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            Última: {formatDate(form.last_review_at)}
                          </span>
                        </div>
                      </div>

                      {/* Lado Direito: Mini QR Code + Botões Rápidos */}
                      <div
                        className="flex md:flex-col items-center md:items-end justify-between shrink-0 ml-0 md:ml-4 w-full md:w-auto mt-4 md:mt-0 border-t border-slate-100 pt-3 md:border-t-0 md:pt-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Mini QR Code Thumbnail (Apenas Desktop) */}
                        <div className="relative hidden md:flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-1">
                          <Image
                            src={buildApiUrl(`/review_forms/${form.token}/qr_code`)}
                            alt=""
                            fill
                            sizes="56px"
                            className="object-contain p-0.5"
                            unoptimized
                          />
                        </div>

                        {/* Botões Rápidos de Ação */}
                        <div className="flex items-center gap-1 mt-0 md:mt-3 w-full justify-between md:justify-end">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border-slate-200"
                            onClick={() => void copyLink(form)}
                            title="Copiar Link"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 border-slate-200"
                            asChild
                            onClick={() => void trackAction(form, 'whatsapp_clicked')}
                            title="Enviar por WhatsApp"
                          >
                            <a
                              href={`https://wa.me/?text=${encodeURIComponent(
                                form.settings.whatsapp_message.replace('{{review_form_link}}', publicUrl(form))
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border-slate-200"
                            asChild
                            onClick={() => void trackAction(form, 'qr_downloaded')}
                            title="Baixar QR Code"
                          >
                            <a href={`${buildApiUrl(`/review_forms/${form.token}/qr_code`)}?download=1`} download>
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-slate-50 border-slate-200"
                            onClick={() => setEditor({ ...form, settings: { ...form.settings } })}
                            title="Editar Formulário"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className={cn(
                              'h-8 w-8 border-slate-200',
                              form.status === 'active'
                                ? 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                                : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'
                            )}
                            onClick={() => void toggleStatus(form)}
                            title={form.status === 'active' ? 'Desativar / Pausar' : 'Reativar'}
                          >
                            <Power className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Banner de Incentivo Inferior (Meta Recomendada) */}
            <Card className="rounded-2xl border-slate-200 bg-blue-50/30 overflow-hidden mt-6">
              <CardContent className="p-5 flex flex-col md:flex-row items-center gap-5 justify-between">
                <div className="flex items-center gap-4">
                  {/* Ilustração ou Ícone Redondo */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 leading-tight">
                      Você ainda pode receber mais avaliações!
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-1 max-w-md">
                      Empresas com mais de 10 reviews têm 3x mais chances de fechar novos contratos no Avalia Solar.
                    </p>
                  </div>
                </div>

                {/* Bloco de Meta de Progresso */}
                <div className="w-full md:w-52 shrink-0">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1.5 uppercase">
                    <span>Meta recomendada</span>
                    <span className="text-slate-900 font-extrabold">{totals.submissions}/60 reviews</span>
                  </div>
                  {/* Progress Bar Container */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${metaRecommendationPercentage}%` }}
                    />
                  </div>
                  {totals.submissions < 60 ? (
                    <p className="text-[9px] text-slate-400 mt-1 text-right font-medium">
                      Receber mais {60 - totals.submissions} reviews
                    </p>
                  ) : (
                    <p className="text-[9px] text-emerald-600 mt-1 text-right font-bold flex items-center gap-0.5 justify-end">
                      <Check className="h-2.5 w-2.5" /> Meta batida!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita: Painel Canal de Coleta */}
          <div className="xl:sticky xl:top-24 h-fit">
            {selected && (
              <CanalColetaPanel
                form={selected}
                publicUrl={publicUrl(selected)}
                onCopy={() => void copyLink(selected)}
                onTrack={(event) => void trackAction(selected, event)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CanalColetaPanel({
  form,
  publicUrl,
  onCopy,
  onTrack,
}: {
  form: ReviewForm;
  publicUrl: string;
  onCopy: () => void;
  onTrack: (event: string) => void;
}) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'qr_code' | 'whatsapp' | 'link' | 'card'>('qr_code');
  const qrUrl = buildApiUrl(`/review_forms/${form.token}/qr_code`);
  const whatsappText = form.settings.whatsapp_message.replace('{{review_form_link}}', publicUrl);
  
  // Formatador do link encurtado estético
  const shortUrl = publicUrl
    .replace(/^https?:\/\//, '')
    .replace('avaliasolar.com.br/f/', 'avali.as/');

  const handleCopyMessage = async () => {
    await navigator.clipboard.writeText(whatsappText);
    void onTrack('link_copied');
    toast({ title: 'Mensagem pronta copiada!' });
  };

  const handleCopyShortUrl = async () => {
    await navigator.clipboard.writeText(`https://${shortUrl}`);
    void onTrack('link_copied');
    toast({ title: 'Link curto copiado!' });
  };

  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm overflow-hidden border">
      {/* Abas Superiores de Canais */}
      <div className="grid grid-cols-4 border-b border-slate-100 bg-slate-50/50 p-1.5 gap-1">
        {(
          [
            ['qr_code', 'QR Code', QrCode],
            ['whatsapp', 'WhatsApp', MessageCircle],
            ['link', 'Link', LinkIcon],
            ['card', 'Cartão', CreditCard],
          ] as const
        ).map(([id, label, Icon]) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 py-2 px-1 text-[10px] font-bold rounded-xl transition-all',
                isActive
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-100'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <Icon className="h-4.5 w-4.5" />
              {label}
            </button>
          );
        })}
      </div>

      <CardContent className="p-6">
        {/* Identificação do Canal Coleta */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-700">
              Canal de Coleta
            </p>
            <h3 className="mt-1 text-base font-black text-slate-950">{form.name}</h3>
          </div>
          <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-50 text-emerald-800 px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full"
          >
            Link ativo
          </Badge>
        </div>

        {/* Renderização Condicional da Aba Ativa */}
        {activeTab === 'qr_code' && (
          <div className="space-y-5">
            <div className="mx-auto w-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <Image
                src={qrUrl}
                alt={`QR Code de ${form.name}`}
                width={200}
                height={200}
                className="object-contain"
                unoptimized
              />
            </div>

            {/* Link Curto Box */}
            <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-2.5 border border-slate-100">
              <span className="truncate text-xs font-bold text-slate-700 select-all">{shortUrl}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyShortUrl}
                className="h-8 text-blue-700 hover:text-blue-800 hover:bg-blue-50 font-bold text-xs shrink-0"
              >
                Copiar
              </Button>
            </div>

            {/* Botões Rápidos */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-10 text-xs font-bold rounded-xl border-slate-200"
                onClick={onCopy}
              >
                <Copy className="mr-2 h-4 w-4 text-slate-400" />
                Copiar Link
              </Button>
              <Button
                variant="outline"
                className="h-10 text-xs font-bold rounded-xl border-slate-200"
                asChild
                onClick={() => onTrack('qr_downloaded')}
              >
                <a href={`${qrUrl}?download=1`} download>
                  <Download className="mr-2 h-4 w-4 text-slate-400" />
                  Baixar PNG
                </a>
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'whatsapp' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Mensagem pronta para WhatsApp
              </label>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 leading-relaxed font-medium">
                {whatsappText}
              </div>
            </div>

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl shadow-sm gap-2"
              asChild
              onClick={() => onTrack('whatsapp_clicked')}
            >
              <a
                href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="h-5 w-5" />
                Enviar no WhatsApp
              </a>
            </Button>

            <Button
              variant="outline"
              className="w-full h-10 border-slate-200 text-xs font-bold text-slate-700 rounded-xl"
              onClick={handleCopyMessage}
            >
              Copiar mensagem completa
            </Button>
          </div>
        )}

        {activeTab === 'link' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Link Curto</p>
                <p className="text-xs font-bold text-slate-800 mt-1 select-all break-all">{shortUrl}</p>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Link Completo</p>
                <p className="text-xs font-normal text-slate-600 mt-1 select-all break-all leading-relaxed">
                  {publicUrl}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                variant="outline"
                className="h-10 text-xs font-bold rounded-xl border-slate-200"
                onClick={onCopy}
              >
                <Copy className="mr-2 h-4 w-4 text-slate-400" />
                Copiar Link
              </Button>
              <Button
                variant="outline"
                className="h-10 text-xs font-bold rounded-xl border-slate-200"
                asChild
              >
                <a href={publicUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4 text-slate-400" />
                  Visualizar
                </a>
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'card' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase">Cartão de Mesa / Balcão NFC</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Adquira ou configure cartões de mesa físicos com QR Code ou tags inteligentes NFC para coletar reviews dos seus clientes no local.
              </p>
              <ul className="mt-3.5 space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>Configuração via link único do formulário</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>Acesso instantâneo aproximando o celular</span>
                </li>
              </ul>
            </div>

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-xl shadow-sm"
              onClick={onCopy}
            >
              Copiar link para gravar NFC
            </Button>
          </div>
        )}

        {/* Seção de Boas Práticas */}
        <div className="mt-6 border-t border-slate-100 pt-5">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 mb-3">
            Boas Práticas
          </p>
          <ul className="space-y-2.5 text-xs text-slate-600">
            {[
              'Peça a avaliação logo após a entrega da obra.',
              'Explique que a opinião ajuda outros clientes.',
              'Envie pelo WhatsApp com mensagem pessoal.',
              'Não ofereça recompensa em troca da nota.',
              'Responda a todas as avaliações recebidas.',
            ].map((practice, index) => (
              <li key={index} className="flex items-start gap-2.5 leading-snug">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{practice}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewFormEditor({
  value,
  onChange,
  onCancel,
  onSave,
  saving,
}: {
  value: EditorState;
  onChange: (value: EditorState) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const applyTemplate = (template: (typeof TEMPLATES)[number]) =>
    onChange({
      ...value,
      form_type: template.type,
      name: template.label,
      public_title: `Avalie sua experiência com ${template.label.toLowerCase()}`,
      settings: { ...value.settings, criteria: template.criteria },
    });
    
  const toggleCriterion = (criterion: string) =>
    onChange({
      ...value,
      settings: {
        ...value.settings,
        criteria: value.settings.criteria.includes(criterion)
          ? value.settings.criteria.filter((item) => item !== criterion)
          : [...value.settings.criteria, criterion],
      },
    });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
          Configuração guiada
        </p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">
          {value.id ? 'Editar formulário' : 'Novo formulário'}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Escolha um ponto de partida e ajuste apenas o que seus clientes precisam responder.
        </p>
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="rounded-2xl border-slate-200 shadow-sm bg-white">
          <CardContent className="space-y-6 p-6">
            <section>
              <label className="text-sm font-bold text-slate-900">Template</label>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {TEMPLATES.map((template) => (
                  <button
                    key={template.type}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className={cn(
                      'rounded-xl border p-3 text-left text-sm font-semibold transition-colors',
                      value.form_type === template.type
                        ? 'border-blue-300 bg-blue-50 text-blue-800'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    )}
                  >
                    <span className="flex items-center justify-between gap-1.5">
                      {template.label}
                      {value.form_type === template.type && <Check className="h-4 w-4 shrink-0 text-blue-600" />}
                    </span>
                  </button>
                ))}
              </div>
            </section>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome interno">
                <Input
                  value={value.name}
                  onChange={(event) => onChange({ ...value, name: event.target.value })}
                  className="rounded-xl border-slate-200"
                />
              </Field>
              <Field label="Título público">
                <Input
                  value={value.public_title}
                  onChange={(event) => onChange({ ...value, public_title: event.target.value })}
                  className="rounded-xl border-slate-200"
                />
              </Field>
            </div>
            
            <Field label="Descrição pública">
              <Textarea
                rows={3}
                value={value.public_description}
                onChange={(event) => onChange({ ...value, public_description: event.target.value })}
                className="rounded-xl border-slate-200"
              />
            </Field>
            
            <section>
              <label className="text-sm font-bold text-slate-900">Critérios avaliativos</label>
              <p className="mt-1 text-xs text-slate-500">
                Selecione os aspectos que receberão nota de 1 a 5.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {ALL_CRITERIA.map((criterion) => {
                  const isSelected = value.settings.criteria.includes(criterion);
                  return (
                    <button
                      key={criterion}
                      type="button"
                      onClick={() => toggleCriterion(criterion)}
                      className={cn(
                        'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5',
                        isSelected
                          ? 'border-blue-300 bg-blue-50 text-blue-800'
                          : 'border-slate-200 bg-white text-slate-650 hover:border-slate-300'
                      )}
                    >
                      <Star className={cn("h-3.5 w-3.5", isSelected ? "fill-blue-600 text-blue-600" : "text-slate-400")} />
                      {criterion}
                    </button>
                  );
                })}
              </div>
            </section>
            
            <Field label="Mensagem de agradecimento">
              <Textarea
                rows={2}
                value={value.settings.thank_you_message}
                onChange={(event) =>
                  onChange({
                    ...value,
                    settings: { ...value.settings, thank_you_message: event.target.value },
                  })
                }
                className="rounded-xl border-slate-200"
              />
            </Field>
            
            <Field label="Mensagem pronta para WhatsApp">
              <Textarea
                rows={4}
                value={value.settings.whatsapp_message}
                onChange={(event) =>
                  onChange({
                    ...value,
                    settings: { ...value.settings, whatsapp_message: event.target.value },
                  })
                }
                className="rounded-xl border-slate-200"
              />
              <p className="mt-1.5 text-[10px] text-slate-400 font-medium">
                Use {'{{review_form_link}}'} para inserir o link automaticamente.
              </p>
            </Field>
            
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={onCancel} className="rounded-xl border-slate-200 font-bold">
                Cancelar
              </Button>
              <Button
                onClick={onSave}
                disabled={saving || !value.name || !value.public_title}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar formulário
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Preview do Formulário (Lado Direito) */}
        <Card className="h-fit rounded-2xl border-slate-800 bg-slate-950 text-white shadow-sm overflow-hidden">
          <div className="bg-slate-900 border-b border-white/5 px-6 py-4">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
              Visualização prévia do formulário
            </span>
          </div>
          <CardContent className="p-6 space-y-5">
            <Badge className="border-blue-400/30 bg-blue-400/10 text-blue-200 rounded-full font-bold">
              Avaliação no Avalia Solar
            </Badge>
            <h3 className="text-lg font-black tracking-tight text-white leading-snug">
              {value.public_title || 'Título do formulário'}
            </h3>
            <p className="text-xs leading-relaxed text-slate-350">{value.public_description}</p>
            
            <div className="space-y-2.5 mt-2">
              {value.settings.criteria.slice(0, 4).map((criterion) => (
                <div key={criterion} className="rounded-xl border border-white/5 bg-white/5 p-3">
                  <p className="text-[11px] font-bold text-slate-300">{criterion}</p>
                  <div className="mt-1.5 flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                    ))}
                  </div>
                </div>
              ))}
              {value.settings.criteria.length > 4 && (
                <p className="text-[10px] text-slate-400 font-medium text-center italic">
                  + {value.settings.criteria.length - 4} critérios adicionais serão exibidos...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-900">{label}</span>
      {children}
    </label>
  );
}
