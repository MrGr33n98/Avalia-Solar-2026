'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { IcpPreviewScore } from '@/types/icp';
import { cn } from '@/lib/utils';

interface IcpSummaryCardProps {
  preview: IcpPreviewScore;
  isActive: boolean;
}

export function IcpSummaryCard({ preview, isActive }: IcpSummaryCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-[#14804A]';
    if (score >= 60) return 'text-[#B76E00]';
    return 'text-[#C9362B]';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-[#14804A]';
    if (score >= 60) return 'bg-[#B76E00]';
    return 'bg-[#C9362B]';
  };

  const getQualityBadgeColor = (quality: string) => {
    if (quality === 'Alta') return 'bg-[#EAF7F0] text-[#14804A]';
    if (quality === 'Média') return 'bg-[#FFF7E6] text-[#B76E00]';
    return 'bg-[#FFF1F0] text-[#C9362B]';
  };

  return (
    <Card className="bg-white border border-[#D8DEE8] rounded-md shadow-none p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#D8DEE8]">
        <h3 className="text-xs font-black uppercase tracking-tight text-[#0B1F3A]">
          Resumo do ICP
        </h3>
        <Badge className={cn('rounded-sm border text-[8px] font-black uppercase px-2 py-0.5 tracking-wider h-auto leading-none', isActive ? 'bg-[#EAF7F0] text-[#14804A] border-[#EAF7F0]' : 'bg-[#FFF1F0] text-[#C9362B] border-[#FFF1F0]')}>
          {isActive ? 'ATIVADO' : 'INATIVO'}
        </Badge>
      </div>

      <CardContent className="p-0 space-y-5">
        {/* Score de Aderência */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#526071]">Score Esperado</span>
            <div className="text-right">
              <span className={cn('text-2xl font-black font-mono leading-none', getScoreColor(preview.score))}>
                {preview.score}
              </span>
              <span className="text-xs text-[#7A8797] font-mono">/100</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-[#F8FAFC] border border-[#D8DEE8] rounded-sm overflow-hidden">
            <div 
              className={cn('h-full transition-all duration-300', getScoreBgColor(preview.score))}
              style={{ width: `${preview.score}%` }}
            />
          </div>
        </div>

        {/* Informações de Métricas com Barras Horizontais */}
        <div className="space-y-3.5 pt-2">
          {/* Qualidade dos Leads */}
          <div className="flex items-center justify-between gap-4 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#526071]">Qualidade dos Leads</span>
            <span className={cn('font-black text-[9px] uppercase px-2 py-0.5 rounded-sm', getQualityBadgeColor(preview.quality))}>
              {preview.quality}
            </span>
          </div>

          {/* Volume Estimado */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#526071]">Volume Estimado</span>
              <span className="font-bold text-[#0B1F3A] uppercase text-[10px]">{preview.volume}</span>
            </div>
            <Progress 
              value={preview.volume === 'Alto' ? 90 : preview.volume === 'Médio' ? 50 : 20} 
              className="h-1 bg-[#F8FAFC] border border-[#D8DEE8] rounded-sm [&>div]:bg-[#526071]" 
            />
          </div>

          {/* Conversão Estimada */}
          <div className="flex items-center justify-between gap-4 text-xs pt-1.5 border-t border-[#D8DEE8]/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#526071]">Taxa de Conversão</span>
            <span className="font-mono font-black text-[#14804A] bg-[#EAF7F0] px-2 py-0.5 rounded-sm text-[10px]">{preview.conversion}</span>
          </div>

          {/* Critérios Ativos */}
          <div className="flex items-center justify-between gap-4 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#526071]">Critérios Ativos</span>
            <span className="font-mono font-bold text-[#0B1F3A]">
              {preview.active_criteria_count} <span className="text-[#7A8797]">de {preview.total_criteria_count}</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
