import {
  Building2,
  Users,
  Target,
  CalendarClock,
  Phone,
  FileText,
  Mail,
  FileSpreadsheet,
} from 'lucide-react';

export type CreateActionId =
  | 'company'
  | 'contact'
  | 'opportunity'
  | 'task'
  | 'activity'
  | 'quote'
  | 'email'
  | 'import';

export interface CreateActionDefinition {
  id: CreateActionId;
  label: string;
  description: string;
  iconName: string;
  type: 'modal' | 'route';
  target: string;
  keyboardShortcut?: string;
  permission?: string;
}

export const CRM_CREATE_ACTIONS: CreateActionDefinition[] = [
  {
    id: 'company',
    label: 'Empresa',
    description: 'Organização com quem você faz negócios',
    iconName: 'Building2',
    type: 'modal',
    target: 'company',
    keyboardShortcut: 'c c',
  },
  {
    id: 'contact',
    label: 'Pessoa',
    description: 'Decisor ou contato comercial comercial',
    iconName: 'Users',
    type: 'modal',
    target: 'contact',
    keyboardShortcut: 'c p',
  },
  {
    id: 'opportunity',
    label: 'Lead',
    description: 'Venda potencial ou oportunidade no pipeline comercial',
    iconName: 'Target',
    type: 'modal',
    target: 'opportunity',
    keyboardShortcut: 'c l',
  },
  {
    id: 'task',
    label: 'Tarefa',
    description: 'Follow-up ou compromisso com data limite',
    iconName: 'CalendarClock',
    type: 'modal',
    target: 'task',
    keyboardShortcut: 'c t',
  },
  {
    id: 'activity',
    label: 'Atividade',
    description: 'Registrar chamada telefônica ou reunião',
    iconName: 'Phone',
    type: 'modal',
    target: 'activity',
  },
  {
    id: 'quote',
    label: 'Proposta / Quote',
    description: 'Gerar proposta comercial e dimensionamento solar',
    iconName: 'FileText',
    type: 'modal',
    target: 'quote',
  },
  {
    id: 'email',
    label: 'E-mail',
    description: 'Enviar mensagem comercial ou modelo de outreach',
    iconName: 'Mail',
    type: 'modal',
    target: 'email',
  },
  {
    id: 'import',
    label: 'Importar Leads',
    description: 'Importar lote de empresas e contatos via CSV',
    iconName: 'FileSpreadsheet',
    type: 'route',
    target: '/dashboard/sales/import',
  },
];
