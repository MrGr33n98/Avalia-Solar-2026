'use client';

import React from 'react';
import CRMColumnSelectorModal, { ColumnDefinition } from '@/components/sales/ui/CRMColumnSelectorModal';

export interface PeopleColumnConfig {
  person_name: boolean;
  company_job: boolean;
  decision_role: boolean;
  last_contact: boolean;
  contact_info: boolean;
  phone: boolean;
  email: boolean;
  created_at: boolean;
  owner_name: boolean;
}

export const DEFAULT_PEOPLE_COLUMNS: PeopleColumnConfig = {
  person_name: true,
  company_job: true,
  decision_role: true,
  last_contact: true,
  contact_info: true,
  phone: false,
  email: false,
  created_at: false,
  owner_name: false,
};

const PEOPLE_COLUMNS_DEFINITIONS: ColumnDefinition<keyof PeopleColumnConfig>[] = [
  { id: 'person_name', label: 'Nome da Pessoa (Name)', category: 'companies', required: true, description: 'Nome completo do contato/decisor.' },
  { id: 'company_job', label: 'Empresa & Cargo', category: 'companies', description: 'Empresa vinculada e cargo ocupado.' },
  { id: 'decision_role', label: 'Papel de Decisão (Decision Role)', category: 'companies', description: 'Papel no comitê de compra (Decisor, Influenciador, Usuário).' },
  { id: 'contact_info', label: 'Canais de Contato (Resumo)', category: 'email', description: 'Ícones e atalhos rápidos de E-mail e WhatsApp.' },
  { id: 'phone', label: 'Telefone / WhatsApp Direto', category: 'engagement', description: 'Número de telefone direto do contato.' },
  { id: 'email', label: 'Endereço de E-mail', category: 'email', description: 'E-mail profissional do contato.' },
  { id: 'last_contact', label: 'Último Contato / Atividade', category: 'engagement', description: 'Data e horário da última interação registrada.' },
  { id: 'created_at', label: 'Data de Cadastro', category: 'custom', description: 'Data de adição do contato no CRM.' },
  { id: 'owner_name', label: 'Responsável (Owner)', category: 'custom', description: 'Vendedor responsável pelo contato.' },
];

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
  return (
    <CRMColumnSelectorModal
      open={open}
      onClose={onClose}
      title="Configurar Colunas Exibidas — Pessoas"
      description="Selecione as colunas ativas na tabela de pessoas e decisores."
      availableColumns={PEOPLE_COLUMNS_DEFINITIONS}
      selectedColumns={columns}
      onChange={(updated) => onChange(updated as PeopleColumnConfig)}
      onRestoreDefaults={() => onChange(DEFAULT_PEOPLE_COLUMNS)}
    />
  );
}
