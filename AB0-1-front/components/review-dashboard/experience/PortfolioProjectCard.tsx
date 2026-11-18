'use client';

import React from 'react';
import { Trash2, MapPin, Calendar, Zap, Globe, Lock } from 'lucide-react';
import { BrandAvatarStack } from '../brands/BrandAvatarStack';
import type { ReviewerPortfolioProject } from '@/lib/api/reviewer-portfolio-projects';

export interface PortfolioProjectCardProps {
  project: ReviewerPortfolioProject;
  onDelete?: (project: ReviewerPortfolioProject) => void;
  isDeleting?: boolean;
}

export function PortfolioProjectCard({
  project,
  onDelete,
  isDeleting = false,
}: PortfolioProjectCardProps) {
  const isPublic = project.visibility === 'public';
  const isVerified = project.verification_status === 'evidence_verified';

  const formattedDate = React.useMemo(() => {
    if (!project.completed_at) return null;
    try {
      const parsed = new Date(project.completed_at);
      if (Number.isNaN(parsed.getTime())) return project.completed_at;
      return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(parsed);
    } catch {
      return project.completed_at;
    }
  }, [project.completed_at]);

  const brandCatalogItems = React.useMemo(() => {
    return project.brands.map((b) => ({
      id: b.brand_id,
      name: b.brand_name,
      slug: b.brand_slug,
      initials: b.initials,
      logo_url: b.logo_url,
      logo_alt: b.brand_name,
      status: 'active' as const,
    }));
  }, [project.brands]);

  return (
    <article
      className="bg-white border border-slate-200 rounded p-4 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-sm"
      data-testid={`portfolio-project-card-${project.id}`}
    >
      <div>
        {/* Top Header: Tipo + Badges */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold text-[#17468D] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wider">
            {project.project_type_label}
          </span>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isVerified ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Verificado
              </span>
            ) : (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                Autodeclarado
              </span>
            )}

            {isPublic ? (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                title="Público no Creator"
              >
                <Globe className="w-2.5 h-2.5" />
                Público
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-50 text-slate-500 border border-slate-200"
                title="Visível apenas para você"
              >
                <Lock className="w-2.5 h-2.5" />
                Privado
              </span>
            )}
          </div>
        </div>

        {/* Título do Projeto */}
        <h3 className="text-sm font-bold text-slate-900 leading-snug mb-2">
          {project.title}
        </h3>

        {/* Localização e Potência */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mb-3">
          {(project.city || project.state) && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {[project.city, project.state].filter(Boolean).join(', ')}
              </span>
            </div>
          )}

          {project.capacity_kwp != null && (
            <div className="flex items-center gap-1 font-semibold text-slate-900">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{project.capacity_kwp.toLocaleString('pt-BR')} kWp</span>
            </div>
          )}

          {formattedDate && (
            <div className="flex items-center gap-1 text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Concluído em {formattedDate}</span>
            </div>
          )}
        </div>

        {project.description && (
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
            {project.description}
          </p>
        )}
      </div>

      {/* Footer: Marcas utilizadas + Ação de excluir */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
        <div className="flex items-center gap-2 min-w-0">
          {brandCatalogItems.length > 0 ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Marcas:</span>
              <BrandAvatarStack brands={brandCatalogItems} maxVisible={3} size={24} />
            </div>
          ) : (
            <span className="text-[11px] text-slate-400 italic">Nenhuma marca vinculada</span>
          )}
        </div>

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(project)}
            disabled={isDeleting}
            aria-label={`Remover projeto ${project.title}`}
            className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </article>
  );
}
