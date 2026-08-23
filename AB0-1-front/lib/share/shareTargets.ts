import type { SharePlatform } from './shareTypes';

export interface ShareTarget {
  platform: SharePlatform;
  label: string;
  description: string;
  color: string;
}

export const SHARE_TARGETS: ShareTarget[] = [
  { platform: 'instagram', label: 'Instagram', description: 'Copiar link e abrir Instagram', color: 'bg-gradient-to-br from-fuchsia-500 to-orange-400' },
  { platform: 'whatsapp', label: 'WhatsApp', description: 'Enviar para um contato', color: 'bg-emerald-500' },
  { platform: 'linkedin', label: 'LinkedIn', description: 'Compartilhar publicação', color: 'bg-sky-700' },
  { platform: 'x', label: 'X', description: 'Publicar no X', color: 'bg-slate-950' },
  { platform: 'facebook', label: 'Facebook', description: 'Compartilhar publicação', color: 'bg-blue-600' },
  { platform: 'copy', label: 'Copiar link', description: 'Salvar link na área de transferência', color: 'bg-slate-200' },
  { platform: 'native_share', label: 'Mais opções', description: 'Usar menu de compartilhamento', color: 'bg-slate-500' },
];
