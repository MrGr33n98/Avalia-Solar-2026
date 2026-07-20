'use client';

import React, { useRef } from 'react';
import { Paperclip, Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PendingAttachment = {
  data: string;
  filename: string;
  content_type: string;
};

interface FloatingChatInputProps {
  reply: string;
  onReplyChange: (text: string) => void;
  onSend: () => void;
  pendingAttachment?: PendingAttachment | null;
  onAttachmentChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment?: () => void;
  sending?: boolean;
  className?: string;
}

export function FloatingChatInput({
  reply,
  onReplyChange,
  onSend,
  pendingAttachment,
  onAttachmentChange,
  onRemoveAttachment,
  sending = false,
  className,
}: FloatingChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSend = (reply.trim().length > 0 || !!pendingAttachment) && !sending;

  return (
    <div className={cn('border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5', className)}>
      {pendingAttachment && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-blue-50 dark:bg-blue-950 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900">
          <span className="truncate max-w-[200px]">{pendingAttachment.filename}</span>
          <button
            onClick={onRemoveAttachment}
            className="rounded p-0.5 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1.5 transition-within focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={onAttachmentChange}
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg"
          title="Anexar arquivo"
        >
          <Paperclip className="h-4 w-4 stroke-[2.2]" />
        </button>

        <textarea
          value={reply}
          onChange={(e) => onReplyChange(e.target.value)}
          placeholder="Escreva uma mensagem..."
          className="max-h-[90px] min-h-[36px] flex-1 resize-none bg-transparent py-1.5 text-xs sm:text-sm outline-none placeholder:text-slate-400 dark:text-slate-100"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (canSend) onSend();
            }
          }}
        />

        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition-all',
            'hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 cursor-pointer disabled:cursor-not-allowed'
          )}
          title="Enviar"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
