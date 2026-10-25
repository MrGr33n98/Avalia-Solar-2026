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
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="border border-sky-200 bg-sky-50 text-[10px] text-sky-800 font-semibold">
            <Mail className="mr-1 h-3 w-3" /> {email.direction === 'inbound' ? 'Email recebido' : 'Email enviado'}
          </Badge>
          {hasOpen && (
            <Badge className="border border-emerald-300 bg-emerald-50 text-[10px] font-bold text-emerald-800 flex items-center gap-1 shadow-2xs">
              <Eye className="h-3 w-3 text-emerald-600" />
              <span>Aberto {engagement.raw_open_signals > 1 ? `(${engagement.raw_open_signals}x)` : ''}</span>
            </Badge>
          )}
          {engagement.unique_clicks > 0 && (
            <Badge className="border border-purple-300 bg-purple-50 text-[10px] font-bold text-purple-800 flex items-center gap-1 shadow-2xs">
              <MousePointer2 className="h-3 w-3 text-purple-600" />
              <span>Clicado ({engagement.unique_clicks}x)</span>
            </Badge>
          )}
        </div>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
          {actorInitials}
        </span>
      </div>

      <div className="space-y-2 p-3">
        <h3 className="font-semibold text-slate-900">{email.subject}</h3>
        {email.preview && <p className="text-sm leading-relaxed text-slate-600">{email.preview}</p>}
        <p className="truncate text-xs text-slate-500">Para: {email.to.join(', ')}</p>

        <div className="flex flex-wrap gap-x-3 gap-y-1.5 border-t border-slate-100 pt-2 text-xs text-slate-600 items-center">
          <span className="text-slate-500 font-medium">✓ {deliveryLabels[email.delivery_status] || email.delivery_status}</span>
          {hasOpen ? (
            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200" title="O pixel foi requisitado; isso não confirma leitura humana.">
              <Eye className="h-3.5 w-3.5 text-emerald-600" /> Abertura detectada · {engagement.unique_open_signals} sinal(is) único(s)
            </span>
          ) : (
            <span className="text-slate-400">Sem sinal de abertura</span>
          )}
          {engagement.proxy_open_signals > 0 && <span className="text-slate-500">{signalLabels.proxy}</span>}
          {engagement.unique_clicks > 0 && (
            <span className="inline-flex items-center gap-1 font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              <MousePointer2 className="h-3.5 w-3.5 text-purple-600" /> {engagement.unique_clicks} clique(s) detectado(s)
            </span>
          )}
          {hasReply && <span className="inline-flex items-center gap-1 font-bold text-blue-700"><Reply className="h-3 w-3" /> Resposta recebida</span>}
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
              <li key={`${event.type}:${event.occurred_at}:${index}`} className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-slate-800 inline-flex items-center gap-1">
                  {event.type === 'open_signal' && <Eye className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                  {event.type === 'click' && <MousePointer2 className="h-3.5 w-3.5 text-purple-600 shrink-0" />}
                  {lifecycleLabels[event.type] || event.type}
                </span>
                {event.type === 'open_signal' && event.signal_class && ` · ${signalLabels[event.signal_class] || signalLabels.unknown}`}
                <time className="ml-auto text-slate-400 text-[11px]">{new Date(event.occurred_at).toLocaleString('pt-BR')}</time>
              </li>
            ))}
            {lifecycle.length === 0 && <li>Nenhum evento de lifecycle disponível.</li>}
          </ol>
        )}
      </div>
    </article>
  );
}
