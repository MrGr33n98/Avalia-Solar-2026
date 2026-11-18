'use client';

import React from 'react';
import { Lock, Globe, Trash2, Calendar, FileText } from 'lucide-react';
import { BrandAvatar } from './BrandAvatar';
import type { ReviewerBrandUsage } from '@/lib/api/reviewer-brand-usages';

export interface BrandUsageCardProps {
  usage: ReviewerBrandUsage;
  onToggleVisibility?: (usage: ReviewerBrandUsage) => void;
  onDelete?: (usage: ReviewerBrandUsage) => void;
  isUpdating?: boolean;
}

export function BrandUsageCard({
  usage,
  onToggleVisibility,
  onDelete,
  isUpdating = false,
}: BrandUsageCardProps) {
  const isPublic = usage.visibility === 'public';
  const isEvidenceVerified = usage.verification_status === 'evidence_verified';

  // Formatador seguro de data
  const formattedDate = React.useMemo(() => {
    if (!usage.experience_since) return null;
    try {
      const [year, month] = usage.experience_since.split('-');
      if (year && month) {
        return `${month}/${year}`;
      }
      return usage.experience_since;
    } catch {
      return usage.experience_since;
    }
  }, [usage.experience_since]);

  return (
    <article
      className="bg-white border border-slate-200 rounded p-3.5 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-sm"
      data-testid={`brand-usage-card-${usage.id}`}
    >
      <div>
        {/* Top Header: Avatar + Nome + Contexto */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <BrandAvatar
              name={usage.brand.name}
              logoUrl={usage.brand.logo_url}
              initials={usage.brand.initials}
              size={32}
            />
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-slate-900 truncate tracking-tight">
                {usage.brand.name}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                {usage.usage_context_label}
              </p>
            </div>
          </div>

          {/* Badges factuais */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isEvidenceVerified ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Verificada
              </span>
            ) : (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                Uso declarado
              </span>
            )}

            {isPublic ? (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                title="Visível no perfil público do Creator"
              >
                <Globe className="w-2.5 h-2.5" />
                Pública
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-50 text-slate-500 border border-slate-200"
                title="Visível apenas para você"
              >
                <Lock className="w-2.5 h-2.5" />
                Privada
              </span>
            )}
          </div>
        </div>

        {/* Metadados opcionais declarados */}
        {(formattedDate || usage.description) && (
          <div className="text-[11px] text-slate-600 space-y-1 my-2 bg-slate-50 p-2 rounded border border-slate-100">
            {formattedDate && (
              <div className="flex items-center gap-1 text-slate-600">
                <Calendar className="w-3 h-3 text-slate-400 flex-shrink-0" />
                <span>Experiência desde {formattedDate}</span>
              </div>
            )}
            {usage.description && (
              <p className="text-slate-500 line-clamp-2 italic">
                &ldquo;{usage.description}&rdquo;
              </p>
            )}
          </div>
        )}
      </div>

      {/* Ações inferiores */}
      <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => onToggleVisibility?.(usage)}
          className="text-[11px] font-semibold text-[#17468D] hover:underline focus:outline-none flex items-center gap-1 disabled:opacity-50"
        >
          {isPublic ? 'Tornar privada' : 'Exibir no perfil público'}
        </button>

        <button
          type="button"
          disabled={isUpdating}
          onClick={() => onDelete?.(usage)}
          className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors focus:outline-none disabled:opacity-50"
          title="Desvincular marca"
          aria-label={`Desvincular marca ${usage.brand.name}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </article>
  );
}
