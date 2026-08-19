'use client';

import { useMemo } from 'react';
import { Check, CheckCheck, Clock, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getFullImageUrl } from '@/utils/image';
import { RichLinkPreview } from '@/components/chat/RichLinkPreview';
import type { DirectMessage } from '@/lib/api';

export interface OptimisticMessage extends DirectMessage {
  sendStatus?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

interface MessageTimelineProps {
  messages: OptimisticMessage[];
  currentUserId?: number;
  viewerRole: 'User' | 'Company' | 'Unknown';
  partnerName?: string;
  partnerAvatar?: string;
  onRetryMessage?: (message: OptimisticMessage) => void;
  className?: string;
}

export function MessageTimeline({
  messages,
  currentUserId,
  viewerRole,
  partnerName = 'Contato',
  partnerAvatar,
  onRetryMessage,
  className,
}: MessageTimelineProps) {
  const groupedMessages = useMemo(() => {
    const groups: { date: string; items: OptimisticMessage[] }[] = [];
    messages.forEach((msg) => {
      const dateStr = msg.created_at
        ? new Date(msg.created_at).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : 'Hoje';

      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.date === dateStr) {
        lastGroup.items.push(msg);
      } else {
        groups.push({ date: dateStr, items: [msg] });
      }
    });
    return groups;
  }, [messages]);

  const isOwnMessage = (msg: OptimisticMessage) => {
    if (viewerRole === 'Company') {
      return msg.sender_type === 'Company';
    }
    return msg.sender_type === 'User';
  };

  return (
    <div className={cn('flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50', className)}>
      {groupedMessages.map((group, groupIdx) => (
        <div key={groupIdx} className="space-y-3">
          {/* Date Divider */}
          <div className="flex items-center justify-center my-2">
            <span className="bg-slate-200/70 text-slate-600 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {group.date}
            </span>
          </div>

          {group.items.map((msg, msgIdx) => {
            const isSelf = isOwnMessage(msg);
            const status = msg.sendStatus || (msg.read_at ? 'read' : 'delivered');

            return (
              <div
                key={msg.id || msg.client_message_id || msgIdx}
                className={cn('flex items-end gap-2', isSelf ? 'justify-end' : 'justify-start')}
              >
                {!isSelf && (
                  <Avatar className="h-7 w-7 border border-slate-200 mb-1">
                    <AvatarImage src={getFullImageUrl(partnerAvatar)} alt={partnerName} />
                    <AvatarFallback className="text-[10px] bg-slate-200 font-bold text-slate-700">
                      {partnerName.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={cn(
                    'max-w-[78%] sm:max-w-[70%] rounded-2xl p-3 shadow-2xs space-y-1 relative group text-xs leading-relaxed',
                    isSelf
                      ? 'bg-blue-600 text-white rounded-br-2px'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-2px'
                  )}
                >
                  {msg.body && (
                    <div className="whitespace-pre-wrap break-words">{msg.body}</div>
                  )}

                  {/* Rich Link Preview */}
                  {msg.body && <RichLinkPreview text={msg.body} />}

                  {/* Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {msg.attachments.map((att, attIdx) => {
                        const url = getFullImageUrl(att.url);
                        const isImg = att.content_type?.startsWith('image/');
                        return (
                          <div key={attIdx} className="rounded-lg overflow-hidden border border-slate-200/40">
                            {isImg ? (
                              <a href={url} target="_blank" rel="noopener noreferrer">
                                <img src={url} alt={att.filename || 'Anexo'} className="max-h-48 w-full object-cover rounded-md" />
                              </a>
                            ) : (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                  'flex items-center gap-2 p-2 text-xs font-bold transition-colors',
                                  isSelf ? 'bg-blue-700/50 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                                )}
                              >
                                <FileText className="h-4 w-4 shrink-0" />
                                <span className="truncate">{att.filename || 'Baixar arquivo'}</span>
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Time & Status footer */}
                  <div
                    className={cn(
                      'flex items-center justify-end gap-1 text-[9px] font-medium pt-0.5',
                      isSelf ? 'text-blue-100' : 'text-slate-600'
                    )}
                  >
                    <span>
                      {msg.created_at
                        ? new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'agora'}
                    </span>

                    {isSelf && (
                      <span className="ml-0.5 inline-flex items-center">
                        {status === 'sending' && <Clock className="h-3 w-3 animate-spin" />}
                        {status === 'sent' && <Check className="h-3 w-3" />}
                        {status === 'delivered' && <CheckCheck className="h-3 w-3 opacity-70" />}
                        {status === 'read' && <CheckCheck className="h-3 w-3 text-cyan-300 font-bold" />}
                        {status === 'failed' && (
                          <button
                            type="button"
                            onClick={() => onRetryMessage?.(msg)}
                            className="inline-flex items-center gap-0.5 text-red-200 hover:text-white font-bold"
                            title="Falha ao enviar. Clique para reenviar."
                          >
                            <AlertCircle className="h-3 w-3 text-red-300" />
                            <RefreshCw className="h-3 w-3 ml-0.5" />
                          </button>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
