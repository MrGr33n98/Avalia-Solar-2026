'use client';

import { cn } from '@/lib/utils';
import { MapPin, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface ProfileSummaryProps {
  levelName?: string | null;
  profileCompletion?: number;
  className?: string;
}

export function ProfileSummary({
  levelName = null,
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

  const level = levelName || 'Iniciante';

  const specialty =
    (user as (typeof user & { profession?: string }) | null)?.profession || 'Especialista Solar';
  const location = [user?.city, user?.state].filter(Boolean).join(', ') || 'Brasil';
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
    : '';

  return (
    <Card
      className={cn(
        'flex flex-col md:flex-row md:items-center gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-none',
        className
      )}
    >
      {/* Avatar + info */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Avatar */}
        <div className="relative shrink-0">
          <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={name} className="object-cover" />}
            <AvatarFallback className="bg-blue-100 text-blue-600 font-bold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
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
          <Badge
            variant="outline"
            className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600 bg-white"
          >
            <Award className="h-3 w-3 text-slate-400" />
            Nível {level}
          </Badge>
          {memberSince && <p className="mt-1 text-xs text-slate-400">Membro desde {memberSince}</p>}
        </div>
      </div>

      {/* Profile progress */}
      <div className="md:w-[260px] shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-slate-700">Progresso do perfil</span>
          <span className="text-sm font-bold text-slate-900">{profileCompletion}%</span>
        </div>
        <Progress value={profileCompletion} className="h-2 w-full bg-slate-100" />
        <p className="mt-1.5 text-xs text-slate-400">
          Complete seu perfil e ganhe mais visibilidade.
        </p>
        <Button
          asChild
          variant="link"
          className="mt-1 h-auto p-0 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:no-underline"
        >
          <a href="/review-dashboard/profile">Completar agora →</a>
        </Button>
      </div>
    </Card>
  );
}
