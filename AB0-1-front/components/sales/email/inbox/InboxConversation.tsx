'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  Paperclip,
  Download,
  User,
  Send,
  ChevronDown,
  ChevronUp,
  SidebarClose,
  SidebarOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { salesApi } from '@/lib/api/sales/client';
import type { InboxThreadDetail, InboxMessageItem } from '@/lib/api/sales/types';
import InboxReplyComposer from './InboxReplyComposer';

interface InboxConversationProps {
  thread: InboxThreadDetail;
  senderMailboxEmail?: string;
  onBack?: () => void;
  onThreadUpdated: (updated: InboxThreadDetail) => void;
  onReplySent: (message: InboxMessageItem) => void;
  onToggleContext?: () => void;
  isContextOpen?: boolean;
}

export default function InboxConversation({
  thread,
  senderMailboxEmail,
  onBack,
  onThreadUpdated,
  onReplySent,
  onToggleContext,
  isContextOpen = true,
}: InboxConversationProps) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [expandedHeaders, setExpandedHeaders] = useState<Record<number, boolean>>({});

  const toggleHeader = (msgId: number) => {
    setExpandedHeaders((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const updated = await salesApi.updateInboxThread(thread.id, { status: newStatus });
      onThreadUpdated(updated);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFAFA] overflow-hidden select-text">
      {/* Conversation Top Action Bar */}
      <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 truncate">
          {onBack && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onBack}
              className="lg:hidden h-8 w-8 p-0 text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}

          <div className="truncate">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
              {thread.subject || '(Sem assunto)'}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
              <span>{thread.messages?.length ?? 1} mensagem(ns)</span>
              <span>•</span>
              <span className="truncate">
                {thread.sender_name ? `${thread.sender_name} <${thread.sender_email}>` : thread.sender_email}
              </span>
            </div>
          </div>
        </div>

        {/* Status Dropdown & Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                disabled={isUpdatingStatus}
                className="h-7 text-xs border-slate-200 gap-1.5 font-medium shadow-2xs"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    thread.status === 'open'
                      ? 'bg-sky-500'
                      : thread.status === 'pending'
                        ? 'bg-amber-500'
                        : thread.status === 'resolved'
                          ? 'bg-emerald-500'
                          : 'bg-slate-400'
                  }`}
                />
                <span className="capitalize">
                  {thread.status === 'open'
                    ? 'Aberta'
                    : thread.status === 'pending'
                      ? 'Pendente'
                      : thread.status === 'resolved'
                        ? 'Resolvida'
                        : 'Arquivada'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs">
              <DropdownMenuLabel className="text-[10px] uppercase text-slate-400">
                Alterar Status
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleStatusChange('open')}>
                Aberta
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('pending')}>
                Pendente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('resolved')}>
                Resolvida
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleStatusChange('archived')}>
                Arquivada
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {onToggleContext && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onToggleContext}
              title={isContextOpen ? 'Ocultar Contexto CRM' : 'Exibir Contexto CRM'}
              className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800"
            >
              {isContextOpen ? (
                <SidebarClose className="w-4 h-4" />
              ) : (
                <SidebarOpen className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Messages Timeline */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {thread.messages && thread.messages.length > 0 ? (
          thread.messages.map((message, idx) => {
            const isOutbound = message.direction === 'outbound';
            const isHeaderOpen = expandedHeaders[message.id] ?? false;

            return (
              <div
                key={message.id || idx}
                className={`flex flex-col gap-1 ${
                  isOutbound ? 'items-end' : 'items-start'
                }`}
              >
                {/* Message Box */}
                <div
                  className={`w-full max-w-3xl rounded-lg border p-4 space-y-3 transition-shadow shadow-xs ${
                    isOutbound
                      ? 'bg-white border-slate-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  {/* Sender & Timestamp Header */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          isOutbound ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {isOutbound ? (
                          <Send className="w-3.5 h-3.5" />
                        ) : (
                          <User className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900 text-xs">
                            {message.from_name || message.from_email}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {isOutbound ? '(Enviado)' : '(Recebido)'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate max-w-sm">
                          Para: {message.to_email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-slate-400">
                        {message.received_at
                          ? new Date(message.received_at).toLocaleString('pt-BR', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleHeader(message.id)}
                        className="text-slate-400 hover:text-slate-600 p-0.5"
                        title="Detalhes dos cabeçalhos"
                      >
                        {isHeaderOpen ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Headers (RFC Message-ID, Cc, Bcc) */}
                  {isHeaderOpen && (
                    <div className="bg-slate-50 p-2.5 rounded text-[11px] font-mono text-slate-600 space-y-1 border border-slate-200/80">
                      <p>
                        <strong className="text-slate-700">De:</strong> {message.from_email}
                      </p>
                      <p>
                        <strong className="text-slate-700">Para:</strong> {message.to_email}
                      </p>
                      {message.cc && message.cc.length > 0 && (
                        <p>
                          <strong className="text-slate-700">Cc:</strong> {message.cc.join(', ')}
                        </p>
                      )}
                      {message.bcc && message.bcc.length > 0 && (
                        <p>
                          <strong className="text-slate-700">Cco:</strong> {message.bcc.join(', ')}
                        </p>
                      )}
                      {message.provider_message_id && (
                        <p className="truncate">
                          <strong className="text-slate-700">Message-ID:</strong>{' '}
                          {message.provider_message_id}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Message Body */}
                  <div className="text-xs sm:text-[13px] text-slate-800 leading-relaxed space-y-2 whitespace-pre-wrap font-sans">
                    {message.body_text ? (
                      <p>{message.body_text}</p>
                    ) : message.body_html ? (
                      /* eslint-disable-next-line react/no-danger */
                      <div
                        className="prose prose-sm max-w-none text-slate-800"
                        dangerouslySetInnerHTML={{ __html: message.body_html }}
                      />
                    ) : (
                      <p className="text-slate-400 italic">Mensagem sem corpo textual legível.</p>
                    )}
                  </div>

                  {/* Attachments Section */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="border-t border-slate-100 pt-2.5 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Paperclip className="w-3 h-3" />
                        Anexos ({message.attachments.length})
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {message.attachments.map((att, aIdx: number) => (
                          <a
                            key={aIdx}
                            href={att.download_url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded text-[11px] text-slate-700 font-medium"
                          >
                            <Paperclip className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[160px]">
                              {att.filename || att.file_name || 'anexo'}
                            </span>
                            <Download className="w-3 h-3 text-slate-400 ml-1" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            Nenhuma mensagem registrada nesta conversa.
          </div>
        )}

        {/* Embedded Reply Composer at the bottom */}
        <div className="pt-2">
          <InboxReplyComposer
            thread={thread}
            senderMailboxEmail={senderMailboxEmail}
            onReplySent={onReplySent}
          />
        </div>
      </div>
    </div>
  );
}
