'use client';

import React from 'react';
import { MapPin, Calendar, Zap, Lock, Globe } from 'lucide-react';
import { BrandAvatarStack } from '@/components/review-dashboard/brands/BrandAvatarStack';

export interface PublicCreatorProjectBrand {
  brand_id: number;
  brand_name: string;
  brand_slug: string;
  initials: string;
  logo_url: string | null;
}

export interface PublicCreatorProject {
  id: string;
  title: string;
  project_type: string;
  project_type_label: string;
  city: string | null;
  state: string | null;
  completed_at: string | null;
  capacity_kwp: number | null;
  verification_status: 'self_declared' | 'under_review' | 'evidence_verified' | 'rejected';
  brands: PublicCreatorProjectBrand[];
}

export interface CreatorProjectsSectionProps {
  projects?: PublicCreatorProject[];
  creatorName: string;
}

export function CreatorProjectsSection({
  projects = [],
  creatorName,
}: CreatorProjectsSectionProps) {
  if (!projects || projects.length === 0) {
    return null;
  }

  const firstName = creatorName.split(' ')[0];

  return (
    <section
      id="projetos"
      aria-labelledby="projetos-heading"
      className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_6px_24px_rgba(15,23,42,0.03)]"
      data-testid="creator-projects-section"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 id="projetos-heading" className="text-xl font-bold text-slate-900">
            Portfólio de Instalações e Projetos
          </h2>
          <p className="mt-1 text-sm text-[#53627a]">
            Obras e sistemas executados por {firstName} com as marcas declaradas
          </p>
        </div>
        <span className="text-xs font-semibold text-[#17468D] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded">
          {projects.length} {projects.length === 1 ? 'projeto público' : 'projetos públicos'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {projects.map((p) => {
          const isVerified = p.verification_status === 'evidence_verified';
          const brandItems = p.brands.map((b) => ({
            id: b.brand_id,
            name: b.brand_name,
            slug: b.brand_slug,
            initials: b.initials,
            logo_url: b.logo_url,
            logo_alt: b.brand_name,
            status: 'active' as const,
          }));

          return (
            <article
              key={p.id}
              className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-slate-300 transition-colors flex flex-col justify-between"
              data-testid={`creator-project-card-${p.id}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-semibold text-[#17468D] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wider">
                    {p.project_type_label}
                  </span>
                  {isVerified ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Verificado
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      Autodeclarado
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-2 leading-snug">
                  {p.title}
                </h3>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mb-3">
                  {(p.city || p.state) && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{[p.city, p.state].filter(Boolean).join(', ')}</span>
                    </div>
                  )}

                  {p.capacity_kwp && (
                    <div className="flex items-center gap-1 font-medium text-slate-700">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>{p.capacity_kwp.toFixed(1)} kWp</span>
                    </div>
                  )}

                  {p.completed_at && (
                    <div className="flex items-center gap-1 text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{p.completed_at.slice(0, 7)}</span>
                    </div>
                  )}
                </div>
              </div>

              {brandItems.length > 0 && (
                <div className="pt-2.5 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500">Fabricantes:</span>
                  <BrandAvatarStack brands={brandItems} maxVisible={4} size={24} />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
