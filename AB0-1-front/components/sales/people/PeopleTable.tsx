'use client';

import Link from 'next/link';
import { AlertCircle, Building2, ChevronRight, Mail, MessageSquare, PhoneCall, RotateCw, UserCheck, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Contact360View from '@/components/sales/Contact360View';
import { PeopleColumnConfig } from './PeopleColumnsDialog';

export interface PersonListItem {
  id: number;
  first_name: string;
  last_name?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  job_title?: string | null;
  decision_role?: string | null;
  is_primary?: boolean;
  account_name?: string | null;
  sales_account_id?: number | null;
  last_contact_at?: string | null;
}

interface PeopleTableProps {
  contacts: PersonListItem[];
  loading: boolean;
  error: string | null;
  columns: PeopleColumnConfig;
  selectedIds: number[];
  onToggleSelectAll: () => void;
  onToggleSelect: (id: number) => void;
  onRetry: () => void;
}

export default function PeopleTable({
  contacts,
  loading,
  error,
  columns,
  selectedIds,
  onToggleSelectAll,
  onToggleSelect,
  onRetry,
}: PeopleTableProps) {
  if (loading) {
    return (
      <div className="py-16 text-center space-y-3 bg-white rounded-lg border border-slate-200">
        <RotateCw className="mx-auto h-7 w-7 animate-spin text-indigo-600" />
        <p className="text-xs text-slate-500 font-medium">Carregando lista de pessoas e decisores do CRM...</p>
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

  if (contacts.length === 0) {
    return (
      <div className="py-16 text-center bg-white rounded-lg border border-slate-200">
        <Users className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-900">Nenhuma pessoa encontrada.</p>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
          Adicione contatos e decisores de compra para conectar comitês às oportunidades solares.
        </p>
      </div>
    );
  }

  const allSelected = contacts.length > 0 && selectedIds.length === contacts.length;

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getRoleLabel = (role?: string | null) => {
    switch (role) {
      case 'economic_buyer':
        return 'Economic Buyer';
      case 'champion':
        return 'Champion';
      case 'technical_buyer':
        return 'Technical Buyer';
      default:
        return 'Decision Maker';
    }
  };

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
                  className="rounded border-slate-300 text-indigo-600"
                />
              </th>
              {columns.person_name && <th className="p-3">Person Name</th>}
              {columns.company_job && <th className="p-3">Empresa & Cargo</th>}
              {columns.decision_role && <th className="p-3">Decision Role</th>}
              {columns.last_contact && <th className="p-3">Last Contact</th>}
              {columns.contact_info && <th className="p-3">Canais de Contato</th>}
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {contacts.map((person) => {
              const isSelected = selectedIds.includes(person.id);
              const initials = getInitials(person.name);

              return (
                <tr
                  key={person.id}
                  className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-indigo-50/40' : ''}`}
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(person.id)}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                  </td>

                  {columns.person_name && (
                    <td className="p-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-900 font-bold flex items-center justify-center text-xs shrink-0 border border-indigo-200">
                          {initials}
                        </div>
                        <div>
                          <Link href={`/dashboard/sales/people/${person.id}`} className="hover:text-indigo-600 font-bold block">
                            {person.name}
                          </Link>
                          {person.email && <span className="text-[11px] text-slate-500 font-normal block">{person.email}</span>}
                        </div>
                      </div>
                    </td>
                  )}

                  {columns.company_job && (
                    <td className="p-3 text-slate-700">
                      <div className="space-y-0.5">
                        {person.account_name ? (
                          <span className="font-semibold text-slate-900 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-blue-900 shrink-0" />
                            {person.account_name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Sem empresa vinculada</span>
                        )}
                        {person.job_title && <span className="text-[11px] text-slate-500 block">{person.job_title}</span>}
                      </div>
                    </td>
                  )}

                  {columns.decision_role && (
                    <td className="p-3">
                      <Badge variant="outline" className="text-[11px] font-normal border-indigo-200 bg-indigo-50 text-indigo-900">
                        {getRoleLabel(person.decision_role)}
                      </Badge>
                    </td>
                  )}

                  {columns.last_contact && (
                    <td className="p-3 text-slate-500">
                      {person.last_contact_at ? new Date(person.last_contact_at).toLocaleDateString('pt-BR') : '—'}
                    </td>
                  )}

                  {columns.contact_info && (
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        {person.email && (
                          <a href={`mailto:${person.email}`} title="Enviar E-mail" className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded">
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {person.whatsapp && (
                          <a href={`https://wa.me/${person.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" title="Abrir WhatsApp" className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {person.phone && (
                          <a href={`tel:${person.phone}`} title="Ligar" className="p-1 text-sky-600 hover:bg-sky-50 rounded">
                            <PhoneCall className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  )}

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Contact360View contactId={person.id} contactName={person.name} />
                      <Link href={`/dashboard/sales/people/${person.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-600 hover:text-indigo-700 px-2">
                          Perfil 360 <ChevronRight className="ml-1 h-3 w-3" />
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
