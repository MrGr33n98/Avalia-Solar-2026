'use client';

import React from 'react';
import Link from 'next/link';
import { Award, ArrowRight } from 'lucide-react';
import { BannerSlot } from '@/components/banners/BannerSlot';
import { ErrorBoundary } from '@/components/error-boundary';
import { useLocation } from '@/contexts/LocationContext';
import { CompanyAccessStatus } from './CompanyAccessStatus';
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
  const { selectedState, selectedCity } = useLocation();

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

      {/* 2. Admin-managed campaign. No fabricated house-ad or misleading "Sponsored" label
          when there is no eligible campaign. First prefer the 300×250 dedicated slot;
          only then reuse the existing 300×600 company-profile sidebar inventory,
          explicitly requested for this page. Server-side contract, moderation,
          location targeting and priority still determine eligibility. */}
      <ErrorBoundary fallback={null}>
        <BannerSlot
          placement="company_access_sidebar"
          fallbackPositions={['company_profile_sidebar_sponsored']}
          limit={1}
          lazy={false}
          state={selectedState || undefined}
          city={selectedCity || undefined}
          page="select-company"
          showDisclosure
        />
      </ErrorBoundary>

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

