'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Button } from '@/components/ui/button';

interface GroupCommentComposerProps {
  onSubmit: (body: string) => Promise<void>;
  placeholder?: string;
  isSubmitting?: boolean;
}

export function GroupCommentComposer({ onSubmit, placeholder = 'Escreva um comentário...', isSubmitting = false }: GroupCommentComposerProps) {
  const { user, isAuthenticated } = useAuth();
  const [body, setBody] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [body]);

  // Click outside to collapse if empty
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        body.trim() === ''
      ) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [body]);

  if (!isAuthenticated) {
    return null; // Don't show composer to visitors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (body.trim() === '' || isSubmitting) return;

    try {
      await onSubmit(body);
      setBody('');
      setIsExpanded(false);
    } catch (error) {
      console.error('Failed to submit comment:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div ref={containerRef} className="flex gap-3 py-3 border-t border-slate-100 mt-2">
      <UserAvatar
        name={user?.name}
        src={user?.avatar_url}
        className="h-8 w-8 shrink-0 border border-slate-200/50"
      />
      <form onSubmit={handleSubmit} className="flex-1 space-y-2">
        <textarea
          ref={textareaRef}
          rows={1}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full resize-none text-sm text-slate-800 placeholder-slate-400 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-slate-300 focus:outline-none rounded-xl px-3.5 py-2 transition-all min-h-[38px] max-h-[200px]"
        />

        {isExpanded && (
          <div className="flex justify-end gap-2 transition-all">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setBody('');
                setIsExpanded(false);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 h-8"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={body.trim() === '' || isSubmitting}
              size="sm"
              className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-8"
            >
              {isSubmitting ? 'Comentando...' : 'Comentar'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
