'use client';

import { useState, useRef, type ChangeEvent, type KeyboardEvent } from 'react';
import { Send, Paperclip, X, MessageSquareQuote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { SavedRepliesModal } from './SavedRepliesModal';

export type PendingAttachment = {
  data: string;
  filename: string;
  content_type: string;
};

interface MessageComposerProps {
  onSendMessage: (body: string, attachments?: PendingAttachment[]) => Promise<void>;
  disabled?: boolean;
  allowSavedReplies?: boolean;
  className?: string;
  suggestions?: string[];
}

export function MessageComposer({
  onSendMessage,
  disabled = false,
  allowSavedReplies = true,
  className,
  suggestions,
}: MessageComposerProps) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedRepliesOpen, setSavedRepliesOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        alert('O arquivo deve ter no máximo 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setAttachments((prev) => [
            ...prev,
            {
              data: result,
              filename: file.name,
              content_type: file.type || 'application/octet-stream',
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if ((!trimmed && attachments.length === 0) || disabled || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSendMessage(trimmed, attachments);
      setText('');
      setAttachments([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn('border-t border-slate-200 bg-white p-3 space-y-2', className)}>
      {!!suggestions?.length && <div aria-label="Sugestões de mensagem" className="flex flex-wrap gap-2">{suggestions.map((suggestion) => <button type="button" key={suggestion} disabled={disabled || isSubmitting} onClick={() => { setText(suggestion); messageInputRef.current?.focus(); }} className="min-h-11 rounded-xl border border-blue-200 px-3 py-2 text-left text-xs text-blue-700 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50">{suggestion}</button>)}</div>}
      {/* Attachments preview bar */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 font-medium shadow-2xs"
            >
              <span className="truncate max-w-[140px]">{att.filename}</span>
              <button
                type="button"
                onClick={() => removeAttachment(idx)}
                className="text-slate-400 hover:text-slate-600 rounded-md p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input controls bar */}
      <div className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          multiple
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled || isSubmitting}
          onClick={() => fileInputRef.current?.click()}
          className="h-10 w-10 text-slate-500 hover:text-slate-700 rounded-xl"
          title="Anexar foto ou PDF"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        {allowSavedReplies && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled || isSubmitting}
            onClick={() => setSavedRepliesOpen(true)}
            className="h-10 w-10 text-slate-500 hover:text-blue-600 rounded-xl"
            title="Respostas Rápidas"
          >
            <MessageSquareQuote className="h-5 w-5" />
          </Button>
        )}

        <Input
          ref={messageInputRef}
          aria-label="Mensagem para a empresa"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Conversa bloqueada ou encerrada' : 'Digite sua mensagem...'}
          disabled={disabled || isSubmitting}
          className="min-w-0 flex-1 text-xs rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white h-10 px-3.5"
        />

        <Button
          type="button"
          disabled={(!text.trim() && attachments.length === 0) || disabled || isSubmitting}
          onClick={handleSubmit}
          aria-label="Enviar mensagem"
          className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-2xs font-bold"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {allowSavedReplies && (
        <SavedRepliesModal
          open={savedRepliesOpen}
          onOpenChange={setSavedRepliesOpen}
          onSelectReply={(content) => {
            setText((prev) => (prev ? `${prev}\n${content}` : content));
          }}
        />
      )}
    </div>
  );
}
