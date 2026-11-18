'use client';

import React from 'react';
import { Award, Zap, Sparkles, TrendingUp } from 'lucide-react';
import type { AchievementSummary } from '@/lib/api/achievements';

interface AchievementSummaryHeaderProps {
  summary: AchievementSummary;
}

export function AchievementSummaryHeader({ summary }: AchievementSummaryHeaderProps) {
  return (
    <div className="mb-8 p-6 md:p-8 rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white shadow-lg relative overflow-hidden">
      {/* Background ambient accents */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Title and intro */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Programa de Gamificação</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Conquistas & Badges Oficiais
            </h1>
            <p className="mt-2 text-sm text-blue-100/80 leading-relaxed">
              Acompanhe seu progresso como avaliador, desbloqueie selos exclusivos e valide sua autoridade no mercado solar brasileiro!
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            {/* Unlocked */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-xs text-blue-200 font-medium mb-1">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Conquistados</span>
              </div>
              <div className="text-2xl font-black text-white">
                {summary.unlocked_count}{' '}
                <span className="text-sm font-normal text-blue-200">/ {summary.total_count}</span>
              </div>
            </div>

            {/* Total XP */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-xs text-blue-200 font-medium mb-1">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>XP Acumulado</span>
              </div>
              <div className="text-2xl font-black text-white">
                {summary.xp_total}{' '}
                <span className="text-sm font-normal text-blue-200">XP</span>
              </div>
            </div>

            {/* Completion % */}
            <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-xs text-blue-200 font-medium mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
                <span>Progresso</span>
              </div>
              <div className="text-2xl font-black text-white">
                {summary.completion_percentage}%
              </div>
            </div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-blue-200 mb-2">
            <span>Progresso da Jornada</span>
            <span>{summary.unlocked_count} de {summary.total_count} selos concluídos</span>
          </div>
          <div className="w-full h-2.5 bg-white/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.max(summary.completion_percentage, 4)}%` }}
              role="progressbar"
              aria-valuenow={summary.completion_percentage}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
