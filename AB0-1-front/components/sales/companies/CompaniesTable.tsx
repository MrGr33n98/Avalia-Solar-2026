'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, Building2, ChevronRight, Globe, Mail, Phone, Plus, RotateCw, UserCheck, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Company360View from '@/components/sales/Company360View';
import { CompanyColumnConfig } from './CompaniesColumnsDialog';

export interface CompanyListItem {
  id: number;
  name: string;
  domain?: string | null;
  website?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: string | null;
  company_type?: string | null;
  company_size?: string | null;
  source?: string | null;
  created_at?: string | null;
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
  won_opportunities_count?: number;
  won_pipeline_value_cents?: number;
  lost_opportunities_count?: number;
  last_won_date?: string | null;
  fit_score?: number | { score: number; breakdown: Record<string, unknown>[] } | null;
  emails_sent_count?: number;
  emails_opened_count?: number;
  last_email_sent_at?: string | null;
  last_activity_at?: string | null;
  next_activity_at?: string | null;
  overdue_activities_count?: number;
  activities_count?: number;
  data_quality?: number | null;
  tags?: Array<{ id: number; name: string; color?: string | null }>;
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

const formatCurrency = (cents?: number | null) => {
  if (!cents && cents !== 0) return '—';
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (iso?: string | null) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('pt-BR');
  } catch {
    return '—';
  }
};

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
    <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden font-sans">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
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
              {/* Empresa */}
              {columns.company_name && <th className="p-3">Company Name</th>}
              {columns.domain && <th className="p-3">Website / Domínio</th>}
              {columns.phone && <th className="p-3">Telefone</th>}
              {columns.email && <th className="p-3">E-mail Comercial</th>}
              {columns.company_type && <th className="p-3">Company Type</th>}
              {columns.company_size && <th className="p-3">Porte</th>}
              {columns.address && <th className="p-3">Address</th>}
              {columns.created_at && <th className="p-3">Created On</th>}
              {columns.owner_name && <th className="p-3">Owner / Responsável</th>}
              {columns.source && <th className="p-3">Origem</th>}

              {/* Leads */}
              {columns.open_opps && <th className="p-3">Oportunidades</th>}
              {columns.open_pipeline_value && <th className="p-3">Funil Aberto (R$)</th>}
              {columns.won_opps && <th className="p-3">Opp. Ganhas</th>}
              {columns.won_pipeline_value && <th className="p-3">Total Ganho (R$)</th>}
              {columns.lost_opps && <th className="p-3">Opp. Perdidas</th>}
              {columns.last_won_date && <th className="p-3">Última Vitória</th>}
              {columns.fit_score && <th className="p-3">Fit Score</th>}

              {/* Emails */}
              {columns.emails_sent && <th className="p-3">E-mails Enviados</th>}
              {columns.emails_opened && <th className="p-3">E-mails Abertos</th>}
              {columns.last_email_sent && <th className="p-3">Último E-mail</th>}

              {/* Engajamento */}
              {columns.primary_contact && <th className="p-3">People (Contato Principal)</th>}
              {columns.people_count && <th className="p-3"># Pessoas</th>}
              {columns.last_contact && <th className="p-3">Last Contact</th>}
              {columns.next_activity && <th className="p-3">Próxima Atividade</th>}
              {columns.overdue_activities && <th className="p-3">Em Atraso</th>}
              {columns.activities_count && <th className="p-3">Total Interações</th>}

              {/* Tags & Quality */}
              {columns.tags && <th className="p-3">Tags</th>}
              {columns.data_quality && <th className="p-3">Qualidade Dados</th>}

              <th className="p-3 text-right sticky right-0 bg-slate-50/90 shadow-2xs">Ações</th>
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

              const rawFitScore =
                typeof account.fit_score === 'number'
                  ? account.fit_score
                  : account.fit_score?.score ?? 85;

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

                  {/* Company Name */}
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

                  {/* Domain */}
                  {columns.domain && (
                    <td className="p-3 text-slate-600">
                      {account.domain ? (
                        <a
                          href={account.website || `https://${account.domain}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          <Globe className="w-3 h-3 text-indigo-400" />
                          {account.domain}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  )}

                  {/* Phone */}
                  {columns.phone && (
                    <td className="p-3 text-slate-600">
                      {account.phone ? (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{account.phone}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                  )}

                  {/* Email */}
                  {columns.email && (
                    <td className="p-3 text-slate-600">
                      {account.email ? (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{account.email}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                  )}

                  {/* Company Type */}
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

                  {/* Company Size */}
                  {columns.company_size && (
                    <td className="p-3 text-slate-600">
                      <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {account.company_size || '—'}
                      </span>
                    </td>
                  )}

                  {/* Address */}
                  {columns.address && (
                    <td className="p-3 text-slate-600">
                      {[account.city, account.state].filter(Boolean).join(', ') || '—'}
                    </td>
                  )}

                  {/* Created At */}
                  {columns.created_at && (
                    <td className="p-3 text-slate-500">
                      {formatDate(account.created_at)}
                    </td>
                  )}

                  {/* Owner */}
                  {columns.owner_name && (
                    <td className="p-3 font-medium text-slate-800">
                      {account.owner_name || 'Vendedor Interno'}
                    </td>
                  )}

                  {/* Source */}
                  {columns.source && (
                    <td className="p-3">
                      <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                        {account.source || 'Inbound'}
                      </span>
                    </td>
                  )}

                  {/* Open Opps */}
                  {columns.open_opps && (
                    <td className="p-3">
                      <span className="font-semibold text-slate-900">
                        {account.open_opportunities_count ?? 0} abertas
                      </span>
                    </td>
                  )}

                  {/* Open Pipeline Value */}
                  {columns.open_pipeline_value && (
                    <td className="p-3 font-semibold text-emerald-700">
                      {formatCurrency(account.open_pipeline_value_cents)}
                    </td>
                  )}

                  {/* Won Opps */}
                  {columns.won_opps && (
                    <td className="p-3 font-semibold text-emerald-800">
                      {account.won_opportunities_count ?? 0} ganhas
                    </td>
                  )}

                  {/* Won Pipeline Value */}
                  {columns.won_pipeline_value && (
                    <td className="p-3 font-bold text-emerald-900">
                      {formatCurrency(account.won_pipeline_value_cents)}
                    </td>
                  )}

                  {/* Lost Opps */}
                  {columns.lost_opps && (
                    <td className="p-3 text-slate-500">
                      {account.lost_opportunities_count ?? 0} perdidas
                    </td>
                  )}

                  {/* Last Won Date */}
                  {columns.last_won_date && (
                    <td className="p-3 text-slate-600">
                      {formatDate(account.last_won_date)}
                    </td>
                  )}

                  {/* Fit Score */}
                  {columns.fit_score && (
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        {rawFitScore}/100
                      </span>
                    </td>
                  )}

                  {/* Emails Sent */}
                  {columns.emails_sent && (
                    <td className="p-3 text-slate-700 font-medium">
                      {account.emails_sent_count ?? 0} enviados
                    </td>
                  )}

                  {/* Emails Opened */}
                  {columns.emails_opened && (
                    <td className="p-3 text-indigo-700 font-medium">
                      {account.emails_opened_count ?? 0} abertos
                    </td>
                  )}

                  {/* Last Email Sent */}
                  {columns.last_email_sent && (
                    <td className="p-3 text-slate-500">
                      {formatDate(account.last_email_sent_at)}
                    </td>
                  )}

                  {/* Primary Contact */}
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

                  {/* People Count */}
                  {columns.people_count && (
                    <td className="p-3 font-medium text-slate-800">
                      {account.people_count ?? 0} pessoas
                    </td>
                  )}

                  {/* Last Contact */}
                  {columns.last_contact && (
                    <td className="p-3 text-slate-500">
                      {formatDate(account.last_activity_at)}
                    </td>
                  )}

                  {/* Next Activity */}
                  {columns.next_activity && (
                    <td className="p-3 text-amber-700 font-medium">
                      {formatDate(account.next_activity_at)}
                    </td>
                  )}

                  {/* Overdue Activities */}
                  {columns.overdue_activities && (
                    <td className="p-3">
                      {(account.overdue_activities_count ?? 0) > 0 ? (
                        <span className="bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          {account.overdue_activities_count} em atraso
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                  )}

                  {/* Total Activities */}
                  {columns.activities_count && (
                    <td className="p-3 font-medium text-slate-700">
                      {account.activities_count ?? 0} interações
                    </td>
                  )}

                  {/* Tags */}
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

                  {/* Data Quality */}
                  {columns.data_quality && (
                    <td className="p-3">
                      <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-[10px] border border-blue-100">
                        {account.data_quality ?? 90}%
                      </span>
                    </td>
                  )}

                  {/* Sticky Actions */}
                  <td className="p-3 text-right sticky right-0 bg-white shadow-2xs">
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
