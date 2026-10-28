'use client';

import {
  Search,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  User,
  Briefcase,
  Inbox as InboxEmptyIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { InboxThreadSummary } from '@/lib/api/sales/types';

interface InboxThreadListProps {
  threads: InboxThreadSummary[];
  selectedThreadId: number | null;
  onSelectThread: (id: number) => void;
  statusFilter: string;
  onSelectStatusFilter: (status: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading?: boolean;
}

const STATUS_FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: 'open', label: 'Abertas' },
  { id: 'pending', label: 'Pendentes' },
  { id: 'resolved', label: 'Resolvidas' },
];

function formatMessageDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) {
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  const diffTime = Math.abs(now.getTime() - d.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays <= 7) {
    return d.toLocaleDateString('pt-BR', { weekday: 'short' });
  }

  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function InboxThreadList({
  threads,
  selectedThreadId,
  onSelectThread,
  statusFilter,
  onSelectStatusFilter,
  searchQuery,
  onSearchChange,
  isLoading = false,
}: InboxThreadListProps) {
  return (
    <div className="w-full lg:w-96 border-r border-slate-200 bg-white flex flex-col shrink-0 select-none overflow-hidden h-full">
      {/* Search Bar & Tabs */}
      <div className="p-3 border-b border-slate-200 space-y-2.5 bg-slate-50/50">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Pesquisar remetente, assunto..."
            className="pl-8 pr-7 h-8 text-xs bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#0F62FE]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
          {STATUS_FILTERS.map((f) => {
            const isActive = statusFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onSelectStatusFilter(f.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {isLoading ? (
          <div className="p-3 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2 p-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-3.5 w-48" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center h-64 text-slate-400">
            <InboxEmptyIcon className="w-8 h-8 stroke-[1.5] mb-2 text-slate-300" />
            <p className="text-xs font-semibold text-slate-700">Nenhuma conversa encontrada</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
              {searchQuery
                ? 'Nenhum resultado para os termos pesquisados.'
                : 'Mensagens sincronizadas do provedor aparecerão nesta pasta.'}
            </p>
          </div>
        ) : (
          threads.map((thread) => {
            const isSelected = selectedThreadId === thread.id;
            const isUnread = thread.unread_count > 0;
            const isOutbound = thread.direction === 'outbound';

            return (
              <button
                key={thread.id}
                type="button"
                onClick={() => onSelectThread(thread.id)}
                className={`w-full text-left p-3 transition-colors relative flex flex-col gap-1 border-l-2 ${
                  isSelected
                    ? 'bg-sky-50/70 border-l-[#0F62FE]'
                    : isUnread
                      ? 'bg-white hover:bg-slate-50 border-l-sky-500 font-semibold'
                      : 'bg-white hover:bg-slate-50/80 border-l-transparent'
                }`}
              >
                {/* Header: Sender/Direction & Date */}
                <div className="flex items-center justify-between gap-1 text-[11px]">
                  <div className="flex items-center gap-1.5 truncate">
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-[#0F62FE] shrink-0" />
                    )}
                    {isOutbound ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <ArrowDownLeft className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    )}
                    <span
                      className={`truncate text-[12px] ${
                        isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                      }`}
                    >
                      {thread.sender_name || thread.sender_email || 'Sem Remetente'}
                    </span>
                    {(thread.messages_count ?? thread.message_count) > 1 && (
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        ({thread.messages_count ?? thread.message_count})
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">
                    {formatMessageDate(thread.last_message_at)}
                  </span>
                </div>

                {/* Subject */}
                <p
                  className={`text-[12px] truncate leading-snug ${
                    isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-800'
                  }`}
                >
                  {thread.subject || '(Sem assunto)'}
                </p>

                {/* Snippet */}
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {thread.snippet || 'Mensagem sem conteúdo textual pré-visualizável.'}
                </p>

                {/* Footer Badges: Status & CRM Entity */}
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {thread.status === 'pending' && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-amber-300 bg-amber-50 text-amber-800">
                      Pendente
                    </Badge>
                  )}
                  {thread.status === 'resolved' && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-emerald-300 bg-emerald-50 text-emerald-800">
                      Resolvida
                    </Badge>
                  )}
                  {thread.status === 'archived' && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-slate-300 bg-slate-100 text-slate-600">
                      Arquivada
                    </Badge>
                  )}

                  {thread.contact_name && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-sm truncate max-w-[140px]">
                      <User className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                      <span className="truncate">{thread.contact_name}</span>
                    </span>
                  )}

                  {thread.opportunity_title && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-sky-700 bg-sky-50 border border-sky-100 px-1.5 py-0.5 rounded-sm truncate max-w-[150px]">
                      <Briefcase className="w-2.5 h-2.5 text-sky-600 shrink-0" />
                      <span className="truncate">{thread.opportunity_title}</span>
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
