'use client';

import Link from 'next/link';
import { AlertCircle, Building2, ChevronRight, Plus, RotateCw, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Company360View from '@/components/sales/Company360View';
import { CompanyColumnConfig } from './CompaniesColumnsDialog';

export interface CompanyListItem {
  id: number;
  name: string;
  domain?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: string | null;
  company_type?: string | null;
  owner_id?: number | null;
  owner_name?: string | null;
  primary_contact?: {
    id: number;
    first_name: string;
    last_name?: string | null;
    email?: string | null;
    job_title?: string | null;
  } | null;
  people_count?: number;
  open_opportunities_count?: number;
  open_pipeline_value_cents?: number;
  tags?: Array<{ id: number; name: string; color?: string | null }>;
  last_activity_at?: string | null;
}

interface CompaniesTableProps {
  accounts: CompanyListItem[];
  loading: boolean;
  error: string | null;
  columns: CompanyColumnConfig;
  selectedIds: number[];
  onToggleSelectAll: () => void;
  onToggleSelect: (id: number) => void;
  onRetry: () => void;
  onCreateCompany?: () => void;
}

export default function CompaniesTable({
  accounts,
  loading,
  error,
  columns,
  selectedIds,
  onToggleSelectAll,
  onToggleSelect,
  onRetry,
  onCreateCompany,
}: CompaniesTableProps) {
  if (loading) {
    return (
      <div className="py-16 text-center space-y-3 bg-white rounded-lg border border-slate-200">
        <RotateCw className="mx-auto h-7 w-7 animate-spin text-sky-600" />
        <p className="text-xs text-slate-500 font-medium">Carregando lista de empresas do CRM...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center space-y-3 bg-white rounded-lg border border-slate-200">
        <AlertCircle className="mx-auto h-8 w-8 text-red-600" />
        <p className="text-xs font-semibold text-slate-900">{error}</p>
        <Button onClick={onRetry} variant="outline" size="sm" className="h-7 text-xs">
          <RotateCw className="mr-1.5 h-3 w-3" /> Tentar Novamente
        </Button>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="py-16 text-center bg-white rounded-lg border border-slate-200 shadow-2xs">
        <Building2 className="mx-auto h-12 w-12 text-slate-300" />
        <p className="mt-3 text-base font-bold text-slate-900">Nenhuma empresa encontrada.</p>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
          Adicione ou importe empresas comerciais para organizar decisores e gerenciar
          oportunidades.
        </p>
        {onCreateCompany && (
          <div className="mt-5 flex justify-center">
            <Button
              onClick={onCreateCompany}
              size="sm"
              className="h-9 px-4 text-xs font-bold bg-blue-900 hover:bg-blue-950 text-white shadow-xs"
            >
              <Plus className="w-4 h-4 mr-1.5 text-emerald-400" /> Cadastrar Nova Empresa
            </Button>
          </div>
        )}
      </div>
    );
  }

  const allSelected = accounts.length > 0 && selectedIds.length === accounts.length;

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-semibold select-none">
            <tr>
              <th className="p-3 w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="rounded border-slate-300 text-sky-600"
                />
              </th>
              {columns.company_name && <th className="p-3">Company Name</th>}
              {columns.primary_contact && <th className="p-3">People (Contato Principal)</th>}
              {columns.last_contact && <th className="p-3">Last Contact</th>}
              {columns.address && <th className="p-3">Address</th>}
              {columns.company_type && <th className="p-3">Company Type</th>}
              {columns.open_opps && <th className="p-3">Oportunidades</th>}
              {columns.tags && <th className="p-3">Tags</th>}
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {accounts.map((account) => {
              const isSelected = selectedIds.includes(account.id);
              const primaryContactName = account.primary_contact
                ? [account.primary_contact.first_name, account.primary_contact.last_name]
                    .filter(Boolean)
                    .join(' ')
                : null;

              return (
                <tr
                  key={account.id}
                  className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-sky-50/40' : ''}`}
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(account.id)}
                      className="rounded border-slate-300 text-sky-600"
                    />
                  </td>

                  {columns.company_name && (
                    <td className="p-3 font-semibold text-slate-900">
                      <Link
                        href={`/dashboard/sales/accounts/${account.id}`}
                        className="hover:text-sky-600 flex items-center gap-1.5"
                      >
                        <Building2 className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                        <span>{account.name}</span>
                      </Link>
                    </td>
                  )}

                  {/* Fixed People Column: Shows Primary Contact Name & Job Title, NOT account email! */}
                  {columns.primary_contact && (
                    <td className="p-3 text-slate-700">
                      {primaryContactName ? (
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-semibold block">{primaryContactName}</span>
                            {account.primary_contact?.job_title && (
                              <span className="text-[11px] text-slate-500 block">
                                {account.primary_contact.job_title}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Sem contato principal</span>
                      )}
                    </td>
                  )}

                  {columns.last_contact && (
                    <td className="p-3 text-slate-500">
                      {account.last_activity_at
                        ? new Date(account.last_activity_at).toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                  )}

                  {columns.address && (
                    <td className="p-3 text-slate-600">
                      {[account.city, account.state].filter(Boolean).join(', ') || '—'}
                    </td>
                  )}

                  {columns.company_type && (
                    <td className="p-3">
                      <Badge
                        variant="outline"
                        className="text-[11px] font-normal border-slate-200 bg-slate-50 text-slate-700"
                      >
                        {account.company_type || 'Standard Account'}
                      </Badge>
                    </td>
                  )}

                  {columns.open_opps && (
                    <td className="p-3">
                      <span className="font-semibold text-slate-900">
                        {account.open_opportunities_count ?? 0} abertas
                      </span>
                    </td>
                  )}

                  {columns.tags && (
                    <td className="p-3">
                      <div className="flex max-w-48 flex-wrap gap-1">
                        {(account.tags ?? []).slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{
                              backgroundColor: `${tag.color || '#dbeafe'}33`,
                              color: tag.color || '#1d4ed8',
                            }}
                          >
                            {tag.name}
                          </span>
                        ))}
                        {(account.tags ?? []).length > 3 && (
                          <span className="text-[10px] text-slate-500">
                            +{account.tags!.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                  )}

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Company360View
                        accountId={account.id}
                        companyName={account.name}
                        city={account.city || '—'}
                        state={account.state || '—'}
                        domain={account.domain || undefined}
                      />
                      <Link href={`/dashboard/sales/accounts/${account.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-sky-600 hover:text-sky-700 px-2"
                        >
                          Ficha <ChevronRight className="ml-1 h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
