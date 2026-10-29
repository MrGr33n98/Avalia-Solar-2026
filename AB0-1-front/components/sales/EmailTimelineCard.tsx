'use client';

import { useState } from 'react';
import {
  ChevronDown,
  CornerDownRight,
  Eye,
  MessageSquare,
  MousePointer2,
  Paperclip,
  Reply,
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
  const [viewTab, setViewTab] = useState<'events' | 'body'>('events');

  const safeEmail = email || ({} as Partial<SalesTimelineEmail>);
  const safeEngagement = engagement || ({} as Partial<SalesEmailEngagement>);
  const safeLifecycle = Array.isArray(lifecycle) ? lifecycle : [];

  const rawOpens = safeEngagement.raw_open_signals || (safeEmail as any).opens_count || 0;
  const uniqueOpens = safeEngagement.unique_open_signals || (rawOpens > 0 ? 1 : 0);
  const hasOpen = uniqueOpens > 0 || rawOpens > 0 || Boolean((safeEmail as any).first_opened_at);
  const openCount = safeEngagement.raw_open_signals || safeEngagement.unique_open_signals || (safeEmail as any).opens_count || 0;
  const repliesAndClicks = (safeEngagement.replies || 0) + (safeEngagement.unique_clicks || (safeEmail as any).clicks_count || 0);
  const hasReply = (safeEngagement.replies || 0) > 0;
  const toList = Array.isArray(safeEmail.to) ? safeEmail.to : [safeEmail.to || (safeEmail as any).to_email].filter(Boolean);

  return (
    <article className="mt-1.5 overflow-hidden rounded-lg border border-slate-200/90 bg-white p-3.5 shadow-2xs transition-shadow hover:shadow-xs">
      {/* Nutshell Header Tag */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-block rounded bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
            {safeEmail.direction === 'inbound' ? 'Inbound email' : 'Outbound email'}
          </span>
          {hasOpen && (
            <span className="inline-flex items-center gap-1 rounded border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 shadow-2xs">
              <Eye className="h-3 w-3 text-emerald-600" />
              <span>Aberto {openCount > 1 ? `(${openCount}x)` : ''}</span>
            </span>
          )}
          {(safeEngagement.unique_clicks || (safeEmail as any).clicks_count || 0) > 0 && (
            <span className="inline-flex items-center gap-1 rounded border border-purple-300 bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-800 shadow-2xs">
              <MousePointer2 className="h-3 w-3 text-purple-600" />
              <span>Clicado ({safeEngagement.unique_clicks || (safeEmail as any).clicks_count}x)</span>
            </span>
          )}
          {(hasReply || (safeEmail.replies && safeEmail.replies.length > 0) || safeEmail.engagement_status === 'replied') && (
            <span className="inline-flex items-center gap-1 rounded border border-blue-300 bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-800 shadow-2xs">
              <Reply className="h-3 w-3 text-blue-600" />
              <span>Respondido {safeEmail.replies && safeEmail.replies.length > 1 ? `(${safeEmail.replies.length})` : ''}</span>
            </span>
          )}
        </div>
        <span className="truncate text-[11px] text-slate-400">
          Para: {toList.join(', ')}
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
        {email.delivery_status === 'failed' && email.error_message && (
          <div className="mt-2 rounded-md bg-rose-50 border border-rose-200/90 p-2 text-[11px] text-rose-800 flex items-start gap-1.5">
            <span className="font-bold shrink-0">Motivo da falha:</span>
            <span className="break-words font-mono text-[10px] leading-relaxed text-rose-900">{email.error_message}</span>
          </div>
        )}
      </div>

      {/* Nutshell Engagement Metrics Bar: 📎 1   👁️ 9   💬 13 */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-xs text-slate-600">
        <div className="flex items-center gap-3.5 flex-wrap">
          {/* Status de entrega */}
          <span
            className={`font-semibold text-[11px] ${
              email.delivery_status === 'failed'
                ? 'text-rose-600'
                : email.delivery_status === 'delivered' || email.delivery_status === 'sent'
                ? 'text-emerald-700'
                : 'text-slate-500'
            }`}
          >
            {email.delivery_status === 'failed' ? '✕' : '✓'} {deliveryLabels[email.delivery_status] || email.delivery_status}
          </span>

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

          {engagement.proxy_open_signals > 0 && (
            <span className="text-slate-400 text-[11px]">{signalLabels.proxy}</span>
          )}

          {hasReply && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700">
              <Reply className="h-3 w-3" /> Resposta recebida
            </span>
          )}
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

      {/* Expanded Lifecycle & Body drawer */}
      {expanded && (
        <div className="mt-2.5 rounded-md border border-slate-100 bg-slate-50/60 p-2.5 text-xs space-y-2">
          {/* Tabs switcher */}
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewTab('events')}
                className={`text-[11px] font-semibold px-2 py-0.5 rounded transition-colors ${
                  viewTab === 'events' ? 'bg-sky-100 text-sky-800' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Eventos ({safeLifecycle.length})
              </button>
              {(safeEmail.body_html || safeEmail.body_text || safeEmail.preview) && (
                <button
                  type="button"
                  onClick={() => setViewTab('body')}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded transition-colors ${
                    viewTab === 'body' ? 'bg-sky-100 text-sky-800' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Mensagem Completa
                </button>
              )}
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {deliveryLabels[safeEmail.delivery_status || ''] || safeEmail.delivery_status}
            </div>
          </div>

          {viewTab === 'events' ? (
            <div>
              {safeEmail.error_message && (
                <div className="mb-2 rounded bg-rose-100/70 p-1.5 font-mono text-[10px] text-rose-900 break-words">
                  <strong>Erro retornado:</strong> {safeEmail.error_message}
                </div>
              )}
              <ol className="space-y-1.5 border-l border-slate-200 pl-3 text-xs text-slate-600">
                {safeLifecycle.map((event, index) => (
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
                {safeLifecycle.length === 0 && <li className="text-slate-400">Nenhum evento registrado.</li>}
              </ol>
            </div>
          ) : (
            <div className="pt-1">
              {safeEmail.body_html ? (
                <div className="rounded border border-slate-200 bg-white overflow-hidden shadow-2xs">
                  <iframe
                    title={`Email ${safeEmail.subject}`}
                    srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#1e293b;line-height:1.5;padding:12px;margin:0;}a{color:#2563eb;}table{border-collapse:collapse;}img{max-width:100%;height:auto;}</style></head><body>${safeEmail.body_html}</body></html>`}
                    className="w-full min-h-[220px] border-0"
                    sandbox="allow-same-origin allow-popups"
                  />
                </div>
              ) : (
                <div className="p-2.5 bg-white rounded border border-slate-200 text-xs leading-relaxed text-slate-800 whitespace-pre-line font-sans">
                  {safeEmail.body_text || safeEmail.preview || 'Sem conteúdo.'}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Respostas encadeadas (Threading / Inbound Replies) */}
      {email.replies && email.replies.length > 0 && (
        <div className="mt-3.5 space-y-2 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
            <CornerDownRight className="h-3.5 w-3.5 text-blue-600" />
            <span>Respostas nesta conversa ({email.replies.length})</span>
          </div>
          <div className="space-y-2 pl-3 border-l-2 border-blue-300">
            {email.replies.map((reply) => (
              <div
                key={reply.id}
                className="rounded-md border border-blue-100/80 bg-blue-50/40 p-2.5 transition-colors hover:bg-blue-50/70"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-slate-800">
                      {reply.from}
                    </span>
                    <span className="inline-block rounded bg-blue-100 px-1.5 py-0.2 text-[10px] font-medium text-blue-800">
                      {reply.classification === 'auto_reply' ? 'Resposta Automática' : 'Resposta do Lead'}
                    </span>
                  </div>
                  <time className="text-[10px] text-slate-400">
                    {new Date(reply.occurred_at).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
                {reply.preview && (
                  <p className="mt-1 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {reply.preview}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
