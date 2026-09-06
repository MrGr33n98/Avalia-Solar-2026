'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TemplateStatus } from '../types';

interface TemplateMetadataFormProps {
  name: string;
  onNameChange: (val: string) => void;
  subject: string;
  onSubjectChange: (val: string) => void;
  preheader: string;
  onPreheaderChange: (val: string) => void;
  category: string;
  onCategoryChange: (val: string) => void;
  status: TemplateStatus;
  onStatusChange: (val: TemplateStatus) => void;
  isPrivate: boolean;
  onPrivateChange: (val: boolean) => void;
}

export function TemplateMetadataForm({
  name,
  onNameChange,
  subject,
  onSubjectChange,
  preheader,
  onPreheaderChange,
  category,
  onCategoryChange,
  status,
  onStatusChange,
  isPrivate,
  onPrivateChange,
}: TemplateMetadataFormProps) {
  return (
    <div className="space-y-4 border-b pb-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Nome do Template *</Label>
          <Input
            required
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Ex: Follow-up Orçamento Solar"
            className="text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Categoria</Label>
          <Input
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            placeholder="Ex: Prospecção, Follow-up, Comercial"
            className="text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Assunto do E-mail *</Label>
          <Input
            required
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            placeholder="Olá {{person.first_name}}, podemos continuar?"
            className="text-sm font-medium"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Preheader (Texto de prévia)</Label>
          <Input
            value={preheader}
            onChange={(e) => onPreheaderChange(e.target.value)}
            placeholder="Resumo exibido na caixa de entrada do cliente..."
            className="text-sm"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6 pt-1 text-xs">
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium">Status:</Label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as TemplateStatus)}
            className="rounded border bg-background px-2.5 py-1 text-xs"
          >
            <option value="active">Ativo</option>
            <option value="draft">Rascunho</option>
            <option value="archived">Arquivado</option>
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer font-medium">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => onPrivateChange(e.target.checked)}
            className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
          />
          <span>Tornar template privado (visível apenas para você)</span>
        </label>
      </div>
    </div>
  );
}
