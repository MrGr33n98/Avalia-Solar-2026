'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, CheckCircle2, CircleDashed, Flame, Sparkles } from 'lucide-react';

interface ReputationMilestonesProps {
  approvedReviewsCount: number;
}

interface Milestone {
  target: number;
  label: string;
  description: string;
  benefit: string;
}

const MILESTONES: readonly Milestone[] = [
  {
    target: 1,
    label: 'Primeiro Depoimento',
    description: 'Inicie sua prova social pública na plataforma.',
    benefit: 'Ativa sua nota pública de satisfação.',
  },
  {
    target: 10,
    label: 'Reputação Ativa',
    description: 'Alcançou a marca recomendada para compradores.',
    benefit: 'Empresas com 10+ reviews convertem 3x mais.',
  },
  {
    target: 30,
    label: 'Referência no Setor',
    description: 'Alto volume de validação e confiança comercial.',
    benefit: 'Destaque de solidez frente à concorrência.',
  },
] as const;

export function ReputationMilestones({ approvedReviewsCount }: ReputationMilestonesProps) {
  const current = Math.max(0, approvedReviewsCount || 0);

  // Determina o próximo marco a ser atingido
  const nextMilestone =
    MILESTONES.find((m) => current < m.target) || MILESTONES[MILESTONES.length - 1];

  const previousTarget =
    MILESTONES.slice()
      .reverse()
      .find((m) => current >= m.target)?.target || 0;

  // Cálculo de progresso percentual entre o marco anterior e o próximo
  const progressPercent =
    current >= 30
      ? 100
      : Math.min(
          100,
          Math.max(
            5,
            Math.round(
              ((current - previousTarget) / (nextMilestone.target - previousTarget)) * 100
            )
          )
        );

  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm overflow-hidden border">
      <CardContent className="p-5 md:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-amber-500" />
                Marcos de Reputação
              </span>
              <Badge
                variant="outline"
                className="text-[9px] font-extrabold uppercase rounded-full px-2 py-0.5 border-blue-200 bg-blue-50 text-blue-800"
              >
                {current} {current === 1 ? 'Avaliação Aprovada' : 'Avaliações Aprovadas'}
              </Badge>
            </div>
            <h3 className="text-base font-black text-slate-950">
              {current >= 30
                ? 'Parabéns! Sua empresa atingiu os principais marcos!'
                : `Faltam ${nextMilestone.target - current} para o marco "${nextMilestone.label}"`}
            </h3>
          </div>

          {/* Barra de progresso com contador */}
          <div className="w-full sm:w-56 space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold text-slate-600">
              <span>Progresso</span>
              <span className="text-blue-700">
                {current} / {nextMilestone.target}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3 Cartões de Marcos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {MILESTONES.map((m) => {
            const isAchieved = current >= m.target;
            const isNext = !isAchieved && nextMilestone.target === m.target;

            return (
              <div
                key={m.target}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                  isAchieved
                    ? 'border-emerald-200 bg-emerald-50/40 text-emerald-950'
                    : isNext
                    ? 'border-blue-300 bg-blue-50/30 text-blue-950 ring-1 ring-blue-200'
                    : 'border-slate-200 bg-slate-50/50 text-slate-600'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                      {isAchieved ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : isNext ? (
                        <Sparkles className="h-4 w-4 text-blue-600" />
                      ) : (
                        <CircleDashed className="h-4 w-4 text-slate-400" />
                      )}
                      {m.target} {m.target === 1 ? 'Review' : 'Reviews'}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        isAchieved
                          ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                          : isNext
                          ? 'border-blue-300 bg-blue-100 text-blue-800'
                          : 'border-slate-200 bg-white text-slate-500'
                      }`}
                    >
                      {isAchieved ? 'Concluído' : isNext ? 'Próximo' : 'Pendente'}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-bold">{m.label}</h4>
                  <p className="text-[11px] leading-relaxed text-slate-600">{m.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 text-[10px] font-semibold text-slate-500">
                  {m.benefit}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

