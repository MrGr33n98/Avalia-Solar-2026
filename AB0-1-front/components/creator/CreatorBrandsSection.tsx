'use client';

import React from 'react';
import { Info, Calendar } from 'lucide-react';
import { BrandAvatar } from '@/components/review-dashboard/brands/BrandAvatar';

export interface PublicCreatorBrand {
  id: string;
  brand_id: number;
  brand_name: string;
  brand_slug: string;
  initials: string;
  logo_url: string | null;
  usage_context: string;
  usage_context_label: string;
  experience_since: string | null;
  verification_status: 'self_declared' | 'under_review' | 'evidence_verified' | 'rejected';
}

export interface CreatorBrandsSectionProps {
  brands?: PublicCreatorBrand[];
  creatorName: string;
}

export function CreatorBrandsSection({
  brands = [],
  creatorName,
}: CreatorBrandsSectionProps) {
  if (!brands || brands.length === 0) {
    return null;
  }

  const firstName = creatorName.split(' ')[0];

  return (
    <section
      id="marcas"
      aria-labelledby="marcas-heading"
      className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_6px_24px_rgba(15,23,42,0.03)]"
      data-testid="creator-brands-section"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 id="marcas-heading" className="text-xl font-bold text-slate-900">
            Fabricantes e Marcas com que {firstName} atua
          </h2>
          <p className="mt-1 text-sm text-[#53627a]">
            Equipamentos e tecnologias solares declarados pelo profissional
          </p>
        </div>
        <span className="text-xs font-semibold text-[#17468D] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded">
          {brands.length} {brands.length === 1 ? 'marca ativa' : 'marcas ativas'}
        </span>
      </div>

      {/* Grid de Marcas Declaradas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {brands.map((b) => {
          const isVerified = b.verification_status === 'evidence_verified';
          return (
            <div
              key={b.id}
              className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-colors"
              data-testid={`creator-brand-item-${b.brand_id}`}
            >
              <BrandAvatar
                name={b.brand_name}
                logoUrl={b.logo_url}
                initials={b.initials}
                size={40}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {b.brand_name}
                  </h3>
                  {isVerified ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Verificada
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      Uso declarado
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 font-medium truncate">
                  {b.usage_context_label}
                </p>

                {b.experience_since && (
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    Desde {b.experience_since.slice(0, 7)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Banner de Transparência e Anti-Slop (Sem alegações falsas) */}
      <div
        className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50/60 border border-blue-100 text-[11px] text-[#17468D] leading-relaxed"
        data-testid="brand-transparency-disclosure"
      >
        <Info className="w-4 h-4 flex-shrink-0 text-[#17468D] mt-0.5" aria-hidden="true" />
        <p>
          <strong>Aviso de transparência:</strong> As marcas e tecnologias listadas acima são declaradas diretamente pelo avaliador em suas experiências práticas e projetos. Elas não constituem credenciamento comercial ou endosso oficial por parte da Avalia Solar, salvo indicação de verificação técnica documental.
        </p>
      </div>
    </section>
  );
}
