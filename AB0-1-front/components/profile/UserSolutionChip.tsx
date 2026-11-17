'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building2,
  Cpu,
  Wrench,
  Zap,
  CheckCircle,
  X,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface UserSolution {
  id: string;
  name: string;
  type: 'company' | 'product' | 'service' | 'technology';
  category: string;
  verified: boolean;
  logo_url?: string;
  companyId?: string; // para redirecionar para a avaliação se for empresa
  created_at?: string;
}

interface UserSolutionChipProps {
  solution: UserSolution;
  onRemove: (id: string) => void;
}

export function UserSolutionChip({ solution, onRemove }: UserSolutionChipProps) {
  // Escolher o ícone apropriado baseado no tipo
  const getIcon = () => {
    switch (solution.type) {
      case 'company':
        return <Building2 className="h-4 w-4 text-emerald-600 shrink-0" />;
      case 'product':
        return <Cpu className="h-4 w-4 text-sky-500 shrink-0" />;
      case 'service':
        return <Wrench className="h-4 w-4 text-amber-500 shrink-0" />;
      case 'technology':
        return <Zap className="h-4 w-4 text-purple-500 shrink-0" />;
      default:
        return <Cpu className="h-4 w-4 text-slate-500 shrink-0" />;
    }
  };

  // Mapear o rótulo do tipo de solução
  const getTypeLabel = () => {
    switch (solution.type) {
      case 'company':
        return 'Empresa';
      case 'product':
        return 'Produto';
      case 'service':
        return 'Serviço';
      case 'technology':
        return 'Tecnologia';
      default:
        return 'Solução';
    }
  };

  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm hover:border-gray-300 transition-colors">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50">
        {getIcon()}
      </div>

      <div className="flex flex-col min-w-0">
        <span className="text-xs font-bold text-gray-900 truncate pr-1">
          {solution.name}
        </span>
        <span className="text-[10px] text-gray-400 font-medium">
          {getTypeLabel()} • {solution.category}
        </span>
      </div>

      {solution.verified && (
        <span className="flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 shrink-0">
          <CheckCircle className="h-2.5 w-2.5 fill-emerald-100" />
          Verificado
        </span>
      )}

      <div className="flex items-center gap-1.5 ml-2 border-l border-gray-100 pl-2">
        {solution.type === 'company' && solution.companyId && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 rounded-lg bg-emerald-50 px-2 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 transition-colors"
            asChild
          >
            <Link href={`/companies/${solution.companyId}#review-form`}>
              Avaliar
            </Link>
          </Button>
        )}

        <button
          type="button"
          onClick={() => onRemove(solution.id)}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          title="Remover solução"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
