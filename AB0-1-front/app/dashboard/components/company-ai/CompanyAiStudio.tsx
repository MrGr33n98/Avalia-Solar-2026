'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { track } from '@/lib/analytics/lazy';

type WindowSlot = { start: string; end: string };
type WeekHours = Record<string, WindowSlot[]>;
type AssistantConfig = {
  enabled: boolean;
  greeting: string;
  timezone: string;
  weekly_hours: WeekHours;
  exceptions: Record<string, WindowSlot[]>;
  workflow_version?: number | null;
};
type DraftResponse = { id: number; status: string; version_number: number; validation_errors: string[] };
type WorkflowOption = { key: string; label: string };
type WorkflowNode = {
  id: string;
  type: string;
  text?: string;
  options?: WorkflowOption[];
  action_key?: string;
  source?: string;
};
type WorkflowEdge = { from: string; to: string; choice?: string };
type WorkflowDefinition = { start_node_id: string; nodes: WorkflowNode[]; edges: WorkflowEdge[] };

const DAYS = [
  ['monday', 'Seg'], ['tuesday', 'Ter'], ['wednesday', 'Qua'],
  ['thursday', 'Qui'], ['friday', 'Sex'], ['saturday', 'Sáb'], ['sunday', 'Dom']
] as const;

const defaultHours = (): WeekHours => Object.fromEntries(
  DAYS.map(([key]) => [key, ['saturday', 'sunday'].includes(key) ? [] : [{ start: '09:00', end: '18:00' }]])
);

export function buildStarterWorkflow(greeting: string, menu: 'all' | 'catalog' | 'contact'): WorkflowDefinition {
  const choices = [
    ...(menu === 'contact' ? [] : [
      { key: 'products', label: 'Produtos e serviços' },
      { key: 'coverage', label: 'Regiões atendidas' },
      { key: 'faq', label: 'Perguntas frequentes' }
    ]),
    ...(menu === 'catalog' ? [] : [{ key: 'quote', label: 'Solicitar orçamento' }])
  ];
  const contentNodes: WorkflowNode[] = choices.map((choice) => ({
    id: choice.key,
    type: choice.key === 'quote' ? 'action' : 'knowledge',
    ...(choice.key === 'quote'
      ? { action_key: 'open_quote_wizard' }
      : { source: choice.key === 'products' ? 'published_products' : choice.key === 'faq' ? 'published_faq' : 'published_profile' })
  }));
  return {
    start_node_id: 'welcome',
    nodes: [
      { id: 'welcome', type: 'message', text: greeting },
      { id: 'intent_menu', type: 'choice', options: choices },
      ...contentNodes,
      { id: 'end', type: 'end' }
    ],
    edges: [
      { from: 'welcome', to: 'intent_menu' },
      ...choices.map((choice) => ({ from: 'intent_menu', to: choice.key, choice: choice.key })),
      ...choices.map((choice) => ({ from: choice.key, to: 'end' }))
    ]
  };
}

export default function CompanyAiStudio({ companyId }: { companyId: string }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('Olá! Como posso ajudar?');
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  const [weeklyHours, setWeeklyHours] = useState<WeekHours>(defaultHours);
  const [exceptions, setExceptions] = useState<Record<string, WindowSlot[]>>({});
  const [menu, setMenu] = useState<'all' | 'catalog' | 'contact'>('all');
  const [draft, setDraft] = useState<DraftResponse | null>(null);
  const [publishedVersion, setPublishedVersion] = useState<number | null>(null);
  const [statusText, setStatusText] = useState('Rascunho');
  const endpoint = useMemo(
    () => `/company_admin/ai_assistant?company_id=${encodeURIComponent(companyId)}`, [companyId]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchApi<AssistantConfig>(endpoint)
      .then((result) => {
        if (cancelled) return;
        setGreeting(result.greeting || 'Olá! Como posso ajudar?');
        setTimezone(result.timezone || 'America/Sao_Paulo');
        setWeeklyHours(result.weekly_hours && Object.keys(result.weekly_hours).length
          ? result.weekly_hours : defaultHours());
        setExceptions(result.exceptions || {});
        setPublishedVersion(result.workflow_version || null);
        setStatusText(result.enabled ? 'Publicado' : 'Rascunho');
      })
      .catch(() => { if (!cancelled) setError('Assistente indisponível. Verifique o plano e a liberação do piloto.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [endpoint]);

  const updateDay = useCallback((day: string, active: boolean) => {
    setWeeklyHours((previous) => ({ ...previous, [day]: active ? [{ start: '09:00', end: '18:00' }] : [] }));
  }, []);
  const updateHour = useCallback((day: string, field: 'start' | 'end', value: string) => {
    setWeeklyHours((previous) => ({
      ...previous,
      [day]: previous[day]?.length
        ? [{ ...previous[day][0], [field]: value }]
        : [{ start: field === 'start' ? value : '09:00', end: field === 'end' ? value : '18:00' }]
    }));
  }, []);

  const save = async () => {
    if (busy || loading) return;
    setBusy(true); setError(null);
    try {
      await fetchApi(endpoint, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assistant: { greeting, timezone, weekly_hours: weeklyHours, exceptions } })
      });
      setStatusText('Configuração salva');
      setDraft(null);
      track('company_ai_config_saved', { company_id: companyId, surface: 'dashboard' });
    } catch {
      setError('Não foi possível salvar. Confira os horários e tente novamente.');
    } finally { setBusy(false); }
  };

  const createDraft = async () => {
    if (busy || loading) return;
    setBusy(true); setError(null);
    try {
      const workflow = buildStarterWorkflow(greeting, menu);
      const response = await fetchApi<DraftResponse>(
        `/company_admin/ai_assistant/draft?company_id=${encodeURIComponent(companyId)}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ definition: workflow }) }
      );
      setDraft(response);
      setStatusText('Aguardando publicação');
      track('company_ai_workflow_draft_created', { company_id: companyId, version: response.version_number });
    } catch { setError('Não foi possível criar o rascunho. Salve a configuração primeiro.'); }
    finally { setBusy(false); }
  };

  const publish = async () => {
    if (!draft || busy || draft.validation_errors.length) return;
    setBusy(true); setError(null);
    try {
      await fetchApi(
        `/company_admin/ai_assistant/versions/${draft.id}/publish?company_id=${encodeURIComponent(companyId)}`,
        { method: 'POST' }
      );
      setPublishedVersion(draft.version_number);
      setDraft(null);
      setStatusText('Publicado');
      track('company_ai_workflow_published_ui', { company_id: companyId, version: draft.version_number });
    } catch {
      setError('Publicação rejeitada. Verifique sua permissão e os requisitos do workflow.');
    } finally { setBusy(false); }
  };

  if (loading) return <div role="status" className="rounded-xl border bg-white p-5 text-sm">Carregando Assistente IA...</div>;

  return (
    <section aria-label="Assistente IA da empresa" className="min-w-0 space-y-4 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <img src="/assets/chat-widget-avalia-solar.png" alt="" className="h-9 w-9 rounded-full" />
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Assistente IA</h2>
            <p className="text-xs text-slate-500">Atendimento contextual · Dados aprovados · Sem código</p>
          </div>
        </div>
        <span className="rounded-md border border-slate-200 px-2 py-1 text-xs">{statusText}{publishedVersion ? ` · v${publishedVersion}` : ''}</span>
      </div>

      {error && <p role="alert" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}
      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        <div className="space-y-3">
          <div className="space-y-3 rounded-xl border bg-white p-4">
            <h3 className="font-semibold">1. Identidade do atendimento</h3>
            <label htmlFor="company-ai-greeting" className="block text-xs font-medium">Saudação</label>
            <input id="company-ai-greeting" value={greeting} maxLength={160}
              onChange={(event) => setGreeting(event.target.value)}
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" />
            <label htmlFor="company-ai-menu" className="block text-xs font-medium">Menu inicial</label>
            <select id="company-ai-menu" value={menu} onChange={(event) => setMenu(event.target.value as typeof menu)}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm">
              <option value="all">Produtos, cobertura, FAQ e orçamento</option>
              <option value="catalog">Conhecimento e produtos</option>
              <option value="contact">Contato e orçamento</option>
            </select>
          </div>

          <div className="space-y-3 rounded-xl border bg-white p-4">
            <h3 className="font-semibold">2. Horário da equipe humana</h3>
            <label htmlFor="company-ai-timezone" className="block text-xs font-medium">Fuso horário</label>
            <select id="company-ai-timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm">
              <option value="America/Sao_Paulo">Brasília / São Paulo</option>
              <option value="America/Cuiaba">Cuiabá</option>
              <option value="America/Manaus">Manaus</option>
              <option value="America/Belem">Belém</option>
            </select>
            <div className="space-y-2">
              {DAYS.map(([day, label]) => (
                <div key={day} className="grid grid-cols-[62px_1fr_1fr] items-center gap-2">
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" aria-label={`Atendimento ${label}`} checked={Boolean(weeklyHours[day]?.length)}
                      onChange={(event) => updateDay(day, event.target.checked)} />
                    {label}
                  </label>
                  <input aria-label={`Início ${label}`} type="time" disabled={!weeklyHours[day]?.length}
                    value={weeklyHours[day]?.[0]?.start || '09:00'} onChange={(event) => updateHour(day, 'start', event.target.value)}
                    className="h-9 min-w-0 rounded-md border px-1 text-xs" />
                  <input aria-label={`Fim ${label}`} type="time" disabled={!weeklyHours[day]?.length}
                    value={weeklyHours[day]?.[0]?.end || '18:00'} onChange={(event) => updateHour(day, 'end', event.target.value)}
                    className="h-9 min-w-0 rounded-md border px-1 text-xs" />
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">A IA pode responder fora do expediente; transferência humana depende do calendário e da assinatura.</p>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold">3. Fontes de conhecimento</h3>
            <p className="mt-1 text-xs text-slate-500">Somente produtos, FAQ e informações já publicados entram na consulta. PDFs não são lidos antes de revisão e extração segura.</p>
            <a href="/dashboard?tab=materials" className="mt-2 inline-flex h-9 items-center text-sm font-medium text-blue-700 underline">
              Gerenciar materiais e catálogos
            </a>
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold">Prévia do atendimento</h3>
            <p className="mt-1 text-xs text-slate-500">Simulação estática; não executa IA, não cria leads e não consome cota.</p>
            <div className="mt-3 rounded-xl bg-slate-50 p-3">
              <p className="mb-3 text-sm">{greeting || 'Olá!'}</p>
              <div className="space-y-1.5">
                {buildStarterWorkflow(greeting, menu).nodes
                  .find((node) => node.id === 'intent_menu')?.options?.map((option) => (
                    <div key={option.key} className="rounded-md border bg-white px-3 py-2 text-xs">{option.label}</div>
                  ))}
              </div>
            </div>
          </div>
          <div className="space-y-2 rounded-xl border bg-white p-4">
            <h3 className="font-semibold">Publicação controlada</h3>
            <p className="text-xs text-slate-500">O gestor responsável precisa validar o workflow. O assistente público permanece desligado até a liberação global do piloto.</p>
            <button type="button" disabled={busy} onClick={save}
              className="h-10 w-full rounded-md border border-blue-600 text-sm font-semibold text-blue-700 disabled:opacity-50">
              Salvar configuração
            </button>
            <button type="button" disabled={busy} onClick={createDraft}
              className="h-10 w-full rounded-md border text-sm font-semibold disabled:opacity-50">
              Gerar versão de workflow
            </button>
            {draft && (
              <p role="status" className="text-xs">
                Versão {draft.version_number} · {draft.validation_errors.length
                  ? `Erros: ${draft.validation_errors.join(', ')}` : 'Validada para publicação'}
              </p>
            )}
            <button type="button" disabled={busy || !draft || draft.validation_errors.length > 0} onClick={publish}
              className="h-10 w-full rounded-md bg-blue-600 text-sm font-semibold text-white disabled:opacity-40">
              Publicar versão validada
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
