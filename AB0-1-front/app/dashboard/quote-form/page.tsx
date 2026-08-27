'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Eye,
  Loader2,
  Lock,
  Palette,
  Plus,
  Send,
  Trash2,
  Monitor,
  Tablet,
  Smartphone,
  ChevronRight,
  BarChart3,
  ListTodo
} from 'lucide-react';
import RoleBasedDashboardLayout from '../components/RoleBasedDashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCompanyContext } from '@/context/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { quoteFormApi, type QuoteFormStudioResponse } from '@/lib/api/quoteForm';
import { cn } from '@/lib/utils';

type Field = { id: string; label: string; type: string; required: boolean };
type Step = { id: string; title: string; fields: Field[] };
type Editor = {
  steps: Step[];
  thank_you_config: { title: string; message: string };
  ui_config: { primary_color: string; logo_url: string; show_progress_bar: boolean; modal_radius: string };
};

const initial: Editor = {
  ui_config: { primary_color: '#2563eb', logo_url: '', show_progress_bar: true, modal_radius: 'rounded-xl' },
  steps: [{ id: 'contact', title: 'Sobre você', fields: [{ id: 'name', label: 'Como podemos chamar você?', type: 'text', required: true }] }],
  thank_you_config: { title: 'Obrigado!', message: 'Recebemos sua solicitação.' }
};

export default function QuoteFormStudioPage() {
  const { activeCompany } = useCompanyContext();
  const { user } = useAuth();
  const [tab, setTab] = useState<'questions' | 'appearance' | 'analytics'>('questions');
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('mobile');
  const [editor, setEditor] = useState<Editor>(initial);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [entitlement, setEntitlement] = useState<QuoteFormStudioResponse['entitlement']>();
  const [companyData, setCompanyData] = useState<QuoteFormStudioResponse['company']>();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const companyId = activeCompany?.id ?? user?.company_id;
  const canEdit = entitlement?.can_customize !== false && entitlement?.can_publish !== false;
  const logoToShow = editor.ui_config.logo_url || activeCompany?.logo_url || companyData?.logo_url;

  useEffect(() => {
    if (!companyId) return;
    quoteFormApi
      .studio(companyId)
      .then((data) => {
        setEntitlement(data.entitlement);
        setCompanyData(data.company);
        if (data.draft) {
          setEditor({
            ...initial,
            ...data.draft,
            ui_config: { ...initial.ui_config, ...(data.draft.ui_config as Editor['ui_config']) }
          } as Editor);
        }
      })
      .catch(() => setStatus('Modo local: API indisponível'))
      .finally(() => setLoading(false));
  }, [companyId]);

  const update = useCallback(
    (change: (current: Editor) => Editor) => {
      if (!canEdit) return;
      setEditor((current) => {
        const next = change(current);
        setStatus('Alterações pendentes');
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(async () => {
          if (!companyId) return;
          setStatus('Salvando...');
          try {
            await quoteFormApi.save(companyId, {
              ui_config: next.ui_config,
              steps: next.steps,
              thank_you_config: next.thank_you_config
            });
            setStatus('Salvo');
          } catch {
            setStatus('Não foi possível salvar');
          }
        }, 800);
        return next;
      });
    },
    [companyId, canEdit]
  );

  const addField = () =>
    update((current) => ({
      ...current,
      steps: current.steps.map((step, index) =>
        index
          ? step
          : {
              ...step,
              fields: [
                ...step.fields,
                { id: `field-${Date.now()}`, label: 'Nova pergunta', type: 'text', required: false }
              ]
            }
      )
    }));

  const previewStyle = useMemo(
    () => ({ '--quote-primary': editor.ui_config.primary_color } as React.CSSProperties),
    [editor.ui_config.primary_color]
  );

  const publish = async () => {
    if (!companyId) return;
    setStatus('Publicando...');
    try {
      await quoteFormApi.publish(companyId);
      setStatus('Publicado');
    } catch {
      setStatus('Falha ao publicar');
    }
  };

  const statusLabel = useMemo(() => {
    if (status === 'Salvo') return '✓ Todas as alterações salvas';
    if (status === 'Salvando...') return 'Salvando alterações...';
    if (status === 'Alterações pendentes') return 'Alterações pendentes...';
    return status;
  }, [status]);

  return (
    <RoleBasedDashboardLayout activeTab="quote-form">
      <div className="mx-auto max-w-7xl space-y-6" style={previewStyle}>
        
        {/* ZONA A — Toolbar */}
        <div className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span>Oportunidades</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-primary">Formulário de Orçamento</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">Formulário de Orçamento</h1>
            <p className="text-sm text-muted-foreground">
              Configure a experiência que seus clientes verão ao solicitar um orçamento.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full animate-pulse-subtle">
              {statusLabel || 'Pronto'}
            </span>
            <Button
              onClick={publish}
              disabled={!canEdit || loading}
              className="bg-primary hover:bg-primary/95 text-white shadow-md transition-all font-semibold"
            >
              <Send className="mr-2 h-4 w-4" />
              Publicar
            </Button>
          </div>
        </div>

        {/* Feature Guard Card */}
        {!canEdit && (
          <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/10">
            <CardContent className="flex items-center gap-3 p-5">
              <Lock className="text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <b className="text-amber-900 dark:text-amber-200">Recurso disponível no plano elegível</b>
                <p className="text-xs text-amber-700/80 dark:text-amber-400/80">Faça upgrade para personalizar e publicar seu formulário.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_420px] items-start">
          
          {/* ZONA B — Editor Panel */}
          <div className="space-y-6">
            <Card className="shadow-sm border border-slate-200/80 dark:border-slate-800">
              <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50 p-4">
                <div className="flex gap-2">
                  <Button
                    variant={tab === 'questions' ? 'default' : 'outline'}
                    onClick={() => setTab('questions')}
                    size="sm"
                    className="font-semibold"
                  >
                    <ListTodo className="mr-1.5 h-4 w-4" />
                    Perguntas
                  </Button>
                  <Button
                    variant={tab === 'appearance' ? 'default' : 'outline'}
                    onClick={() => setTab('appearance')}
                    size="sm"
                    className="font-semibold"
                  >
                    <Palette className="mr-1.5 h-4 w-4" />
                    Aparência
                  </Button>
                  <Button
                    variant={tab === 'analytics' ? 'default' : 'outline'}
                    onClick={() => setTab('analytics')}
                    size="sm"
                    className="font-semibold"
                  >
                    <BarChart3 className="mr-1.5 h-4 w-4" />
                    Métricas
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin h-6 w-6 text-primary" />
                  </div>
                ) : tab === 'questions' ? (
                  <div className="space-y-4">
                    {!canEdit && (
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-300 p-3 rounded-lg border border-amber-200/50 mb-2">
                        <Lock className="h-3.5 w-3.5 shrink-0" />
                        <span>Perguntas em modo de visualização. Faça upgrade para editar.</span>
                      </div>
                    )}
                    {editor.steps.map((step, index) => (
                      <div className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-950 shadow-sm" key={step.id}>
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase text-muted-foreground">Nome do Passo</label>
                          <Input
                            value={step.title}
                            disabled={!canEdit}
                            onChange={(e) =>
                              update((c) => ({
                                ...c,
                                steps: c.steps.map((s, i) => (i === index ? { ...s, title: e.target.value } : s))
                              }))
                            }
                            className="font-medium"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-bold uppercase text-muted-foreground">Campos e Perguntas</label>
                          {step.fields.map((field, fieldIndex) => (
                            <div className="flex gap-2 items-center" key={field.id}>
                              <Input
                                value={field.label}
                                disabled={!canEdit}
                                onChange={(e) =>
                                  update((c) => ({
                                    ...c,
                                    steps: c.steps.map((s, i) =>
                                      i === index
                                        ? {
                                            ...s,
                                            fields: s.fields.map((f, j) =>
                                              j === fieldIndex ? { ...f, label: e.target.value } : f
                                            )
                                          }
                                        : s
                                    )
                                  }))
                                }
                                className="bg-slate-50/50 dark:bg-slate-900/50 text-sm"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={!canEdit}
                                onClick={() =>
                                  update((c) => ({
                                    ...c,
                                    steps: c.steps.map((s, i) =>
                                      i === index ? { ...s, fields: s.fields.filter((_, j) => j !== fieldIndex) } : s
                                    )
                                  }))
                                }
                                className="hover:bg-red-50 hover:text-red-500 shrink-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>

                        <Button variant="outline" size="sm" onClick={addField} disabled={!canEdit} className="w-full mt-2 border-dashed">
                          <Plus className="mr-1.5 h-4 w-4" />
                          Adicionar pergunta
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : tab === 'appearance' ? (
                  <div className="space-y-5">
                    {!canEdit && (
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-300 p-3 rounded-lg border border-amber-200/50 mb-2">
                        <Lock className="h-3.5 w-3.5 shrink-0" />
                        <span>Aparência em modo de visualização. Faça upgrade para editar.</span>
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-foreground">Cor primária da marca</label>
                      <div className="flex gap-3 items-center">
                        <Input
                          type="color"
                          value={editor.ui_config.primary_color}
                          disabled={!canEdit}
                          onChange={(e) =>
                            update((c) => ({ ...c, ui_config: { ...c.ui_config, primary_color: e.target.value } }))
                          }
                          className="h-10 w-16 p-1 cursor-pointer shrink-0 border-2 rounded-lg"
                        />
                        <Input
                          type="text"
                          value={editor.ui_config.primary_color}
                          disabled={!canEdit}
                          onChange={(e) =>
                            update((c) => ({ ...c, ui_config: { ...c.ui_config, primary_color: e.target.value } }))
                          }
                          className="font-mono uppercase text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold">URL do logo da empresa</label>
                      <Input
                        value={editor.ui_config.logo_url}
                        disabled={!canEdit}
                        onChange={(e) => update((c) => ({ ...c, ui_config: { ...c.ui_config, logo_url: e.target.value } }))}
                        placeholder="https://..."
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold">Título de conclusão</label>
                      <Input
                        value={editor.thank_you_config.title}
                        disabled={!canEdit}
                        onChange={(e) =>
                          update((c) => ({ ...c, thank_you_config: { ...c.thank_you_config, title: e.target.value } }))
                        }
                        className="text-sm"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <input
                        type="checkbox"
                        id="show-progress"
                        checked={editor.ui_config.show_progress_bar}
                        disabled={!canEdit}
                        onChange={(e) =>
                          update((c) => ({ ...c, ui_config: { ...c.ui_config, show_progress_bar: e.target.checked } }))
                        }
                        className="h-4.5 w-4.5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer disabled:opacity-50"
                      />
                      <label htmlFor="show-progress" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer disabled:opacity-50">
                        Exibir barra de progresso do funil
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border">
                        <span className="text-xs font-semibold text-muted-foreground block uppercase">Visualizações</span>
                        <span className="text-2xl font-black text-foreground mt-1 block">342</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border">
                        <span className="text-xs font-semibold text-muted-foreground block uppercase">Enviados</span>
                        <span className="text-2xl font-black text-foreground mt-1 block">33</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border flex justify-between items-center">
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground block uppercase">Conversão</span>
                        <span className="text-2xl font-black text-primary mt-1 block">38%</span>
                      </div>
                      <span className="text-xs text-green-500 font-bold bg-green-500/10 px-2 py-0.5 rounded-full">+2.4% vs mês ant.</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ZONA C — Live Preview Column (Sticky) */}
          <div className="lg:sticky lg:top-24 self-start space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-primary" />
                Live Preview
              </span>
              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                <Button
                  size="icon"
                  variant={deviceView === 'desktop' ? 'secondary' : 'ghost'}
                  onClick={() => setDeviceView('desktop')}
                  className="h-7 w-7 rounded-md"
                  title="Desktop View"
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant={deviceView === 'tablet' ? 'secondary' : 'ghost'}
                  onClick={() => setDeviceView('tablet')}
                  className="h-7 w-7 rounded-md"
                  title="Tablet View"
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant={deviceView === 'mobile' ? 'secondary' : 'ghost'}
                  onClick={() => setDeviceView('mobile')}
                  className="h-7 w-7 rounded-md"
                  title="Mobile View"
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Device Wrapper */}
            <div className="flex justify-center transition-all duration-300">
              <div
                className={cn(
                  "border border-slate-200/80 dark:border-slate-800 rounded-3xl bg-slate-950 p-3 shadow-xl transition-all duration-300 flex flex-col items-center",
                  deviceView === 'desktop' ? 'w-full' : deviceView === 'tablet' ? 'w-[380px]' : 'w-[310px]'
                )}
              >
                {/* Simulated smartphone notch or status bar details */}
                <div className="w-full flex justify-between items-center px-4 pb-2.5 text-[10px] text-white/50 font-mono">
                  <span>9:41</span>
                  <div className="w-16 h-4 bg-black rounded-full absolute left-1/2 transform -translate-x-1/2 hidden md:block" />
                  <div className="flex items-center gap-1">
                    <span>5G</span>
                    <span className="w-3 h-2 bg-white/70 rounded-xs" />
                  </div>
                </div>

                 <div className={cn(
                  "w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 rounded-2xl p-5 space-y-6 shadow-inner min-h-[360px] flex flex-col justify-between relative overflow-hidden",
                  !canEdit && "pt-8"
                )}>
                  {!canEdit && (
                    <div className="absolute top-0 right-0 left-0 bg-amber-500/10 dark:bg-amber-500/20 border-b border-amber-500/20 py-1.5 text-center text-[9px] font-bold text-amber-700 dark:text-amber-400 select-none tracking-wider uppercase z-10">
                      Demonstração
                    </div>
                  )}
                  <div className="space-y-5">
                    {/* Header preview */}
                    <div className="text-center space-y-3">
                      {logoToShow ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={logoToShow}
                          alt="Logo Preview"
                          className="mx-auto h-12 w-12 rounded-full object-cover border-2 shadow-sm"
                        />
                      ) : (
                        <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                          LOGO
                        </div>
                      )}
                      <div>
                        <h2 className="text-lg font-bold tracking-tight">{editor.steps[0]?.title || 'Título'}</h2>
                        <p className="text-xs text-muted-foreground mt-1">Preencha seus dados para receber uma proposta.</p>
                      </div>
                    </div>

                    {/* Progress bar preview */}
                    {editor.ui_config.show_progress_bar && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                          <span>Progresso</span>
                          <span>25%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-300" style={{ backgroundColor: editor.ui_config.primary_color, width: '25%' }} />
                        </div>
                      </div>
                    )}

                    {/* Fields Preview */}
                    <div className="space-y-4">
                      {editor.steps[0]?.fields.map((field) => (
                        <div key={field.id} className="space-y-1">
                          <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                            {field.label}
                            {field.required && <span className="text-destructive ml-0.5">*</span>}
                          </label>
                          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-2.5 text-xs text-slate-400">
                            Digite sua resposta...
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    className="w-full text-white shadow-sm font-semibold"
                    style={{ backgroundColor: editor.ui_config.primary_color }}
                  >
                    <Check className="mr-1.5 h-4 w-4" />
                    Continuar
                  </Button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </RoleBasedDashboardLayout>
  );
}
