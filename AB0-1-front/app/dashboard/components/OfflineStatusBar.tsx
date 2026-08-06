'use client';

import { useEffect, useState } from 'react';
import { CloudOff, RefreshCw, Wifi } from 'lucide-react';
import { useOfflineStore } from '@/store/offlineStore';

export default function OfflineStatusBar() {
  const { isOnline, updateAvailable, queueSize, lastSyncAt } = useOfflineStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Offline — banner prioritário
  if (!isOnline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center justify-center gap-2 bg-amber-500 px-3 py-2 text-center text-xs font-semibold text-white"
      >
        <CloudOff className="h-3.5 w-3.5" aria-hidden="true" />
        Você está offline. Alguns dados podem estar desatualizados.
      </div>
    );
  }

  // Atualização disponível
  if (updateAvailable) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center justify-between gap-3 bg-blue-600 px-3 py-2 text-xs font-medium text-white"
      >
        <span className="flex items-center gap-2">
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Nova versão disponível.
        </span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-md bg-white/20 px-2 py-1 text-[11px] font-semibold hover:bg-white/30"
        >
          Atualizar
        </button>
      </div>
    );
  }

  // Sincronizando / fila pendente
  if (queueSize > 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center justify-center gap-2 bg-slate-800 px-3 py-2 text-center text-xs font-medium text-white"
      >
        <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        {queueSize} alteração{queueSize === 1 ? '' : 's'} aguardando sincronização.
      </div>
    );
  }

  // Sincronizado (indicador discreto, visível só no dashboard)
  if (lastSyncAt) {
    return (
      <div
        role="status"
        aria-live="off"
        className="hidden items-center justify-center gap-1.5 bg-emerald-50 px-3 py-1 text-center text-[10px] font-medium text-emerald-700 lg:flex"
      >
        <Wifi className="h-3 w-3" aria-hidden="true" />
        Sincronizado {new Date(lastSyncAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </div>
    );
  }

  return null;
}
