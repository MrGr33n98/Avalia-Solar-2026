'use client';

import { Eye, MousePointerClick } from 'lucide-react';

export type EmailEngagement = {
  raw_open_signals?: number;
  unique_open_signals?: number;
  human_likely_open_signals?: number;
  proxy_open_signals?: number;
  bot_open_signals?: number;
  scanner_open_signals?: number;
  raw_clicks?: number;
  unique_clicks?: number;
  bot_clicks?: number;
  scanner_clicks?: number;
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Texto do tooltip: deixa explícito que abertura por pixel não prova leitura humana. */
export function openSignalTooltip(e: EmailEngagement): string {
  const automated =
    (e.proxy_open_signals ?? 0) + (e.bot_open_signals ?? 0) + (e.scanner_open_signals ?? 0);
  const base = 'Sinal de abertura = o pixel da mensagem foi solicitado. Não comprova leitura humana.';
  return automated > 0
    ? `${base} ${plural(automated, 'sinal veio', 'sinais vieram')} de proxy, robô ou scanner.`
    : base;
}

export const EVENT_LABELS: Record<string, string> = {
  queued: 'Mensagem enfileirada',
  provider_accepted: 'Aceita pelo provedor',
  sent: 'Mensagem enviada',
  delivered: 'Entrega confirmada',
  delivery_delay: 'Entrega atrasada',
  bounce: 'Rejeitada (bounce)',
  complaint: 'Reclamação de spam',
  reject: 'Rejeitada pelo provedor',
  failed: 'Falha no envio',
  open_signal: 'Pixel de abertura solicitado',
  click: 'Clique em link registrado',
  provider_open_signal: 'Abertura informada pelo provedor',
  provider_click_signal: 'Clique informado pelo provedor',
  replied: 'Resposta recebida',
  unsubscribed: 'Cancelou inscrição',
};

export const SIGNAL_CLASS_LABELS: Record<string, string> = {
  proxy: 'possível proxy',
  bot: 'possível robô',
  scanner: 'possível scanner de segurança',
  human_likely: 'provável humano',
  unknown: 'origem desconhecida',
};

export default function EmailEngagementBadges({
  engagement,
  openCount = 0,
  clickCount = 0,
}: {
  engagement?: EmailEngagement;
  openCount?: number;
  clickCount?: number;
}) {
  const opens = engagement?.raw_open_signals ?? openCount;
  const clicks = engagement?.raw_clicks ?? clickCount;
  if (opens <= 0 && clicks <= 0) return null;

  return (
    <div className="flex items-center gap-2">
      {opens > 0 && (
        <span
          title={openSignalTooltip(engagement ?? {})}
          className="flex items-center gap-1 text-[10px] font-bold text-sky-700"
        >
          <Eye className="h-3 w-3" aria-hidden="true" />
          {plural(opens, 'sinal de abertura', 'sinais de abertura')}
        </span>
      )}
      {clicks > 0 && (
        <span
          title="Clique registrado em link rastreado. Scanners de segurança também podem clicar."
          className="flex items-center gap-1 text-[10px] font-bold text-purple-700"
        >
          <MousePointerClick className="h-3 w-3" aria-hidden="true" />
          {plural(clicks, 'clique', 'cliques')}
        </span>
      )}
    </div>
  );
}
