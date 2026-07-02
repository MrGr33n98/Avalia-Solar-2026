'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CheckCircle2, Sun, ShieldCheck, Trophy, Sparkles, MessageCircle, Heart, Zap } from 'lucide-react';

export interface PublicBadge {
  id: string;
  title: string;
  description: string;
}

// Configuração visual de cada badge pública
const BADGE_CONFIGS: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; desc: string }
> = {
  'top_reviewer': {
    label: 'Top Avaliador',
    icon: <Trophy className="h-3 w-3 shrink-0" />,
    color: 'bg-amber-50 text-amber-800 border-amber-200',
    desc: 'Entre os avaliadores mais ativos da comunidade com maior pontuação.',
  },
  'sustainable_guardian': {
    label: 'Guardião Sustentável',
    icon: <ShieldCheck className="h-3 w-3 shrink-0" />,
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    desc: 'Usuário com mais de 500 pontos de reputação e impacto sustentável comprovado.',
  },
  'solar_specialist': {
    label: 'Especialista Solar',
    icon: <Sun className="h-3 w-3 shrink-0" />,
    color: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    desc: 'Especialista verificado em projetos fotovoltaicos e inversores.',
  },
  'verified_customer': {
    label: 'Cliente Verificado',
    icon: <CheckCircle2 className="h-3 w-3 shrink-0" />,
    color: 'bg-blue-50 text-blue-800 border-blue-200',
    desc: 'Possui conta vinculada e validadora de soluções instaladas.',
  },
  'solar_project_validated': {
    label: 'Projeto Solar Validado',
    icon: <Zap className="h-3 w-3 shrink-0" />,
    color: 'bg-orange-50 text-orange-850 border-orange-200',
    desc: 'Avaliação validada com projeto solar ativo e certificado.',
  },
  'mobility_activated': {
    label: 'Mobilidade Ativada',
    icon: <Sparkles className="h-3 w-3 shrink-0" />,
    color: 'bg-purple-50 text-purple-800 border-purple-200',
    desc: 'Utiliza e avalia ativamente carregadores ou veículos elétricos.',
  },
  'helpful_review': {
    label: 'Review Útil',
    icon: <Heart className="h-3 w-3 shrink-0" />,
    color: 'bg-pink-50 text-pink-850 border-pink-200',
    desc: 'Publicou avaliações marcadas como úteis por outros membros.',
  },
};

// Ordem de prioridade para exibir as badges se o usuário não selecionar manualmente
const PUBLIC_BADGES_PRIORITY = [
  'top_reviewer',
  'sustainable_guardian',
  'solar_specialist',
  'verified_customer',
  'solar_project_validated',
  'mobility_activated',
  'helpful_review',
];

interface PublicUserBadgesProps {
  unlockedBadgeIds?: string[];
  maxVisible?: number;
  size?: 'sm' | 'md';
}

export function PublicUserBadges({
  unlockedBadgeIds = [],
  maxVisible = 3,
  size = 'sm',
}: PublicUserBadgesProps) {
  // Filtrar as badges públicas desbloqueadas pelo usuário e ordenar por prioridade
  const visibleBadges = PUBLIC_BADGES_PRIORITY.filter((id) =>
    unlockedBadgeIds.includes(id)
  ).slice(0, maxVisible);

  if (visibleBadges.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1 items-center">
        {visibleBadges.map((id) => {
          const config = BADGE_CONFIGS[id];
          if (!config) return null;

          return (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={`inline-flex items-center gap-1 font-semibold rounded-full select-none cursor-help px-2 border transition-all ${
                    size === 'sm' ? 'py-0.5 text-[9px]' : 'py-1 text-[10px]'
                  } ${config.color}`}
                >
                  {config.icon}
                  {config.label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-900 text-white rounded-lg p-2 text-xs max-w-[200px] shadow-lg border border-slate-800">
                <p className="font-bold text-emerald-400">{config.label}</p>
                <p className="mt-0.5 text-slate-300 leading-normal text-[10px]">{config.desc}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
