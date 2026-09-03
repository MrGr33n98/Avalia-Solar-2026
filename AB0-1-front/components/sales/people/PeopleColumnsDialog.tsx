'use client';

import { Columns } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CRMModal from '@/components/sales/ui/CRMModal';

export interface PeopleColumnConfig {
  person_name: boolean;
  company_job: boolean;
  decision_role: boolean;
  last_contact: boolean;
  contact_info: boolean;
}

interface PeopleColumnsDialogProps {
  open: boolean;
  onClose: () => void;
  columns: PeopleColumnConfig;
  onChange: (columns: PeopleColumnConfig) => void;
}

export default function PeopleColumnsDialog({
  open,
  onClose,
  columns,
  onChange,
}: PeopleColumnsDialogProps) {
  const toggleColumn = (key: keyof PeopleColumnConfig) => {
    onChange({ ...columns, [key]: !columns[key] });
  };

  return (
    <CRMModal
      open={open}
      onClose={onClose}
      title="Configurar Colunas Exibidas — Pessoas"
      description="Selecione as colunas ativas na tabela de pessoas e decisores."
      icon={<Columns className="w-5 h-5 text-indigo-700" />}
      size="sm"
    >
      <div className="space-y-3 py-2 text-xs">
        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-slate-50 border border-slate-200">
          <input
            type="checkbox"
            checked={columns.person_name}
            disabled
            className="rounded border-slate-300 text-indigo-600"
          />
          <span className="font-bold text-slate-900">Nome da Pessoa (Obrigatório)</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-slate-50 border border-slate-200">
          <input
            type="checkbox"
            checked={columns.company_job}
            onChange={() => toggleColumn('company_job')}
            className="rounded border-slate-300 text-indigo-600"
          />
          <span className="font-semibold text-slate-800">Empresa & Cargo</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-slate-50 border border-slate-200">
          <input
            type="checkbox"
            checked={columns.decision_role}
            onChange={() => toggleColumn('decision_role')}
            className="rounded border-slate-300 text-indigo-600"
          />
          <span className="font-semibold text-slate-800">Papel de Decisão (Decision Role)</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-slate-50 border border-slate-200">
          <input
            type="checkbox"
            checked={columns.last_contact}
            onChange={() => toggleColumn('last_contact')}
            className="rounded border-slate-300 text-indigo-600"
          />
          <span className="font-semibold text-slate-800">Último Contato / Atividade</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-slate-50 border border-slate-200">
          <input
            type="checkbox"
            checked={columns.contact_info}
            onChange={() => toggleColumn('contact_info')}
            className="rounded border-slate-300 text-indigo-600"
          />
          <span className="font-semibold text-slate-800">Canais de Contato (E-mail / WhatsApp)</span>
        </label>

        <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
          <Button size="sm" onClick={onClose} className="bg-indigo-900 text-white hover:bg-indigo-950 font-bold">
            Concluir
          </Button>
        </div>
      </div>
    </CRMModal>
  );
}
