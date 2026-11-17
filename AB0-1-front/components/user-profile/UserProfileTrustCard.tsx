'use client';

import React from 'react';
import Image from 'next/image';
import { Pencil, Building2, Calendar, ShieldCheck, Sparkles } from 'lucide-react';
import { TrustAnchor } from './types';
import { LinkedInVerifyButton } from './LinkedInVerifyButton';

interface UserProfileTrustCardProps {
  trustAnchor: TrustAnchor;
  onEditAvatar?: () => void;
  onVerifyLinkedIn?: () => void;
  className?: string;
}

export function UserProfileTrustCard({
  trustAnchor,
  onEditAvatar,
  onVerifyLinkedIn,
  className = '',
}: UserProfileTrustCardProps) {
  const formattedDate = React.useMemo(() => {
    try {
      const date = new Date(trustAnchor.member_since);
      return new Intl.DateTimeFormat('pt-BR', {
        month: 'long',
        year: 'numeric',
      }).format(date);
    } catch {
      return 'Janeiro de 2025';
    }
  }, [trustAnchor.member_since]);

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm relative overflow-hidden ${className}`}
      data-testid="user-profile-trust-card"
    >
      {/* Halo Sutil de Fundo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50/60 to-transparent dark:from-blue-950/20 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col items-center text-center">
        {/* Avatar com Botão de Edição */}
        <div className="relative mb-4 group">
          <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-blue-100 via-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-700 shadow-xs">
            <div className="w-full h-full rounded-full overflow-hidden relative bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              {trustAnchor.avatar_url ? (
                <Image
                  src={trustAnchor.avatar_url}
                  alt={trustAnchor.full_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {trustAnchor.full_name.charAt(0)}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onEditAvatar}
            aria-label="Alterar foto de perfil"
            className="absolute bottom-0 right-0 p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:scale-105 transition-all"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Nome & Cargo B2B */}
        <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight mb-1">
          {trustAnchor.full_name}
        </h2>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 mb-1">
          <Sparkles className="w-3 h-3" />
          <span>{trustAnchor.role}</span>
        </div>

        {/* Empresa Vinculada */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium mb-3">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span>{trustAnchor.company}</span>
        </div>

        {/* Prova de Tempo de Casa */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-4">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Membro desde {formattedDate}</span>
        </div>

        {/* Botão de Verificação LinkedIn */}
        <div className="w-full mb-5">
          <LinkedInVerifyButton
            isVerified={trustAnchor.is_verified}
            onVerify={onVerifyLinkedIn}
            className="w-full justify-center"
          />
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
            Comprove autoridade técnica no setor solar
          </p>
        </div>

        {/* Trust Score Gauge */}
        <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Índice de Confiança
            </span>
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {trustAnchor.trust_score}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(Math.max(trustAnchor.trust_score, 0), 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

