'use client';

import { Button } from '@/components/ui/button';
import { track } from '@/lib/analytics/lazy';
import { Zap } from 'lucide-react';

interface Company {
  id: number;
  name: string;
  direct_lead_enabled?: boolean;
  direct_lead_url?: string;
}

interface LeadCTAProps {
  company: Company;
  category: string;
  placement: 'card' | 'modal';
  onLeadModalOpen?: (company: Company) => void;
}

export default function LeadCTA({
  company,
  category,
  placement,
  onLeadModalOpen,
}: LeadCTAProps) {
  // Regra A: Empresa FREE → Lead Interno
  if (!company.direct_lead_enabled) {
    return (
      <Button
        onClick={() => {
          track('lead_open_internal', {
            company_id: company.id,
            company_name: company.name,
            category,
            placement,
          });
          onLeadModalOpen?.(company);
        }}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
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
      onClick={() => {
        track('lead_click_direct', {
          company_id: company.id,
          company_name: company.name,
          category,
          placement,
          url: company.direct_lead_url,
        });
      }}
      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
      size="sm"
    >
      <a
        href={company.direct_lead_url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Falar com ${company.name} - Resposta mais rápida`}
        className="flex items-center justify-center gap-1"
      >
        <Zap className="w-4 h-4" />
        Falar com a Empresa
      </a>
    </Button>
  );
}
