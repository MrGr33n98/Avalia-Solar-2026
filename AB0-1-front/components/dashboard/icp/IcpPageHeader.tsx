'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, HelpCircle, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IcpPageHeaderProps {
  isActive: boolean;
  isDirty: boolean;
  updatedAt?: string;
  onSave: () => void;
  saving: boolean;
  saveSuccess: boolean;
  saveError: boolean;
  onTutorialClick?: () => void;
}

export function IcpPageHeader({
  isActive,
  isDirty,
  updatedAt,
  onSave,
  saving,
  saveSuccess,
  saveError,
  onTutorialClick,
}: IcpPageHeaderProps) {
  const formattedDate = updatedAt
    ? new Date(updatedAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <header className="pb-5 border-b border-[#D8DEE8] flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#1F5EFF]">
            QUALIFICAÇÃO AUTOMÁTICA
          </span>
          {isDirty && (
            <Badge className="bg-[#FFF7E6] text-[#B76E00] hover:bg-[#FFF7E6] border border-[#FFF7E6] rounded-sm text-[8px] font-black uppercase px-2 py-0.5 tracking-wider h-auto leading-none">
              Alterações pendentes
            </Badge>
          )}
        </div>
        
        <h1 className="text-2xl font-black tracking-tight text-[#0B1F3A] uppercase">
          Perfil de Cliente Ideal (ICP)
        </h1>
        
        <p className="text-xs font-medium text-[#526071] max-w-xl">
          Defina seu cliente ideal e aumente a qualidade dos leads recebidos de forma automática.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Status Info */}
        <div className="text-right hidden sm:block space-y-1 mr-2">
          <div className="flex items-center gap-1.5 justify-end">
            <span className={cn('h-2 w-2 rounded-full', isActive ? 'bg-[#14804A]' : 'bg-[#C9362B]')} />
            <span className="text-[10px] font-black uppercase tracking-wider text-[#0B1F3A]">
              {isActive ? 'ICP ATIVO' : 'ICP INATIVO'}
            </span>
          </div>
          {formattedDate && (
            <p className="text-[9px] font-bold text-[#7A8797] uppercase">
              Atualizado: {formattedDate}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        {onTutorialClick && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onTutorialClick}
            className="h-9 px-4 text-xs font-bold rounded-sm border-[#D8DEE8] hover:bg-[#F8FAFC] text-[#526071]"
          >
            <HelpCircle className="h-4 w-4 mr-1.5 shrink-0" />
            Tutorial
          </Button>
        )}

        <Button
          type="button"
          size="sm"
          onClick={onSave}
          disabled={saving || (!isDirty && saveSuccess)}
          className={cn(
            'h-9 px-5 text-xs font-black uppercase tracking-wider rounded-sm text-white transition-all shadow-none',
            saveSuccess && 'bg-[#14804A] hover:bg-[#14804A] pointer-events-none',
            saveError && 'bg-[#C9362B] hover:bg-[#C9362B]',
            !saveSuccess && !saveError && 'bg-[#1F5EFF] hover:bg-[#1749CC]'
          )}
        >
          {saving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Salvando...
            </>
          ) : saveSuccess ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              Salvo com Sucesso
            </>
          ) : saveError ? (
            <>
              <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
              Erro ao Salvar
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Salvar Regras ICP
            </>
          )}
        </Button>
      </div>
    </header>
  );
}
