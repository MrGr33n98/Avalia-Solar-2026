'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Send,
  AlertCircle,
  Users,
  Edit2,
  Check,
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
  const resolveRecipient = useCallback(() => {
    if (!thread.messages || thread.messages.length === 0) {
      return thread.sender_email || '';
    }
    const lastInbound = [...thread.messages].reverse().find((m) => m.direction === 'inbound');
    return lastInbound?.from_email || thread.messages[thread.messages.length - 1].from_email || thread.sender_email || '';
  }, [thread]);

  const [toEmail, setToEmail] = useState(resolveRecipient());
  const [isEditingTo, setIsEditingTo] = useState(false);
  const [replyAll, setReplyAll] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [ccInput, setCcInput] = useState('');
  const [bccInput, setBccInput] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setToEmail(resolveRecipient());
    setBodyText('');
    setErrorMessage('');
    setShowCc(false);
    setShowBcc(false);
    setCcInput('');
    setBccInput('');
    setIsEditingTo(false);
  }, [thread.id, resolveRecipient]);

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

      // Conversão simples em parágrafos HTML
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
          {isEditingTo ? (
            <div className="flex items-center gap-1.5 flex-1">
              <Input
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="destinatario@cliente.com"
                className="h-6 text-xs"
              />
              <button
                type="button"
                onClick={() => setIsEditingTo(false)}
                className="p-1 text-emerald-600 hover:text-emerald-800"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-slate-800 text-[12px]">{toEmail || 'Remetente'}</span>
              <button
                type="button"
                onClick={() => setIsEditingTo(true)}
                className="text-slate-400 hover:text-slate-600 p-0.5"
                title="Editar destinatário"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}
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

      {/* Editor Textarea */}
      <div className="p-3">
        <Textarea
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          placeholder="Escreva sua resposta comercial aqui..."
          rows={5}
          className="border-0 shadow-none focus-visible:ring-0 text-xs sm:text-[13px] leading-relaxed resize-y p-0 placeholder:text-slate-400"
        />

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="text-[11px] text-slate-400">
            {senderMailboxEmail ? (
              <span>Enviado com credenciais seguras da caixa conectada</span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={isSending}
                className="h-7 text-xs text-slate-600"
              >
                Cancelar
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={handleSend}
              disabled={isSending || !bodyText.trim()}
              className="bg-[#0F62FE] hover:bg-[#0353E9] text-white h-7 text-xs font-semibold px-4 shadow-xs"
            >
              {isSending ? (
                <>Enviando...</>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Enviar Resposta
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
