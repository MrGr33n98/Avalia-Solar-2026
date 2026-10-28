'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Unplug, ShieldAlert, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { InboxMailbox } from '@/lib/api/sales/types';

interface InboxConnectionBannerProps {
  mailboxes: InboxMailbox[];
  activeMailbox: InboxMailbox | null;
  onSync: (id: number) => Promise<void>;
  onConnectClick: () => void;
}

export default function InboxConnectionBanner({
  mailboxes,
  activeMailbox,
  onSync,
  onConnectClick,
}: InboxConnectionBannerProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  // Sem contas cadastradas
  if (mailboxes.length === 0) {
    return (
      <div className="bg-sky-50 border-b border-sky-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-sky-950">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-sky-100 border border-sky-300 flex items-center justify-center shrink-0 text-sky-700">
            <Unplug className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">
              Nenhuma conta de e-mail conectada para sincronização bidirecional
            </p>
            <p className="text-slate-600 text-[11px] mt-0.5">
              Conecte sua conta Zoho Mail para receber, ler, responder e vincular mensagens diretamente aos seus contatos e oportunidades solares.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={onConnectClick}
            className="bg-[#0F62FE] hover:bg-[#0353E9] text-white font-medium text-xs h-8 px-3 shadow-sm"
          >
            Conectar Zoho Mail
          </Button>
          <Link
            href="/dashboard/sales/settings/email/accounts"
            className="text-[11px] text-slate-600 hover:text-slate-900 underline flex items-center gap-1"
          >
            Configurações <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    );
  }

  // Se houver uma conta ativa com estado crítico
  const target = activeMailbox ?? mailboxes[0];
  const isNeedsReconnect = target.connection_status === 'needs_reconnect' || target.token_expired;
  const isDegraded = target.connection_status === 'degraded';
  const isDisconnected = target.connection_status === 'disconnected';
  const isCurrentlySyncing = target.sync_status === 'syncing' || isSyncing;

  if (isNeedsReconnect || isDisconnected) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs text-amber-950">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <div>
            <span className="font-semibold">Sessão expirada para {target.email}: </span>
            <span className="text-amber-800 text-[11px]">
              O token de acesso foi revogado ou expirou. É necessário reconectar para continuar a sincronização.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={onConnectClick}
            className="border-amber-300 bg-white hover:bg-amber-100 text-amber-900 text-xs h-7 px-2.5"
          >
            Reconectar Conta
          </Button>
        </div>
      </div>
    );
  }

  if (isDegraded) {
    return (
      <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center justify-between gap-2 text-xs text-yellow-950">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-yellow-600 shrink-0" />
          <span className="text-[11px]">
            Conexão com {target.email} instável: {target.sync_error || 'Algumas pastas podem estar pendentes de sincronização.'}
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          disabled={isCurrentlySyncing}
          onClick={async () => {
            setIsSyncing(true);
            try {
              await onSync(target.id);
            } finally {
              setIsSyncing(false);
            }
          }}
          className="text-yellow-800 hover:text-yellow-900 h-6 px-2 text-[11px]"
        >
          <RefreshCw className={`w-3 h-3 mr-1 ${isCurrentlySyncing ? 'animate-spin' : ''}`} />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  // Notificação suave de sincronização em andamento
  if (isCurrentlySyncing) {
    return (
      <div className="bg-sky-50/60 border-b border-sky-100 px-4 py-1.5 flex items-center justify-between text-[11px] text-sky-800">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-3 h-3 text-sky-600 animate-spin shrink-0" />
          <span>Sincronizando novas mensagens com {target.email}...</span>
        </div>
      </div>
    );
  }

  return null;
}
