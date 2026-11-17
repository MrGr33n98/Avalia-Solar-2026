'use client';

import React from 'react';
import { ShieldCheck, ExternalLink, CheckCircle2 } from 'lucide-react';

interface LinkedInVerifyButtonProps {
  /** Deve vir exclusivamente de estado persistido e confiável no backend. */
  isVerified: boolean;
  /**
   * Indica se existe um fluxo real de verificação profissional.
   * Login social (OmniAuth) NÃO é verificação profissional.
   */
  available?: boolean;
  onVerify?: () => void;
  className?: string;
}

export function LinkedInVerifyButton({
  isVerified,
  available = false,
  onVerify,
  className = '',
}: LinkedInVerifyButtonProps) {
  if (isVerified) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs ${className}`}
        data-testid="linkedin-verified-badge"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Profissional Verificado</span>
        <svg
          className="w-3.5 h-3.5 fill-current text-[#0A66C2]"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0-.02-3.28 1.64 1.64 0 0 0 .02 3.28M7.86 18.5V10.13H5.07V18.5h2.79Z" />
        </svg>
      </div>
    );
  }

  if (!available || !onVerify) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-50 text-slate-400 border border-slate-200/80 cursor-not-allowed dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-500 ${className}`}
        data-testid="linkedin-verify-unavailable"
      >
        <ShieldCheck className="w-4 h-4" aria-hidden="true" />
        <span>Não verificado</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onVerify}
      className={`group inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-50/80 hover:bg-blue-100/80 text-blue-700 border border-blue-200/80 transition-all duration-200 hover:shadow-xs active:scale-98 ${className}`}
      data-testid="linkedin-verify-button"
    >
      <svg
        className="w-4 h-4 fill-current text-[#0A66C2] group-hover:scale-105 transition-transform"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0-.02-3.28 1.64 1.64 0 0 0 .02 3.28M7.86 18.5V10.13H5.07V18.5h2.79Z" />
      </svg>
      <span>Verificar com LinkedIn</span>
      <ExternalLink className="w-3 h-3 text-blue-500 opacity-70 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

