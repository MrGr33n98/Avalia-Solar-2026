'use client';

import { useState } from 'react';
import { ChevronDown, Eye, Mail, MousePointer2, Reply } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type {
  SalesEmailEngagement,
  SalesEmailLifecycleEvent,
  SalesTimelineEmail,
} from '@/lib/api/sales/timeline-types';

interface EmailTimelineCardProps {
  email: SalesTimelineEmail;
  engagement: SalesEmailEngagement;
  lifecycle: SalesEmailLifecycleEvent[];
  actorInitials: string;
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

export default function EmailTimelineCard({ email, engagement, lifecycle, actorInitials }: EmailTimelineCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasOpen = engagement.unique_open_signals > 0;
  const hasReply = engagement.replies > 0;

  return (
    <article className="rounded-lg border border-slate-200 bg-white shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
        <Badge className="border border-sky-200 bg-sky-50 text-[10px] text-sky-800">
          <Mail className="mr-1 h-3 w-3" /> {email.direction === 'inbound' ? 'Email recebido' : 'Email enviado'}
        </Badge>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
          {actorInitials}
        </span>
      </div>

      <div className="space-y-2 p-3">
        <h3 className="font-semibold text-slate-900">{email.subject}</h3>
        {email.preview && <p className="text-sm leading-relaxed text-slate-600">{email.preview}</p>}
        <p className="truncate text-xs text-slate-500">Para: {email.to.join(', ')}</p>

        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-2 text-xs text-slate-600">
          <span>✓ {deliveryLabels[email.delivery_status] || email.delivery_status}</span>
          {hasOpen ? (
            <span className="inline-flex items-center gap-1" title="O pixel foi requisitado; isso não confirma leitura humana.">
              <Eye className="h-3 w-3" /> Abertura detectada · {engagement.unique_open_signals} sinal(is) único(s)
            </span>
          ) : (
            <span>Sem sinal de abertura</span>
          )}
          {engagement.proxy_open_signals > 0 && <span>{signalLabels.proxy}</span>}
          {engagement.unique_clicks > 0 && (
            <span className="inline-flex items-center gap-1"><MousePointer2 className="h-3 w-3" /> {engagement.unique_clicks} clique(s) detectado(s)</span>
          )}
          {hasReply && <span className="inline-flex items-center gap-1"><Reply className="h-3 w-3" /> Resposta recebida</span>}
        </div>

        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className="inline-flex items-center gap-1 pt-1 text-xs font-medium text-blue-800 hover:text-blue-950"
        >
          Ver eventos <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
        {expanded && (
          <ol className="space-y-2 border-l border-slate-200 pl-3 text-xs text-slate-600">
            {lifecycle.map((event, index) => (
              <li key={`${event.type}:${event.occurred_at}:${index}`}>
                <span className="font-medium text-slate-800">{lifecycleLabels[event.type] || event.type}</span>
                {event.type === 'open_signal' && event.signal_class && ` · ${signalLabels[event.signal_class] || signalLabels.unknown}`}
                <time className="ml-2 text-slate-400">{new Date(event.occurred_at).toLocaleString('pt-BR')}</time>
              </li>
            ))}
            {lifecycle.length === 0 && <li>Nenhum evento de lifecycle disponível.</li>}
          </ol>
        )}
      </div>
    </article>
  );
}
