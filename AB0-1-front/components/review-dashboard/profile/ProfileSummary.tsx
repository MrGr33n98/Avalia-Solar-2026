'use client';

import { cn } from '@/lib/utils';
import { MapPin, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileSummaryProps {
  greenScore?: number;
  profileCompletion?: number;
  className?: string;
}

export function ProfileSummary({
  greenScore = 0,
  profileCompletion = 0,
  className,
}: ProfileSummaryProps) {
  const { user } = useAuth();

  const name = user?.name || 'Usuário';
  const avatarUrl = user?.avatar_url;
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Derive level from green score
  const level =
    greenScore >= 1500
      ? 'Ouro'
      : greenScore >= 500
        ? 'Prata'
        : greenScore >= 100
          ? 'Bronze'
          : 'Iniciante';

  const specialty = (user as any)?.profession || 'Especialista Solar';
  const location = [user?.city, user?.state].filter(Boolean).join(', ') || 'Brasil';
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
    : '';

  return (
    <div
      className={cn(
        'flex flex-col md:flex-row md:items-center gap-5 rounded-xl border border-slate-200 bg-white p-5',
        className
      )}
    >
      {/* Avatar + info */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Avatar */}
        <div className="relative shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-sm"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-lg font-bold">
              {initials}
            </div>
          )}
          {/* Level badge on avatar */}
          <div className="absolute -bottom-1 -right-1 rounded-full bg-amber-400 p-1">
            <Award className="h-3 w-3 text-white" />
          </div>
        </div>

        {/* Info */}
        <div className="min-w-0">
          <h2 className="text-base font-bold text-slate-900 truncate">{name}</h2>
          <p className="mt-0.5 text-sm text-slate-500 flex items-center gap-2 flex-wrap">
            <span>{specialty}</span>
            <span className="text-slate-300">•</span>
            <span>Nível {level}</span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {location}
            </span>
          </p>
          {/* Level badge */}
          <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            <Award className="h-3 w-3 text-slate-400" />
            Nível {level}
          </div>
          {memberSince && (
            <p className="mt-1 text-xs text-slate-400">Membro desde {memberSince}</p>
          )}
        </div>
      </div>

      {/* Profile progress */}
      <div className="md:w-[260px] shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-slate-700">Progresso do perfil</span>
          <span className="text-sm font-bold text-slate-900">{profileCompletion}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500"
            style={{ width: `${Math.min(profileCompletion, 100)}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          Complete seu perfil e ganhe mais visibilidade.
        </p>
        <a
          href="/review-dashboard/profile"
          className="mt-1 inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          Completar agora →
        </a>
      </div>
    </div>
  );
}
