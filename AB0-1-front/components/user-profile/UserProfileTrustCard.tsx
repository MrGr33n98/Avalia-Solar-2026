'use client';

import React from 'react';
import Image from 'next/image';
import { Pencil, Building2, Calendar, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { TrustAnchor } from './types';
import { LinkedInVerifyButton } from './LinkedInVerifyButton';

export const AVATAR_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

/** Mesmas regras do backend (Api::V1::Reviewer::ProfileController#avatar). */
export function validateAvatarFile(file: File): string | null {
  if (!AVATAR_ACCEPTED_TYPES.includes(file.type)) return 'Formato inválido. Use JPG, PNG ou WEBP.';
  if (file.size > AVATAR_MAX_BYTES) return 'A imagem excede 5 MB.';
  return null;
}

interface UserProfileTrustCardProps {
  trustAnchor: TrustAnchor;
  /** Quando ausente, o botão de alterar foto não é exibido. */
  onUploadAvatar?: (file: File) => Promise<void>;
  className?: string;
}

export function UserProfileTrustCard({
  trustAnchor,
  onUploadAvatar,
  className = '',
}: UserProfileTrustCardProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [avatarError, setAvatarError] = React.useState<string | null>(null);

  const formattedDate = React.useMemo(() => {
    if (!trustAnchor.member_since) return null;
    const date = new Date(trustAnchor.member_since);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
  }, [trustAnchor.member_since]);

  const displayName = trustAnchor.full_name || 'Nome não informado';
  const initial = trustAnchor.full_name.charAt(0).toUpperCase() || '?';
  const hasScore = typeof trustAnchor.trust_score === 'number';

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !onUploadAvatar) return;

    const validationError = validateAvatarFile(file);
    if (validationError) {
      setAvatarError(validationError);
      return;
    }

    setAvatarError(null);
    setUploading(true);
    try {
      await onUploadAvatar(file);
    } catch (error) {
      setAvatarError(error instanceof Error && error.message ? error.message : 'Não foi possível enviar a foto.');
    } finally {
      setUploading(false);
    }
  };

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
                  alt={displayName}
                  fill
                  sizes="96px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400" aria-hidden="true">
                  {initial}
                </span>
              )}
            </div>
          </div>
          {onUploadAvatar && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept={AVATAR_ACCEPTED_TYPES.join(',')}
                className="sr-only"
                onChange={handleFileChange}
                data-testid="avatar-file-input"
                tabIndex={-1}
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                aria-label="Alterar foto de perfil"
                aria-busy={uploading}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:scale-105 transition-all disabled:opacity-60"
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Pencil className="w-3.5 h-3.5" />
                )}
              </button>
            </>
          )}
        </div>
        {avatarError && (
          <p role="alert" className="text-[11px] text-rose-600 mb-2" data-testid="avatar-error">
            {avatarError}
          </p>
        )}

        {/* Nome & Cargo */}
        <h2
          className={`text-lg font-bold leading-tight mb-1 ${
            trustAnchor.full_name ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          {displayName}
        </h2>
        {trustAnchor.role ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 mb-1">
            <Sparkles className="w-3 h-3" />
            <span>{trustAnchor.role}</span>
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Cargo não informado</p>
        )}

        {/* Empresa informada pelo próprio usuário */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium mb-3">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span className={trustAnchor.company ? '' : 'text-slate-400 dark:text-slate-500 font-normal'}>
            {trustAnchor.company || 'Empresa não informada'}
          </span>
        </div>

        {/* Prova de Tempo de Casa */}
        {formattedDate && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-4">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Membro desde {formattedDate}</span>
          </div>
        )}

        {/* Verificação profissional */}
        <div className="w-full mb-5">
          <LinkedInVerifyButton
            isVerified={trustAnchor.is_verified}
            available={false}
            className="w-full justify-center"
          />
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
            {trustAnchor.is_verified
              ? 'Verificação confirmada pela Avalia Solar'
              : 'A verificação profissional ainda não está disponível'}
          </p>
        </div>

        {/* Trust Score: exibido somente quando calculado por fonte confiável */}
        {hasScore && (
          <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800/80" data-testid="trust-score">
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
                style={{ width: `${Math.min(Math.max(trustAnchor.trust_score as number, 0), 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
