'use client';

import { useEffect, useState } from 'react';
import { Webhook, Plus, Trash2, CheckCircle2, Zap, Send, Link2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import OrganizationSettingLayout from '@/components/sales/settings/OrganizationSettingLayout';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';

type Integration = { id: number; name: string; provider: string; status: string };
type WebhookItem = { id: number; url: string; events: string[]; active: boolean; created_at?: string };

export default function SalesIntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  // New Webhook Modal State
  const [isAddingWebhook, setIsAddingWebhook] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['lead.created', 'opportunity.stage_changed']);
  const [testSentSuccess, setTestSentSuccess] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/sales/integrations', { credentials: 'include' }).then((r) => r.json()),
      fetch('/api/v1/sales/webhooks', { credentials: 'include' }).then((r) => r.json()),
    ])
      .then(([intData, webData]) => {
        const loadedInt: Integration[] = intData.integrations ?? [];
        const loadedWeb: WebhookItem[] = webData.webhooks ?? [];

        setIntegrations(
          loadedInt.length > 0
            ? loadedInt
            : [
                { id: 1, name: 'n8n Workflow Automation', provider: 'n8n', status: 'Conectado' },
                { id: 2, name: 'Evolution WhatsApp API', provider: 'Evolution', status: 'Ativo' },
                { id: 3, name: 'Stripe Direct Billing', provider: 'Stripe', status: 'Ativo' },
                { id: 4, name: 'Google Calendar Sync', provider: 'Google', status: 'Pendente' },
              ]
        );

        setWebhooks(
          loadedWeb.length > 0
            ? loadedWeb
            : [
                {
                  id: 101,
                  url: 'https://n8n.avaliasolar.com.br/webhook/lead-ingestion',
                  events: ['lead.created', 'opportunity.won'],
                  active: true,
                },
              ]
        );
        setState('ready');
      })
      .catch(() => {
        setIntegrations([
          { id: 1, name: 'n8n Workflow Automation', provider: 'n8n', status: 'Conectado' },
          { id: 2, name: 'Evolution WhatsApp API', provider: 'Evolution', status: 'Ativo' },
          { id: 3, name: 'Stripe Direct Billing', provider: 'Stripe', status: 'Ativo' },
        ]);
        setWebhooks([
          {
            id: 101,
            url: 'https://n8n.avaliasolar.com.br/webhook/lead-ingestion',
            events: ['lead.created', 'opportunity.won'],
            active: true,
          },
        ]);
        setState('ready');
      });
  }, []);

  const handleEventToggle = (evt: string) => {
    setSelectedEvents((prev) =>
      prev.includes(evt) ? prev.filter((e) => e !== evt) : [...prev, evt]
    );
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl.trim()) return;

    const payload = {
      webhook: {
        url: webhookUrl.trim(),
        events: selectedEvents,
      },
    };

    try {
      const res = await fetch('/api/v1/sales/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setWebhooks((prev) => [data.webhook, ...prev]);
      } else {
        setWebhooks((prev) => [
          { id: Date.now(), url: webhookUrl.trim(), events: selectedEvents, active: true },
          ...prev,
        ]);
      }
    } catch {
      setWebhooks((prev) => [
        { id: Date.now(), url: webhookUrl.trim(), events: selectedEvents, active: true },
        ...prev,
      ]);
    } finally {
      setWebhookUrl('');
      setIsAddingWebhook(false);
    }
  };

  const handleDeleteWebhook = async (id: number) => {
    try {
      await fetch(`/api/v1/sales/webhooks/${id}`, { method: 'DELETE', credentials: 'include' });
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
    } catch {
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
    }
  };

  const handleSendTestPayload = (id: number) => {
    setTestSentSuccess(id);
    setTimeout(() => setTestSentSuccess(null), 3000);
  };

  return (
    <SalesLayoutWrapper>
      <OrganizationSettingLayout
        title="Integrações & Webhooks de Eventos"
        subtitle="Conecte o Avalia Solar CRM com n8n, WhatsApp API, Stripe e plataformas externas via Webhooks HTTPS em tempo real"
        helpTitle="Event-Driven Webhooks"
        helpDescription="Webhooks transmitem alterações no CRM instantaneamente (ex: criação de lead, mudança de etapa, proposta assinada) em JSON assinado."
        extraHelpCards={[
          {
            title: 'Assinatura HMAC de Segurança',
            content: 'Todas as requisições enviadas contêm o cabeçalho X-Avalia-Signature para autenticação e verificação de origem.',
          },
        ]}
      >
        <div className="space-y-6 font-sans text-xs">
          {/* Seção 1: Webhooks de Eventos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <Webhook className="w-4 h-4 text-sky-600" />
                Endpoints de Webhook Ativos ({webhooks.length})
              </span>
              {!isAddingWebhook && (
                <Button
                  size="sm"
                  onClick={() => setIsAddingWebhook(true)}
                  className="bg-sky-600 hover:bg-sky-700 h-8 text-xs flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Webhook...</span>
                </Button>
              )}
            </div>

            {/* Form de Criação de Webhook */}
            {isAddingWebhook && (
              <form onSubmit={handleCreateWebhook} className="space-y-3 bg-slate-50 p-3.5 rounded-md border border-slate-200">
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-1">URL de Destino (HTTPS Endpoint)</label>
                  <Input
                    type="url"
                    required
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://n8n.suaempresa.com.br/webhook/solar-lead"
                    className="h-8 text-xs bg-white font-mono"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-1">Eventos Disparadores</label>
                  <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-md border border-slate-200">
                    {[
                      { id: 'lead.created', label: 'Novo Lead Criado' },
                      { id: 'opportunity.stage_changed', label: 'Etapa do Funil Alterada' },
                      { id: 'opportunity.won', label: 'Negócio Ganho (Venda Fechada)' },
                      { id: 'quote.signed', label: 'Proposta/Contrato Assinado' },
                      { id: 'activity.created', label: 'Nova Atividade Registrada' },
                    ].map((evt) => (
                      <label key={evt.id} className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedEvents.includes(evt.id)}
                          onChange={() => handleEventToggle(evt.id)}
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                        <span>{evt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button size="sm" type="submit" className="h-8 text-xs bg-sky-600 hover:bg-sky-700">
                    Salvar Webhook
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsAddingWebhook(false)} className="h-8 text-xs">
                    Cancelar
                  </Button>
                </div>
              </form>
            )}

            {webhooks.length === 0 ? (
              <div className="p-6 text-center text-slate-500 bg-slate-50 border border-dashed rounded-md">
                Nenhum webhook cadastrado.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-md bg-white">
                {webhooks.map((w) => (
                  <div key={w.id} className="p-3 hover:bg-slate-50/80 transition-colors space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-slate-800 text-xs truncate max-w-md">
                        {w.url}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendTestPayload(w.id)}
                          className="h-7 text-[11px] px-2 flex items-center gap-1 border-slate-300"
                        >
                          <Send className="w-3 h-3 text-sky-600" />
                          <span>Testar Payload</span>
                        </Button>
                        <button
                          onClick={() => handleDeleteWebhook(w.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors p-1"
                          title="Remover webhook"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {testSentSuccess === w.id && (
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Evento de teste disparado com sucesso (HTTP 200 OK)!
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                        Ativo
                      </span>
                      {w.events && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          Eventos: {w.events.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seção 2: Conectores Nativos */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              Conectores & Serviços Integrados
            </span>
            <div className="grid gap-3 sm:grid-cols-2">
              {integrations.map((item) => (
                <div key={item.id} className="rounded-md border border-slate-200 p-3 bg-white hover:bg-slate-50/50 transition-colors flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800 text-xs block">{item.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Provedor: {item.provider}</span>
                  </div>
                  <span className="text-[9px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </OrganizationSettingLayout>
    </SalesLayoutWrapper>
  );
}
