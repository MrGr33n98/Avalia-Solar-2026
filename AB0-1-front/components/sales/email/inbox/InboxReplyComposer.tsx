'use client';

import { useState } from 'react';
import {
  Send,
  AlertCircle,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { salesApi } from '@/lib/api/sales/client';
import type { InboxMessageItem, InboxThreadDetail } from '@/lib/api/sales/types';

interface InboxReplyComposerProps {
  thread: InboxThreadDetail;
  senderMailboxEmail?: string;
  onReplySent: (newMessage: InboxMessageItem) => void;
  onCancel?: () => void;
}

export default function InboxReplyComposer({
  thread,
  senderMailboxEmail,
  onReplySent,
  onCancel,
}: InboxReplyComposerProps) {
  // Determine default recipient from the last received message or thread sender
  const lastMessage = thread.messages && thread.messages.length > 0
    ? thread.messages[thread.messages.length - 1]
    : null;

  const defaultTo = lastMessage?.from_email || thread.sender_email || '';

  const [toEmail] = useState(defaultTo);
  const [replyAll, setReplyAll] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [ccInput, setCcInput] = useState('');
  const [bccInput, setBccInput] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSend = async () => {
    if (!bodyText.trim()) {
      setErrorMessage('O conteúdo da resposta não pode estar vazio.');
      return;
    }

    setIsSending(true);
    setErrorMessage('');

    try {
      const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `reply-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const ccList = ccInput
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const bccList = bccInput
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      // Simple HTML paragraph conversion
      const bodyHtml = bodyText
        .split('\n')
        .map((paragraph) => paragraph.trim() ? `<p>${paragraph}</p>` : '<br/>')
        .join('');

      const res = await salesApi.sendInboxReply(
        thread.id,
        {
          body_html: bodyHtml,
          body_text: bodyText,
          cc: ccList,
          bcc: bccList,
          reply_all: replyAll,
        },
        idempotencyKey
      );

      setBodyText('');
      onReplySent(res.email_message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao enviar resposta pelo provedor. Verifique a conexão com a caixa Zoho.';
      setErrorMessage(msg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="border border-slate-200 rounded-md bg-white shadow-xs overflow-hidden">
      {/* Header Bar */}
      <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-[#0F62FE]" />
            Responder
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-[11px] text-slate-500">
            De: <strong className="text-slate-700">{senderMailboxEmail || 'Caixa Conectada'}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setReplyAll(!replyAll)}
            className={`text-[11px] px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
              replyAll
                ? 'bg-sky-100 border-sky-300 text-sky-800 font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3 h-3" /> Responder a todos
          </button>
          {!showCc && (
            <button
              type="button"
              onClick={() => setShowCc(true)}
              className="text-[11px] text-slate-500 hover:text-slate-800"
            >
              Cc
            </button>
          )}
          {!showBcc && (
            <button
              type="button"
              onClick={() => setShowBcc(true)}
              className="text-[11px] text-slate-500 hover:text-slate-800"
            >
              Cco
            </button>
          )}
        </div>
      </div>

      {/* Recipients Row */}
      <div className="px-3 py-1.5 border-b border-slate-100 space-y-1 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 w-8">Para:</span>
          <span className="font-medium text-slate-800 text-[12px]">{toEmail || 'Remetente'}</span>
        </div>

        {showCc && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 w-8">Cc:</span>
            <Input
              value={ccInput}
              onChange={(e) => setCcInput(e.target.value)}
              placeholder="copia@empresa.com, outro@empresa.com"
              className="h-6 text-xs border-0 p-0 shadow-none focus-visible:ring-0 bg-transparent"
            />
          </div>
        )}

        {showBcc && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 w-8">Cco:</span>
            <Input
              value={bccInput}
              onChange={(e) => setBccInput(e.target.value)}
              placeholder="auditoria@avaliasolar.com.br"
              className="h-6 text-xs border-0 p-0 shadow-none focus-visible:ring-0 bg-transparent"
            />
          </div>
        )}
      </div>

      {/* Message Textarea */}
      <div className="p-3">
        <Textarea
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          placeholder="Escreva sua resposta..."
          rows={5}
          className="w-full border-0 shadow-none p-0 focus-visible:ring-0 text-xs sm:text-[13px] resize-y placeholder:text-slate-400 leading-relaxed font-sans"
        />
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mx-3 mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Footer / Toolbar & Send Action */}
      <div className="bg-slate-50/70 px-3 py-2 border-t border-slate-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-slate-400">
          <span className="text-[10px] text-slate-400 italic">
            Enviado via API Zoho Mail autenticada
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-xs text-slate-600 hover:text-slate-900 h-8 px-2.5"
            >
              Cancelar
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            disabled={isSending || !bodyText.trim()}
            onClick={handleSend}
            className="bg-[#0F62FE] hover:bg-[#0353E9] text-white font-medium text-xs h-8 px-3.5 shadow-sm flex items-center gap-1.5"
          >
            {isSending ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Enviar Resposta</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
