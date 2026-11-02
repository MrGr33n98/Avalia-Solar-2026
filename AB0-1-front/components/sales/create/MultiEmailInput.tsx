'use client';

import React, { useState, useRef, KeyboardEvent, ClipboardEvent } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MultiEmailInputProps {
  emails: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
  maxEmails?: number;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export default function MultiEmailInput({
  emails,
  onChange,
  placeholder = 'Digite um e-mail e pressione Enter ou vírgula...',
  autoFocus = false,
  disabled = false,
  className,
  maxEmails = 50,
}: MultiEmailInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addEmails = (candidates: string[]) => {
    setInputError(null);
    const validToAdd: string[] = [];
    let hasInvalid = false;

    for (const raw of candidates) {
      const cleaned = raw.trim().toLowerCase();
      if (!cleaned) continue;

      if (!isValidEmail(cleaned)) {
        hasInvalid = true;
        continue;
      }

      if (!emails.includes(cleaned) && !validToAdd.includes(cleaned)) {
        if (emails.length + validToAdd.length < maxEmails) {
          validToAdd.push(cleaned);
        }
      }
    }

    if (validToAdd.length > 0) {
      onChange([...emails, ...validToAdd]);
      setInputValue('');
    }

    if (hasInvalid) {
      setInputError('Um ou mais e-mails inválidos foram ignorados.');
      setTimeout(() => setInputError(null), 3000);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab' || e.key === ' ') {
      if (inputValue.trim()) {
        e.preventDefault();
        addEmails([inputValue]);
      }
    } else if (e.key === 'Backspace' && !inputValue && emails.length > 0) {
      // Remove o último chip se apertar backspace com input vazio
      e.preventDefault();
      onChange(emails.slice(0, emails.length - 1));
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addEmails([inputValue]);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText) return;

    // Divide por vírgula, ponto e vírgula, espaço ou quebra de linha
    const splitTokens = pastedText.split(/[\s,;]+/);
    addEmails(splitTokens);
  };

  const removeEmail = (indexToRemove: number) => {
    if (disabled) return;
    onChange(emails.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="flex-1 min-w-0">
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          'flex flex-wrap items-center gap-1.5 min-h-[32px] w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs transition-colors',
          'focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500',
          disabled && 'bg-slate-50 cursor-not-allowed opacity-75',
          className
        )}
      >
        {emails.map((email, idx) => (
          <span
            key={`${email}-${idx}`}
            className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200/70 border border-slate-200/80 text-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors"
          >
            <span className="truncate max-w-[200px]">{email}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeEmail(idx);
                }}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded-full hover:bg-slate-200"
                title={`Remover ${email}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}

        {emails.length < maxEmails && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (inputError) setInputError(null);
            }}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onPaste={handlePaste}
            placeholder={emails.length === 0 ? placeholder : ''}
            disabled={disabled}
            autoFocus={autoFocus}
            className="flex-1 min-w-[140px] bg-transparent border-none outline-none p-0 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-0"
          />
        )}
      </div>

      {inputError && (
        <p className="flex items-center gap-1 mt-1 text-[11px] text-amber-600 font-medium animate-in fade-in">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{inputError}</span>
        </p>
      )}
    </div>
  );
}

