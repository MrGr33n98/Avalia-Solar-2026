'use client';

import Link from 'next/link';
import { Building2, ChevronRight, MapPin, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CompanyItem {
  id: number;
  sales_account_id?: number;
  account_name?: string;
  job_title?: string;
  department?: string;
  city?: string | null;
  state?: string | null;
  is_current?: boolean;
  is_primary?: boolean;
}

interface PersonCompaniesCardProps {
  companies: CompanyItem[];
  primaryAccount?: {
    id: number;
    name: string;
    city?: string | null;
    state?: string | null;
  } | null;
  jobTitle?: string | null;
  onAddCompany?: () => void;
}

export default function PersonCompaniesCard({
  companies = [],
  primaryAccount,
  jobTitle,
  onAddCompany,
}: PersonCompaniesCardProps) {
  // Combine primaryAccount with employments if not already present
  const displayCompanies: CompanyItem[] = [...companies];
  if (primaryAccount && !displayCompanies.some((c) => (c.sales_account_id || c.id) === primaryAccount.id)) {
    displayCompanies.unshift({
      id: primaryAccount.id,
      sales_account_id: primaryAccount.id,
      account_name: primaryAccount.name,
      job_title: jobTitle || 'Colaborador',
      city: primaryAccount.city,
      state: primaryAccount.state,
      is_current: true,
      is_primary: true,
    });
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Card Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Companies</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {displayCompanies.length}
          </span>
        </div>

        {onAddCompany && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onAddCompany}
            className="h-7 text-xs font-semibold text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 px-2"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add company
          </Button>
        )}
      </div>

      {/* Companies List */}
      <div className="divide-y divide-slate-100">
        {displayCompanies.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            Nenhuma empresa associada a este contato.
          </div>
        ) : (
          displayCompanies.map((comp) => {
            const accId = comp.sales_account_id || comp.id;
            const locationStr = [comp.city, comp.state].filter(Boolean).join(', ');

            return (
              <div
                key={comp.id}
                className="p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold text-xs">
                    <Building2 className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/sales/accounts/${accId}`}
                        className="text-xs font-bold text-slate-900 hover:text-indigo-700 hover:underline truncate"
                      >
                        {comp.account_name || 'Empresa'}
                      </Link>
                      {comp.is_primary && (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200/80 text-[10px] font-semibold px-1.5 py-0">
                          Primary
                        </Badge>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 font-medium">
                      {comp.job_title || 'Cargo não especificado'}
                      {comp.department ? ` • ${comp.department}` : ''}
                    </p>

                    {locationStr && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{locationStr}</span>
                      </p>
                    )}
                  </div>
                </div>

                <Link
                  href={`/dashboard/sales/accounts/${accId}`}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded text-slate-400 hover:text-indigo-600 hover:bg-white"
                  title="Ver perfil da empresa"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
