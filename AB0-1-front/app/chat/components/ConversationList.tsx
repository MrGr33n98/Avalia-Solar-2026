'use client';

import { useMemo, useState } from 'react';
import { Search, Building2, User, MessageCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getFullImageUrl } from '@/utils/image';
import type { Conversation } from '@/lib/api';
import { SLABadge } from './SLABadge';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: number | null;
  viewerRole: 'User' | 'Company' | 'Unknown';
  isLoading: boolean;
  onSelect: (conversation: Conversation) => void;
  onRefresh?: () => void;
  className?: string;
}

export function ConversationList({
  conversations,
  selectedId,
  viewerRole,
  isLoading,
  onSelect,
  onRefresh,
  className,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'pending_company'>('all');

  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      const isCompanyView = viewerRole === 'Company';
      const name = isCompanyView
        ? conv.user?.name || conv.user_name || 'Cliente'
        : conv.company?.name || conv.company_name || 'Empresa';

      const lastMsgText = typeof conv.last_message === 'string' ? conv.last_message : conv.last_message?.body || '';

      const matchesSearch =
        !searchQuery ||
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lastMsgText.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'unread') {
        const unread = isCompanyView ? conv.company_unread_count : conv.user_unread_count;
        return (unread || 0) > 0;
      }

      if (statusFilter === 'pending_company') {
        return conv.status === 'pending_company';
      }

      return true;
    });
  }, [conversations, searchQuery, statusFilter, viewerRole]);

  return (
    <div className={cn('flex flex-col h-full bg-white border-r border-slate-200', className)}>
      {/* Header & Controls */}
      <div className="p-4 border-b border-slate-100 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            <span>Mensagens</span>
          </h2>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Atualizar conversas"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar conversas..."
            className="pl-9 text-xs rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={cn(
              'px-2.5 py-1 rounded-lg transition-colors',
              statusFilter === 'all'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('unread')}
            className={cn(
              'px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1',
              statusFilter === 'unread'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            <span>Não lidas</span>
          </button>
          {viewerRole === 'Company' && (
            <button
              type="button"
              onClick={() => setStatusFilter('pending_company')}
              className={cn(
                'px-2.5 py-1 rounded-lg transition-colors',
                statusFilter === 'pending_company'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              Aguardando
            </button>
          )}
        </div>
      </div>

      {/* List content */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-2">
            <AlertCircle className="h-8 w-8 text-slate-300 mx-auto" />
            <p>Nenhuma conversa encontrada.</p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = selectedId === conv.id;
            const isCompanyView = viewerRole === 'Company';

            const partnerName = isCompanyView
              ? conv.user?.name || conv.user_name || 'Cliente'
              : conv.company?.name || conv.company_name || 'Empresa';

            const partnerAvatar = isCompanyView
              ? conv.user?.avatar_url || conv.user_avatar_url
              : conv.company?.logo_url || conv.company_logo_url;

            const lastMessageText = typeof conv.last_message === 'string'
              ? conv.last_message
              : conv.last_message?.body || 'Nova conversa iniciada';

            const unreadCount = isCompanyView
              ? conv.company_unread_count || 0
              : conv.user_unread_count || 0;

            const timeLabel = conv.last_message_at
              ? new Date(conv.last_message_at).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '';

            return (
              <div
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={cn(
                  'p-3.5 flex items-start gap-3 cursor-pointer transition-all relative',
                  isSelected
                    ? 'bg-blue-50/70 border-l-4 border-l-blue-600'
                    : 'hover:bg-slate-50/80',
                  unreadCount > 0 && !isSelected && 'bg-amber-50/30'
                )}
              >
                <Avatar className="h-10 w-10 shrink-0 border border-slate-200">
                  <AvatarImage src={getFullImageUrl(partnerAvatar)} alt={partnerName} />
                  <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-bold uppercase">
                    {partnerName.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {partnerName}
                    </h4>
                    {timeLabel && (
                      <span className="text-[10px] text-slate-600 font-medium shrink-0">
                        {timeLabel}
                      </span>
                    )}
                  </div>

                  <p
                    className={cn(
                      'text-xs truncate mt-0.5',
                      unreadCount > 0 ? 'font-bold text-slate-900' : 'text-slate-500 font-normal'
                    )}
                  >
                    {lastMessageText}
                  </p>

                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    {conv.sla_due_at && (
                      <SLABadge slaDueAt={conv.sla_due_at} status={conv.status} />
                    )}

                    {unreadCount > 0 && (
                      <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-black text-white shadow-2xs">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
