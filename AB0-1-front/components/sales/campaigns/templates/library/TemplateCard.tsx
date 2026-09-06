'use client';

import type { EmailTemplate } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit3, Eye, Copy, Archive, Send, Tag } from 'lucide-react';

interface TemplateCardProps {
  template: EmailTemplate;
  onEdit: (template: EmailTemplate) => void;
  onPreview: (template: EmailTemplate) => void;
  onDuplicate: (template: EmailTemplate) => void;
  onArchive: (template: EmailTemplate) => void;
  onTestSend: (template: EmailTemplate) => void;
}

export function TemplateCard({
  template,
  onEdit,
  onPreview,
  onDuplicate,
  onArchive,
  onTestSend,
}: TemplateCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-200">Ativo</Badge>;
      case 'draft':
        return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-200">Rascunho</Badge>;
      case 'archived':
        return <Badge variant="secondary">Arquivado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formattedDate = new Date(template.updated_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col justify-between rounded-lg border bg-card p-5 shadow-sm transition-all hover:shadow-md">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base text-foreground line-clamp-1">{template.name}</h3>
          {getStatusBadge(template.status)}
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2">
          <span className="font-medium text-foreground">Assunto:</span> {template.subject_template}
        </p>

        {template.preheader && (
          <p className="text-xs text-muted-foreground/80 line-clamp-1 italic">
            {template.preheader}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
          {template.category && (
            <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 font-medium">
              <Tag className="h-3 w-3" />
              {template.category}
            </span>
          )}
          <span>Atualizado em {formattedDate}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-1 border-t pt-4 mt-4">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => onEdit(template)} className="gap-1.5 h-8 px-2.5">
            <Edit3 className="h-3.5 w-3.5" />
            Editar
          </Button>

          <Button variant="ghost" size="sm" onClick={() => onPreview(template)} className="h-8 px-2" title="Prévia">
            <Eye className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="sm" onClick={() => onDuplicate(template)} className="h-8 px-2" title="Duplicar">
            <Copy className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="sm" onClick={() => onTestSend(template)} className="h-8 px-2 text-blue-600 hover:text-blue-700" title="Enviar teste">
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {template.status !== 'archived' && (
          <Button variant="ghost" size="sm" onClick={() => onArchive(template)} className="h-8 px-2 text-muted-foreground hover:text-destructive" title="Arquivar">
            <Archive className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
