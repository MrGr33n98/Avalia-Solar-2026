'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Inbox,
  Send,
  FileText,
  Archive,
  Layers,
  RefreshCw,
  Plus,
  Settings,
  ChevronDown,
  Mail,
  Check,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { InboxMailbox, InboxCounts } from '@/lib/api/sales/types';

interface InboxSidebarProps {
  mailboxes: InboxMailbox[];
  selectedMailboxId: number | null;
  onSelectMailbox: (id: number | null) => void;
  selectedFolder: string;
  onSelectFolder: (folder: string) => void;
  counts: InboxCounts;
  onSync: (id: number) => Promise<void>;
  onOpenConnectModal: () => void;
  isSyncing?: boolean;
}

export default function InboxSidebar({
  mailboxes,
  selectedMailboxId,
  onSelectMailbox,
  selectedFolder,
  onSelectFolder,
  counts,
  onSync,
  onOpenConnectModal,
  isSyncing = false,
}: InboxSidebarProps) {
  const [syncLoading, setSyncLoading] = useState(false);

  const activeMailbox = mailboxes.find((m) => m.id === selectedMailboxId) ?? null;

  const folders = [
    {
      id: 'inbox',
      label: 'Caixa de Entrada',
      icon: Inbox,
      count: counts.inbox ?? 0,
      unreadCount: counts.unread ?? 0,
    },
    {
      id: 'sent',
      label: 'Enviados',
      icon: Send,
      count: counts.sent ?? 0,
    },
    {
      id: 'drafts',
      label: 'Rascunhos',
      icon: FileText,
      count: counts.drafts ?? 0,
    },
    {
      id: 'all',
      label: 'Todas as Mensagens',
      icon: Layers,
      count: counts.all ?? 0,
    },
    {
      id: 'archive',
      label: 'Arquivadas',
      icon: Archive,
      count: counts.archived ?? 0,
    },
  ];

  const handleManualSync = async () => {
    if (!activeMailbox && mailboxes.length === 0) return;
    const targetId = activeMailbox ? activeMailbox.id : mailboxes[0].id;
    setSyncLoading(true);
    try {
      await onSync(targetId);
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <aside className="w-full lg:w-64 border-r border-slate-200 bg-[#F4F4F4]/70 flex flex-col justify-between shrink-0 select-none">
      <div className="p-3 space-y-4">
        {/* Mailbox Selector */}
        <div>
          <label className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase px-1 mb-1.5 block">
            Caixa de E-mail
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors shadow-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      activeMailbox
                        ? activeMailbox.sync_status === 'error'
                          ? 'bg-red-500'
                          : activeMailbox.sync_status === 'syncing' || isSyncing || syncLoading
                            ? 'bg-sky-500 animate-pulse'
                            : activeMailbox.connection_status === 'healthy' && activeMailbox.sync_status === 'healthy'
                              ? 'bg-emerald-500'
                              : 'bg-amber-500'
                        : 'bg-slate-400'
                    }`}
                  />
                  <span className="truncate text-[12px] font-semibold">
                    {activeMailbox ? activeMailbox.email : 'Todas as Caixas'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60 text-xs">
              <DropdownMenuLabel className="text-[11px] text-slate-500 font-semibold uppercase">
                Contas Conectadas
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => onSelectMailbox(null)}
                className="flex items-center justify-between text-xs py-1.5 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-500" /> Todas as contas
                </span>
                {selectedMailboxId === null && <Check className="w-3.5 h-3.5 text-sky-600" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {mailboxes.map((mb) => (
                <DropdownMenuItem
                  key={mb.id}
                  onClick={() => onSelectMailbox(mb.id)}
                  className="flex items-center justify-between text-xs py-1.5 cursor-pointer"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        mb.sync_status === 'error'
                          ? 'bg-red-500'
                          : mb.connection_status === 'healthy' && mb.sync_status === 'healthy'
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                      }`}
                    />
                    <div className="truncate">
                      <p className="font-medium truncate">{mb.email}</p>
                      <p className="text-[10px] text-slate-400">
                        {mb.provider.toUpperCase()} • {mb.provider_region?.toUpperCase() || 'US'} •{' '}
                        {mb.sync_status === 'error' ? 'Erro Sync' : `${mb.stored_messages ?? mb.messages_imported ?? 0} msgs`}
                      </p>
                    </div>
                  </div>
                  {selectedMailboxId === mb.id && <Check className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onOpenConnectModal}
                className="flex items-center gap-2 text-sky-600 font-medium cursor-pointer text-xs py-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Conectar Nova Caixa...
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard/sales/settings/email/accounts"
                  className="flex items-center gap-2 text-slate-600 cursor-pointer text-xs py-1.5"
                >
                  <Settings className="w-3.5 h-3.5" /> Gerenciar Conexões
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Folders List */}
        <div className="space-y-0.5">
          <label className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase px-1 mb-1.5 block">
            Pastas
          </label>
          {folders.map((folder) => {
            const Icon = folder.icon;
            const isSelected = selectedFolder === folder.id;
            return (
              <button
                key={folder.id}
                type="button"
                onClick={() => onSelectFolder(folder.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-[#0F62FE] text-white font-semibold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                  <span className="truncate text-[12px]">{folder.label}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {Boolean(folder.unreadCount && folder.unreadCount > 0) && (
                    <Badge
                      variant="secondary"
                      className={`text-[10px] px-1.5 py-0 h-4 border-none font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#0F62FE] text-white'
                      }`}
                    >
                      {folder.unreadCount}
                    </Badge>
                  )}
                  {folder.count > 0 && !folder.unreadCount && (
                    <span
                      className={`text-[11px] tabular-nums ${
                        isSelected ? 'text-white/80' : 'text-slate-400'
                      }`}
                    >
                      {folder.count}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer / Sync Info */}
      <div className="p-3 border-t border-slate-200/80 bg-white/50 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
          <span className="flex items-center gap-1.5">
            {activeMailbox?.sync_status === 'error' ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                <span className="font-medium text-red-700">Erro na Sync</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-medium text-slate-700">Zoho OAuth 2.0</span>
              </>
            )}
          </span>
          <Button
            size="sm"
            variant="ghost"
            disabled={mailboxes.length === 0 || isSyncing || syncLoading}
            onClick={handleManualSync}
            title="Sincronizar novas mensagens com o provedor"
            className="h-6 w-6 p-0 text-slate-600 hover:text-slate-900"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isSyncing || syncLoading ? 'animate-spin text-sky-600' : ''}`}
            />
          </Button>
        </div>

        {activeMailbox?.last_synced_at && (
          <p className="text-[10px] text-slate-400 px-1">
            Última sync:{' '}
            {new Date(activeMailbox.last_synced_at).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>
    </aside>
  );
}
