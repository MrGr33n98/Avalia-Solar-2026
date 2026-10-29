'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Unplug, ShieldAlert, ExternalLink, CheckCircle2 } from 'lucide-react';
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

  const target = activeMailbox ?? mailboxes[0];
  const isNeedsReconnect = target.connection_status === 'needs_reconnect' || target.token_expired;
  const isDisconnected = target.connection_status === 'disconnected';
  const isSyncError = target.sync_status === 'error';
  const isDegraded = target.connection_status === 'degraded' || target.sync_status === 'degraded';
  const isCurrentlySyncing = target.sync_status === 'syncing' || isSyncing;
  const neverSynced = !target.last_synced_at;

  const triggerManualSync = async () => {
    setIsSyncing(true);
    try {
      await onSync(target.id);
    } finally {
      setIsSyncing(false);
    }
  };

  if (isNeedsReconnect || isDisconnected) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs text-amber-950">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <div>
            <span className="font-semibold">Sessão expirada para {target.email}: </span>
            <span className="text-amber-800 text-[11px]">
              {target.sync_error || 'O token de acesso foi revogado ou expirou. Reconecte a conta para continuar a sincronização.'}
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

  if (isSyncError || isDegraded) {
    return (
      <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center justify-between gap-2 text-xs text-yellow-950">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-yellow-600 shrink-0" />
          <span className="text-[11px]">
            <strong>Sincronização pendente para {target.email}:</strong>{' '}
            {target.sync_error || 'Algumas pastas podem estar pendentes de sincronização.'}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            disabled={isCurrentlySyncing}
            onClick={triggerManualSync}
            className="border-yellow-300 bg-white text-yellow-900 hover:bg-yellow-100 h-6 px-2.5 text-[11px]"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${isCurrentlySyncing ? 'animate-spin' : ''}`} />
            Sincronizar Agora
          </Button>
        </div>
      </div>
    );
  }

  if (isCurrentlySyncing) {
    return (
      <div className="bg-sky-50/70 border-b border-sky-100 px-4 py-1.5 flex items-center justify-between text-[11px] text-sky-800">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-3 h-3 text-sky-600 animate-spin shrink-0" />
          <span>Importando mensagens da conta {target.email} via Zoho Mail API...</span>
        </div>
      </div>
    );
  }

  if (neverSynced) {
    return (
      <div className="bg-sky-50/70 border-b border-sky-200 px-4 py-2 flex items-center justify-between text-xs text-sky-900">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="text-[11px]">
            Conta <strong>{target.email}</strong> autenticada via OAuth 2.0. Clique ao lado para importar suas conversas existentes do Zoho Mail.
          </span>
        </div>
        <Button
          size="sm"
          onClick={triggerManualSync}
          className="bg-[#0F62FE] hover:bg-[#0353E9] text-white h-6 px-2.5 text-[11px]"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Sincronizar Caixa
        </Button>
      </div>
    );
  }

  return null;
}
