'use client';

import React from 'react';
import Link from 'next/link';
import { Award, ArrowRight } from 'lucide-react';
import { BannerSlot } from '@/components/banners/BannerSlot';
import { ErrorBoundary } from '@/components/error-boundary';
import { CompanyAccessStatus } from './CompanyAccessStatus';
import { AvaliaSolarHouseAd } from './AvaliaSolarHouseAd';
import { cn } from '@/lib/utils';
import type { CompanyAccessSuggestedCompany, CompanyAccessPendingRequest, Company } from '@/lib/api';

export interface CompanyAccessSidebarProps {
  selectedCompany?: CompanyAccessSuggestedCompany | Company | null;
  pendingRequest?: CompanyAccessPendingRequest | null;
  className?: string;
}

export function CompanyAccessSidebar({
  selectedCompany,
  pendingRequest,
  className,
}: CompanyAccessSidebarProps) {
  return (
    <aside
      aria-label="Informações complementares e publicidade"
      className={cn('space-y-6 w-full max-w-[300px] mx-auto', className)}
    >
      {/* 1. Status do Acesso: Acompanhamento da solicitação empresarial (sempre em primeiro lugar) */}
      <section aria-label="Status do Acesso">
        <CompanyAccessStatus
          company={selectedCompany}
          request={pendingRequest}
        />
      </section>

      {/* 2. Publicidade Patrocinada: Banner Comercial com identificação clara de anúncio */}
      <section
        aria-label="Publicidade"
        className="space-y-2.5"
      >
        <div className="flex items-center justify-between text-xs px-0.5">
          <span className="font-semibold text-slate-700 tracking-wide uppercase text-[10px]">
            Publicidade
          </span>
          <span className="text-[10px] text-slate-400 font-medium tracking-wide">
            Patrocinado
          </span>
        </div>

        <ErrorBoundary
          fallback={<AvaliaSolarHouseAd source="company_access_sidebar_fallback" />}
        >
          <BannerSlot
            placement="company_access_sidebar"
            limit={1}
            lazy
            fallback={<AvaliaSolarHouseAd source="company_access_sidebar" />}
          />
        </ErrorBoundary>
      </section>

      {/* 3. Segundo Espaço Promocional: Divulgação institucional de autoridade / verificação */}
      <section
        aria-label="Autoridade e Verificação"
        className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm text-slate-800 space-y-2"
      >
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B1F4B]">
          <Award className="h-4 w-4 text-[#FFB900]" />
          <span>Perfil Verificado 2026</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-600">
          Empresas verificadas pelo Avalia Solar têm prioridade na busca regional e exibem selos de autenticidade para o consumidor.
        </p>
        <div className="pt-1 border-t border-slate-100">
          <Link
            href="/como-funciona"
            className="group flex items-center justify-between text-[11px] font-semibold text-[#0755F5] hover:text-[#0B1F4B] transition-colors"
          >
            <span>Conheça os critérios do selo</span>
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>
    </aside>
  );
}

