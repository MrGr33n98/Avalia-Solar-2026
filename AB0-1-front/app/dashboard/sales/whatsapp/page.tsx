'use client';

import { useCallback, useEffect, useState } from 'react';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';

type Thread = {
  id: number;
  status: string;
  last_intent: string | null;
  last_message_at: string | null;
  account: { id: number; name: string } | null;
  contact: { id: number; name: string } | null;
};
type Activity = { id: number; direction: string; intent: string; message_type: string; occurred_at: string };

const labels: Record<string, string> = {
  pricing_requested: 'Interesse em planos',
  human_requested: 'Atendimento humano',
  registration_started: 'Cadastro iniciado',
  company_claim_requested: 'Reivindicação de perfil',
};

function formatTime(value: string | null): string {
  if (!value) return 'Sem horário';
  return new Date(value).toLocaleString('pt-BR');
}

export default function WhatsappCrmPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selected, setSelected] = useState<Thread | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/sales/whatsapp_threads', { credentials: 'include' });
      if (!response.ok) throw new Error('Sem permissão ou indisponível.');
      const data: { threads: Thread[] } = await response.json();
      setThreads(data.threads);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const selectThread = async (thread: Thread) => {
    setSelected(thread);
    setActivities([]);
    try {
      const response = await fetch('/api/v1/sales/whatsapp_threads/' + thread.id, { credentials: 'include' });
      if (!response.ok) throw new Error('Não foi possível abrir o histórico.');
      const data: { messages: Activity[] } = await response.json();
      setActivities(data.messages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na consulta.');
    }
  };

  return (
    <SalesLayoutWrapper>
      <section className="mx-auto w-full max-w-6xl space-y-4 px-2 pb-8">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">CRM interno · WhatsApp</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Inteligência conversacional</h1>
            <p className="mt-1 text-sm text-slate-600">Eventos comerciais do número oficial, sem conteúdo de mensagens ou telefones.</p>
          </div>
          <button type="button" onClick={() => void reload()} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">
            Atualizar
          </button>
        </header>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="grid min-h-72 grid-cols-1 gap-3 lg:grid-cols-[minmax(220px,1fr)_minmax(0,2fr)]">
          <section aria-label="Conversas" className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-3 py-2 text-sm font-semibold text-slate-800">Conversas ({threads.length})</div>
            {loading && <p className="p-3 text-sm text-slate-500">Carregando…</p>}
            {!loading && threads.length === 0 && <p className="p-3 text-sm text-slate-500">Nenhum evento comercial registrado.</p>}
            <ul className="max-h-[60vh] overflow-y-auto">
              {threads.map(thread => (
                <li key={thread.id} className="border-b border-slate-100">
                  <button type="button" onClick={() => void selectThread(thread)}
                    className={'w-full px-3 py-3 text-left hover:bg-slate-50 ' + (selected?.id === thread.id ? 'bg-slate-100' : '')}>
                    <span className="block truncate text-sm font-semibold text-slate-900">{thread.account?.name ?? thread.contact?.name ?? 'Contato não vinculado'}</span>
                    <span className="mt-0.5 block text-xs text-slate-600">{labels[thread.last_intent ?? ''] ?? 'Evento comercial'}</span>
                    <span className="mt-1 block text-xs text-slate-400">{formatTime(thread.last_message_at)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section aria-label="Histórico de eventos" className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-3 py-2 text-sm font-semibold text-slate-800">
              {selected ? (selected.account?.name ?? selected.contact?.name ?? 'Contato não vinculado') : 'Histórico comercial'}
            </div>
            {!selected ? <p className="p-4 text-sm text-slate-500">Selecione uma conversa para consultar os eventos reconhecidos.</p> :
              <div className="space-y-2 p-3">
                <p className="text-xs text-slate-500">Somente metadados autorizados. Envio e leitura do conteúdo não estão habilitados nesta versão.</p>
                {activities.map(item => (
                  <article key={item.id} className="rounded-md border border-slate-100 px-3 py-2">
                    <p className="text-sm font-medium text-slate-900">{labels[item.intent] ?? item.intent}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{item.direction} · {item.message_type} · {formatTime(item.occurred_at)}</p>
                  </article>
                ))}
                {activities.length === 0 && <p className="text-sm text-slate-500">Sem eventos registrados para esta conversa.</p>}
              </div>}
          </section>
        </div>
      </section>
    </SalesLayoutWrapper>
  );
}
