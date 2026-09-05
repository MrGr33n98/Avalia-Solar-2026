'use client';

import React from 'react';
import CRMColumnSelectorModal, { ColumnDefinition } from '@/components/sales/ui/CRMColumnSelectorModal';

export interface CompanyColumnConfig {
  company_name: boolean;
  domain: boolean;
  phone: boolean;
  email: boolean;
  company_type: boolean;
  company_size: boolean;
  address: boolean;
  created_at: boolean;
  owner_name: boolean;
  source: boolean;
  // Leads & Funil
  open_opps: boolean;
  open_pipeline_value: boolean;
  won_opps: boolean;
  won_pipeline_value: boolean;
  lost_opps: boolean;
  last_won_date: boolean;
  fit_score: boolean;
  // Emails
  emails_sent: boolean;
  emails_opened: boolean;
  last_email_sent: boolean;
  // Engajamento & Atividades
  primary_contact: boolean;
  people_count: boolean;
  last_contact: boolean;
  next_activity: boolean;
  overdue_activities: boolean;
  activities_count: boolean;
  // Tags & Qualidade
  tags: boolean;
  data_quality: boolean;
}

export const DEFAULT_COMPANY_COLUMNS: CompanyColumnConfig = {
  company_name: true,
  primary_contact: true,
  last_contact: true,
  address: true,
  company_type: true,
  tags: true,
  open_opps: true,
  // Other default off
  domain: false,
  phone: false,
  email: false,
  company_size: false,
  created_at: false,
  owner_name: false,
  source: false,
  open_pipeline_value: false,
  won_opps: false,
  won_pipeline_value: false,
  lost_opps: false,
  last_won_date: false,
  fit_score: false,
  emails_sent: false,
  emails_opened: false,
  last_email_sent: false,
  people_count: false,
  next_activity: false,
  overdue_activities: false,
  activities_count: false,
  data_quality: false,
};

const COMPANY_COLUMNS_DEFINITIONS: ColumnDefinition<keyof CompanyColumnConfig>[] = [
  // Empresas (Companies)
  { id: 'company_name', label: 'Nome da Empresa (Company Name)', category: 'companies', required: true, description: 'Razão social ou nome fantasia da empresa.' },
  { id: 'domain', label: 'Domínio / Website', category: 'companies', description: 'Endereço web oficial da empresa.' },
  { id: 'phone', label: 'Telefone Principal', category: 'companies', description: 'Número de telefone comercial principal.' },
  { id: 'email', label: 'E-mail Comercial', category: 'companies', description: 'E-mail principal de contato da empresa.' },
  { id: 'company_type', label: 'Tipo de Empresa (Company Type)', category: 'companies', description: 'Segmento de atuação (Integrador, EPCist, Distribuidor).' },
  { id: 'company_size', label: 'Porte / Número de Funcionários', category: 'companies', description: 'Estimativa do porte ou total de funcionários.' },
  { id: 'address', label: 'Localização / Cidade & UF', category: 'companies', description: 'Cidade e estado da sede principal.' },
  { id: 'created_at', label: 'Data de Cadastro (Created On)', category: 'companies', description: 'Data em que a empresa foi inserida no CRM.' },
  { id: 'owner_name', label: 'Responsável (Assigned To / Owner)', category: 'companies', description: 'Vendedor ou consultor atribuído à conta.' },
  { id: 'source', label: 'Canal de Origem (Source)', category: 'companies', description: 'Origem da empresa no funil (Inbound, Outbound, Evento).' },

  // Leads & Funil
  { id: 'open_opps', label: '# Oportunidades Abertas', category: 'leads', description: 'Quantidade total de negócios abertos no funil.' },
  { id: 'open_pipeline_value', label: 'Valor em Funil Aberto (R$)', category: 'leads', description: 'Soma do valor financeiro das oportunidades abertas.' },
  { id: 'won_opps', label: '# Oportunidades Ganhas', category: 'leads', description: 'Total de propostas/contratos fechados com sucesso.' },
  { id: 'won_pipeline_value', label: 'Valor Total Ganho (R$)', category: 'leads', description: 'Receita acumulada de negócios fechados.' },
  { id: 'lost_opps', label: '# Oportunidades Perdidas', category: 'leads', description: 'Total de oportunidades encerradas como perdidas.' },
  { id: 'last_won_date', label: 'Data da Última Vitória', category: 'leads', description: 'Data do último contrato fechado.' },
  { id: 'fit_score', label: 'Intent / Fit Score', category: 'leads', description: 'Pontuação de aderência comercial da empresa (0-100).' },

  // E-mails
  { id: 'emails_sent', label: '# E-mails Enviados', category: 'email', description: 'Quantidade de e-mails enviados para os decisores da empresa.' },
  { id: 'emails_opened', label: 'E-mails Abertos', category: 'email', description: 'Total de e-mails abertos pelos destinatários.' },
  { id: 'last_email_sent', label: 'Data do Último E-mail', category: 'email', description: 'Data da última mensagem enviada via CRM/Hermes.' },

  // Engajamento & Atividades
  { id: 'primary_contact', label: 'Contato Principal (People)', category: 'engagement', description: 'Nome e cargo do principal decisor vinculado.' },
  { id: 'people_count', label: '# Pessoas Vinculadas', category: 'engagement', description: 'Total de contatos cadastrados nesta empresa.' },
  { id: 'last_contact', label: 'Último Contato / Atividade', category: 'engagement', description: 'Data e horário da última interação registrada.' },
  { id: 'next_activity', label: 'Próxima Atividade Agendada', category: 'engagement', description: 'Data da próxima tarefa ou reunião pendente.' },
  { id: 'overdue_activities', label: '# Atividades em Atraso', category: 'engagement', description: 'Tarefas e compromissos com prazo vencido.' },
  { id: 'activities_count', label: '# Total de Interações', category: 'engagement', description: 'Soma de chamadas, reuniões, e-mails e notas.' },

  // Tags & Qualidade
  { id: 'tags', label: 'Tags / Marcadores', category: 'custom', description: 'Etiquetas personalizadas atribuídas à empresa.' },
  { id: 'data_quality', label: 'Qualidade dos Dados (%)', category: 'custom', description: 'Nível de preenchimento dos dados cadastrais.' },
];

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
  const handleRestoreDefaults = () => {
    onChange(DEFAULT_COMPANY_COLUMNS);
  };

  return (
    <CRMColumnSelectorModal
      open={open}
      onClose={onClose}
      title="Configurar Colunas Exibidas"
      description="Selecione as colunas do Nutshell CRM ativas na tabela de empresas."
      availableColumns={COMPANY_COLUMNS_DEFINITIONS}
      selectedColumns={columns}
      onChange={(updated) => onChange(updated as CompanyColumnConfig)}
      onRestoreDefaults={handleRestoreDefaults}
    />
  );
}
