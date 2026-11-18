'use client';

import React from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SolutionIdentityAvatar } from '@/components/review-dashboard/solutions/SolutionIdentityAvatar';

export interface UserSolution {
  id: string;
  name: string;
  type: 'company' | 'product' | 'service' | 'technology';
  category: string;
  verified: boolean;
  logo_url?: string;
  companyId?: string; // para redirecionar para a avaliação se for empresa
  brand_id?: number;
  product_id?: number;
  usage_context?: string;
  brand?: {
    id: number;
    name: string;
    slug: string;
    initials?: string;
    logo_url?: string | null;
  };
  product?: {
    id: number;
    name: string;
    sku?: string;
  };
  created_at?: string;
}

interface UserSolutionChipProps {
  solution: UserSolution;
  onRemove: (id: string) => void;
}

const TYPE_LABELS: Record<UserSolution['type'], string> = {
  company: 'Empresa',
  product: 'Produto',
  service: 'Serviço',
  technology: 'Tecnologia',
};

export function UserSolutionChip({ solution, onRemove }: UserSolutionChipProps) {
  const typeLabel = TYPE_LABELS[solution.type] || 'Solução';

  return (
    <div className="inline-flex items-center gap-2.5 rounded-lg border border-[#DDE5EF] bg-white px-2.5 py-2 transition-colors hover:border-[#A6C8FF]">
      <SolutionIdentityAvatar
        name={solution.name}
        logoUrl={solution.logo_url}
        size="sm"
      />

      <div className="flex min-w-0 flex-col">
        <span className="truncate pr-1 text-xs font-semibold text-[#161616]">
          {solution.name}
        </span>
        <span className="text-[11px] font-medium text-[#525252]">
          {typeLabel} · {solution.category}
        </span>
      </div>

      {solution.verified && (
        <span className="shrink-0 rounded border border-[#A7F0BA] bg-[#DEFBE6] px-1.5 py-0.5 text-[10px] font-semibold text-[#0E6027]">
          Verificada
        </span>
      )}

      <div className="ml-1 flex items-center gap-1 border-l border-[#E0E0E0] pl-2">
        {solution.type === 'company' && solution.companyId && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 rounded border border-[#D0E2FF] bg-[#EDF5FF] px-2 text-[11px] font-semibold text-[#0043CE] transition-colors hover:bg-[#D0E2FF]"
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
          aria-label={`Remover ${solution.name}`}
          className="flex h-7 w-7 items-center justify-center rounded text-[#525252] transition-colors hover:bg-[#FFF1F1] hover:text-[#DA1E28]"
          title="Remover solução"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
