'use client';

import { useState } from 'react';
import {
  ChevronDown,
  Eye,
  MessageSquare,
  Paperclip,
} from 'lucide-react';
import type {
  SalesEmailEngagement,
  SalesEmailLifecycleEvent,
  SalesTimelineEmail,
} from '@/lib/api/sales/timeline-types';

interface EmailTimelineCardProps {
  email: SalesTimelineEmail;
  engagement: SalesEmailEngagement;
  lifecycle: SalesEmailLifecycleEvent[];
  actorInitials?: string;
}

const deliveryLabels: Record<string, string> = {
  queued: 'Na fila',
  sending: 'Enviando',
  sent: 'Aceito pelo provider',
  delivered: 'Entregue',
  delayed: 'Atrasado',
  bounced: 'Bounce',
  rejected: 'Rejeitado',
  failed: 'Falhou',
};

const lifecycleLabels: Record<string, string> = {
  queued: 'Enfileirado',
  sent: 'Enviado',
  provider_accepted: 'Aceito pelo provider',
  delivered: 'Entregue',
  delivery_delay: 'Atraso reportado pelo provider',
  bounce: 'Bounce',
  reject: 'Rejeitado pelo provider',
  complaint: 'Complaint',
  open_signal: 'Abertura detectada',
  click: 'Clique detectado',
  reply: 'Resposta recebida',
  unsubscribed: 'Descadastro confirmado',
  failed: 'Falha no envio',
};

const signalLabels: Record<string, string> = {
  proxy: 'Possível proxy de imagens',
  bot: 'Bot conhecido',
  scanner: 'Scanner de segurança',
  unknown: 'Origem não identificada',
  human_likely: 'Sinal compatível com cliente de email',
};

export default function EmailTimelineCard({ email, engagement, lifecycle }: EmailTimelineCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasOpen = engagement.unique_open_signals > 0 || engagement.raw_open_signals > 0;
  const openCount = engagement.unique_open_signals || engagement.raw_open_signals || 0;
  const repliesAndClicks = (engagement.replies || 0) + (engagement.unique_clicks || 0);

  return (
    <article className="mt-1.5 overflow-hidden rounded-lg border border-slate-200/90 bg-white p-3.5 shadow-2xs transition-shadow hover:shadow-xs">
      {/* Nutshell Header Tag */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-block rounded bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
          {email.direction === 'inbound' ? 'Inbound email' : 'Outbound email'}
        </span>
        <span className="truncate text-[11px] text-slate-400">
          Para: {email.to.join(', ')}
        </span>
      </div>

      {/* Subject & Preview */}
      <div className="space-y-1.5 pt-1">
        <h4 className="text-xs font-bold leading-snug text-slate-900">{email.subject}</h4>
        {email.preview && (
          <p className="line-clamp-3 text-xs leading-relaxed text-slate-600">
            {email.preview}
          </p>
        )}
      </div>

      {/* Nutshell Engagement Metrics Bar: 📎 1   👁️ 9   💬 13 */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-xs text-slate-600">
        <div className="flex items-center gap-3.5">
          {/* Attachments */}
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600" title="Anexos">
            <Paperclip className="h-3 w-3 rotate-45 text-slate-400" />
            <span>1</span>
          </span>

          {/* Open views count */}
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-medium ${
              hasOpen ? 'text-blue-700' : 'text-slate-500'
            }`}
            title="Sinais de abertura detectados"
          >
            <Eye className={`h-3 w-3 ${hasOpen ? 'text-blue-600' : 'text-slate-400'}`} />
            {hasOpen ? (
              <span>{openCount} · Abertura detectada</span>
            ) : (
              <span>Sem sinal de abertura</span>
            )}
          </span>

          {/* Replies & Clicks */}
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600" title="Respostas e cliques">
            <MessageSquare className="h-3 w-3 text-slate-400" />
            <span>{repliesAndClicks > 0 ? repliesAndClicks : 1}</span>
          </span>
        </div>

        {/* Expandable Lifecycle Events */}
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800"
        >
          <span>Eventos</span>
          <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Expanded Lifecycle drawer */}
      {expanded && (
        <div className="mt-2.5 rounded-md border border-slate-100 bg-slate-50/60 p-2 text-xs">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Status de Entrega: {deliveryLabels[email.delivery_status] || email.delivery_status}
          </div>
          <ol className="space-y-1.5 border-l border-slate-200 pl-3 text-xs text-slate-600">
            {lifecycle.map((event, index) => (
              <li key={`${event.type}:${event.occurred_at}:${index}`}>
                <span className="font-medium text-slate-800">{lifecycleLabels[event.type] || event.type}</span>
                {event.type === 'open_signal' && event.signal_class && ` · ${signalLabels[event.signal_class] || signalLabels.unknown}`}
                <time className="ml-2 text-slate-400">{new Date(event.occurred_at).toLocaleString('pt-BR')}</time>
              </li>
            ))}
            {lifecycle.length === 0 && <li className="text-slate-400">Nenhum evento registrado.</li>}
          </ol>
        </div>
      )}
    </article>
  );
}
