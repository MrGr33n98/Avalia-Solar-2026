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
      'Diagnóstico do problema',
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

export default function ReviewFormsManagement({ companyId }: { companyId: string }) {
  const { toast } = useToast();
  const [forms, setForms] = useState<ReviewForm[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadForms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchApi<{ review_forms: ReviewForm[] }>(
        '/company_admin/review_forms',
        { noCache: true, params: { company_id: companyId } }
      );
      setForms(response.review_forms);
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
      conversion: views ? ((submissions / views) * 100).toFixed(1) : '0.0',
      best: best?.name || 'Sem dados',
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
  };

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
            Reputação verificável
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 lg:text-3xl">
            Coletar Avaliações
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Crie formulários por tipo de projeto e compartilhe um link ou QR Code exclusivo com cada
            cliente.
          </p>
        </div>
        <Button
          onClick={() => setEditor(emptyEditor())}
          className="h-11 bg-blue-600 px-5 font-bold hover:bg-blue-700"
        >
          <FilePlus2 className="mr-2 h-4 w-4" />
          Novo formulário
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Formulários ativos', totals.active],
          ['Avaliações recebidas', totals.submissions],
          ['Taxa de conversão', `${totals.conversion}%`],
          ['Melhor desempenho', totals.best],
        ].map(([label, value]) => (
          <Card key={label} className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-slate-500">{label}</p>
              <p className="mt-2 truncate text-2xl font-black text-slate-950">{value}</p>
            </CardContent>
          </Card>
        ))}
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
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_420px]">
          <div className="space-y-3">
            {forms.map((form) => (
              <Card
                key={form.id}
                onClick={() => setSelectedId(form.id)}
                className={cn(
                  'cursor-pointer rounded-2xl border bg-white shadow-sm transition-colors',
                  selectedId === form.id
                    ? 'border-blue-300 ring-2 ring-blue-100'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-black text-slate-950">{form.name}</h3>
                        <Badge
                          variant="outline"
                          className={
                            form.status === 'active'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 text-slate-500'
                          }
                        >
                          {form.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {TEMPLATES.find((template) => template.type === form.form_type)?.label ||
                          'Personalizado'}
                      </p>
                      <div className="mt-3 flex gap-5 text-xs text-slate-500">
                        <span>
                          <strong className="text-slate-900">{form.metrics.submissions}</strong>{' '}
                          avaliações
                        </span>
                        <span>
                          <strong className="text-slate-900">
                            {form.metrics.conversion_rate}%
                          </strong>{' '}
                          conversão
                        </span>
                      </div>
                    </div>
                    <div
                      className="flex flex-wrap gap-2"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Button variant="outline" size="sm" onClick={() => void copyLink(form)}>
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                        Copiar
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setEditor({ ...form, settings: { ...form.settings } })}
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => void duplicate(form)}
                        aria-label="Duplicar"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => void toggleStatus(form)}
                        aria-label={form.status === 'active' ? 'Desativar' : 'Ativar'}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selected && (
            <QRCodePanel
              form={selected}
              publicUrl={publicUrl(selected)}
              onCopy={() => void copyLink(selected)}
              onTrack={(event) => void trackAction(selected, event)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function QRCodePanel({
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
  const qrUrl = buildApiUrl(`/review_forms/${form.token}/qr_code`);
  const whatsappText = form.settings.whatsapp_message.replace('{{review_form_link}}', publicUrl);
  return (
    <Card className="h-fit rounded-2xl border-slate-200 bg-white shadow-sm xl:sticky xl:top-24">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
              Canal de coleta
            </p>
            <h3 className="mt-1 text-lg font-black text-slate-950">QR Code do formulário</h3>
          </div>
          <QrCode className="h-6 w-6 text-blue-700" />
        </div>
        <div className="mx-auto mt-5 w-fit rounded-2xl border border-slate-200 bg-white p-3">
          <Image src={qrUrl} alt={`QR Code de ${form.name}`} width={232} height={232} unoptimized />
        </div>
        <p className="mt-4 break-all rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-600">
          {publicUrl}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onCopy}>
            <Copy className="mr-2 h-4 w-4" />
            Copiar link
          </Button>
          <Button variant="outline" asChild onClick={() => onTrack('qr_downloaded')}>
            <a href={`${qrUrl}?download=1`} download>
              <Download className="mr-2 h-4 w-4" />
              Baixar PNG
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={publicUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Visualizar
            </a>
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            asChild
            onClick={() => onTrack('whatsapp_clicked')}
          >
            <a
              href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp
            </a>
          </Button>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-5 text-center">
          <Metric label="Visitas" value={form.metrics.views} />
          <Metric label="Envios" value={form.metrics.submissions} />
          <Metric label="Conversão" value={`${form.metrics.conversion_rate}%`} />
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-lg font-black text-slate-950">{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
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
        <Card className="rounded-2xl border-slate-200 shadow-sm">
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
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <span className="flex items-center justify-between">
                      {template.label}
                      {value.form_type === template.type && <Check className="h-4 w-4" />}
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
                />
              </Field>
              <Field label="Título público">
                <Input
                  value={value.public_title}
                  onChange={(event) => onChange({ ...value, public_title: event.target.value })}
                />
              </Field>
            </div>
            <Field label="Descrição pública">
              <Textarea
                rows={3}
                value={value.public_description}
                onChange={(event) => onChange({ ...value, public_description: event.target.value })}
              />
            </Field>
            <section>
              <label className="text-sm font-bold text-slate-900">Critérios avaliativos</label>
              <p className="mt-1 text-xs text-slate-500">
                Selecione os aspectos que receberão nota de 1 a 5.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {ALL_CRITERIA.map((criterion) => (
                  <button
                    key={criterion}
                    type="button"
                    onClick={() => toggleCriterion(criterion)}
                    className={cn(
                      'rounded-full border px-3 py-2 text-xs font-semibold transition-colors',
                      value.settings.criteria.includes(criterion)
                        ? 'border-blue-300 bg-blue-50 text-blue-800'
                        : 'border-slate-200 bg-white text-slate-600'
                    )}
                  >
                    <Star className="mr-1.5 inline h-3.5 w-3.5" />
                    {criterion}
                  </button>
                ))}
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
              />
              <p className="mt-1 text-xs text-slate-400">
                Use {'{{review_form_link}}'} para inserir o link automaticamente.
              </p>
            </Field>
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button
                onClick={onSave}
                disabled={saving || !value.name || !value.public_title}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar formulário
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="h-fit rounded-2xl border-slate-200 bg-slate-950 text-white shadow-sm">
          <CardContent className="p-6">
            <Badge className="border-blue-400/30 bg-blue-400/10 text-blue-200">
              Avaliação no Avalia Solar
            </Badge>
            <h3 className="mt-5 text-xl font-black">
              {value.public_title || 'Título do formulário'}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">{value.public_description}</p>
            <div className="mt-6 space-y-3">
              {value.settings.criteria.slice(0, 4).map((criterion) => (
                <div key={criterion} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs font-semibold text-slate-300">{criterion}</p>
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-4 w-4 text-amber-300" />
                    ))}
                  </div>
                </div>
              ))}
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
