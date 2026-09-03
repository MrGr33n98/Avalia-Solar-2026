'use client';

import { Columns } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CRMModal from '@/components/sales/ui/CRMModal';

export interface CompanyColumnConfig {
  company_name: boolean;
  primary_contact: boolean;
  last_contact: boolean;
  address: boolean;
  company_type: boolean;
  tags: boolean;
  open_opps: boolean;
}

interface CompaniesColumnsDialogProps {
  open: boolean;
  onClose: () => void;
  columns: CompanyColumnConfig;
  onChange: (columns: CompanyColumnConfig) => void;
}

export default function CompaniesColumnsDialog({
  open,
  onClose,
  columns,
  onChange,
}: CompaniesColumnsDialogProps) {
  const toggleColumn = (key: keyof CompanyColumnConfig) => {
    onChange({ ...columns, [key]: !columns[key] });
  };

  return (
    <CRMModal
      open={open}
      onClose={onClose}
      title="Configurar Colunas Exibidas"
      description="Selecione as colunas ativas na tabela de empresas."
      icon={<Columns className="w-5 h-5 text-indigo-700" />}
      size="sm"
      showCustomizeFields={false}
      footer={
        <div className="w-full flex justify-end">
          <Button size="sm" onClick={onClose} className="h-9 px-5 bg-indigo-900 text-white hover:bg-indigo-950 font-bold rounded-lg shadow-sm">
            Concluir
          </Button>
        </div>
      }
    >
      <div className="space-y-3 py-1 text-xs">
        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50 border border-slate-200">
          <input
            type="checkbox"
            checked={columns.company_name}
            disabled
            className="rounded border-slate-300 text-indigo-600 w-4 h-4"
          />
          <span className="font-bold text-slate-900">Nome da Empresa (Obrigatório)</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50 border border-slate-200">
          <input
            type="checkbox"
            checked={columns.primary_contact}
            onChange={() => toggleColumn('primary_contact')}
            className="rounded border-slate-300 text-indigo-600 w-4 h-4"
          />
          <span className="font-semibold text-slate-800">Contato Principal (People)</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50 border border-slate-200">
          <input
            type="checkbox"
            checked={columns.last_contact}
            onChange={() => toggleColumn('last_contact')}
            className="rounded border-slate-300 text-indigo-600 w-4 h-4"
          />
          <span className="font-semibold text-slate-800">Último Contato / Atividade</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50 border border-slate-200">
          <input
            type="checkbox"
            checked={columns.address}
            onChange={() => toggleColumn('address')}
            className="rounded border-slate-300 text-indigo-600 w-4 h-4"
          />
          <span className="font-semibold text-slate-800">Localização / Cidade</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50 border border-slate-200">
          <input
            type="checkbox"
            checked={columns.company_type}
            onChange={() => toggleColumn('company_type')}
            className="rounded border-slate-300 text-indigo-600 w-4 h-4"
          />
          <span className="font-semibold text-slate-800">Tipo de Empresa (Company Type)</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50 border border-slate-200">
          <input
            type="checkbox"
            checked={columns.open_opps}
            onChange={() => toggleColumn('open_opps')}
            className="rounded border-slate-300 text-indigo-600 w-4 h-4"
          />
          <span className="font-semibold text-slate-800">Oportunidades Abertas</span>
        </label>
      </div>
    </CRMModal>
  );
}
