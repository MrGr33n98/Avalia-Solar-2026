'use client';

import { Button } from '@/components/ui/button';
import { track } from '@/lib/analytics/lazy';
import { Zap } from 'lucide-react';
import { Company } from '@/lib/api';

interface LeadCTAProps {
  company: Company;
  category: string;
  variant?: 'compact' | 'rich' | 'modal';
  onLeadModalOpen?: (company: Company) => void;
}

export default function LeadCTA({
  company,
  category,
  variant = 'compact',
  onLeadModalOpen,
}: LeadCTAProps) {
  const c = company as any;
  // Regra A: Empresa FREE → Lead Interno
  if (!c.direct_lead_enabled) {
    return (
      <Button
        onClick={(e) => {
          e.stopPropagation();
          track('lead_open_internal', {
            company_id: company.id,
            company_name: company.name,
            category,
            placement: variant,
          });
          onLeadModalOpen?.(company);
        }}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-95 uppercase tracking-tighter text-xs h-10"
        size="sm"
        aria-label={`Solicitar orçamento para ${company.name}`}
      >
        Solicitar Orçamento
      </Button>
    );
  }

  // Regra B: Empresa PAGA → Lead Direto
  return (
    <Button
      asChild
      onClick={(e) => {
        e.stopPropagation();
        track('lead_click_direct', {
          company_id: company.id,
          company_name: company.name,
          category,
          placement: variant,
          url: c.direct_lead_url,
        });
      }}
      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg shadow-emerald-100 transition-all active:scale-95 uppercase tracking-tighter text-xs h-10"
      size="sm"
    >
      <a
        href={c.direct_lead_url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Falar com ${company.name} - Resposta mais rápida`}
        className="flex items-center justify-center gap-1"
      >
        <Zap className="w-4 h-4 fill-current" />
        Falar Agora
      </a>
    </Button>
  );
}
