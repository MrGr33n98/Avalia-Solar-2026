'use client';

import { useState } from 'react';
import type { EmailTemplate, EmailTemplatePayload, TemplateBlock, BlockType, VariableGroup, TemplateStatus } from '../types';
import { TemplateMetadataForm } from './TemplateMetadataForm';
import { TemplateBlockPalette } from './TemplateBlockPalette';
import { TemplateComposer } from './TemplateComposer';
import { TemplateVariablePanel } from '../variables/TemplateVariablePanel';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Eye, Send } from 'lucide-react';

interface TemplateEditorProps {
  initialTemplate?: EmailTemplate | null;
  variableGroups: VariableGroup[];
  onSave: (payload: EmailTemplatePayload) => Promise<void>;
  onCancel: () => void;
  onPreview: (templateData: Partial<EmailTemplate>) => void;
  onTestSend: (templateData: Partial<EmailTemplate>) => void;
  busy: boolean;
}

export function TemplateEditor({
  initialTemplate,
  variableGroups,
  onSave,
  onCancel,
  onPreview,
  onTestSend,
  busy,
}: TemplateEditorProps) {
  const [name, setName] = useState(initialTemplate?.name || '');
  const [subject, setSubject] = useState(initialTemplate?.subject_template || '');
  const [preheader, setPreheader] = useState(initialTemplate?.preheader || '');
  const [category, setCategory] = useState(initialTemplate?.category || 'Prospecção');
  const [status, setStatus] = useState<TemplateStatus>(initialTemplate?.status || 'active');
  const [isPrivate, setIsPrivate] = useState(!initialTemplate?.shared);
  const [blocks, setBlocks] = useState<TemplateBlock[]>(initialTemplate?.body_json?.blocks || []);
  const [legacyHtml, setLegacyHtml] = useState(initialTemplate?.body_html || '');
  const [isLegacyMode, setIsLegacyMode] = useState(!initialTemplate?.body_json?.blocks?.length && !!initialTemplate?.body_html);
  const [isDirty, setIsDirty] = useState(false);

  const markDirty = () => setIsDirty(true);

  const handleAddBlock = (type: BlockType) => {
    const newBlock: TemplateBlock = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type,
      props:
        type === 'heading'
          ? { text: 'Novo Título', level: 1 }
          : type === 'text'
          ? { html: '<p>Digite o texto do e-mail...</p>', text: 'Digite o texto do e-mail...' }
          : type === 'button'
          ? { label: 'Clique aqui', url: 'https://avaliasolar.com.br', align: 'left' }
          : type === 'image'
          ? { url: '', alt: 'Imagem do e-mail' }
          : type === 'spacer'
          ? { height: 20 }
          : {},
    };
    setBlocks((prev) => [...prev, newBlock]);
    markDirty();
  };

  const handleUpdateBlock = (id: string, newProps: Partial<TemplateBlock['props']>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, props: { ...b.props, ...newProps } } : b))
    );
    markDirty();
  };

  const handleRemoveBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    markDirty();
  };

  const handleMoveBlock = (id: string, direction: 'up' | 'down') => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      if (direction === 'up' && idx === 0) return prev;
      if (direction === 'down' && idx === prev.length - 1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      const arr = [...prev];
      const [moved] = arr.splice(idx, 1);
      arr.splice(targetIdx, 0, moved);
      return arr;
    });
    markDirty();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: EmailTemplatePayload = {
      name,
      subject_template: subject,
      preheader,
      category,
      status,
      private: isPrivate,
      body_json: isLegacyMode ? undefined : { version: 1, blocks },
      body_html: isLegacyMode ? legacyHtml : undefined,
    };
    await onSave(payload);
    setIsDirty(false);
  };

  const getCurrentTemplateData = (): Partial<EmailTemplate> => ({
    id: initialTemplate?.id,
    name,
    subject_template: subject,
    preheader,
    category,
    status,
    body_json: isLegacyMode ? undefined : { version: 1, blocks },
    body_html: isLegacyMode ? legacyHtml : undefined,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={onCancel} className="gap-1.5 h-8">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {initialTemplate ? `Editar: ${initialTemplate.name}` : 'Novo Template de E-mail'}
            </h2>
            {isDirty && <span className="text-xs text-amber-600 font-medium">* Alterações não salvas</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPreview(getCurrentTemplateData())}
            className="gap-1.5 h-8"
          >
            <Eye className="h-4 w-4" />
            Prévia
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onTestSend(getCurrentTemplateData())}
            className="gap-1.5 h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Send className="h-4 w-4" />
            Enviar Teste
          </Button>

          <Button type="submit" disabled={busy} size="sm" className="gap-1.5 h-8">
            <Save className="h-4 w-4" />
            {busy ? 'Salvando...' : 'Salvar Template'}
          </Button>
        </div>
      </div>

      <TemplateMetadataForm
        name={name}
        onNameChange={(val) => { setName(val); markDirty(); }}
        subject={subject}
        onSubjectChange={(val) => { setSubject(val); markDirty(); }}
        preheader={preheader}
        onPreheaderChange={(val) => { setPreheader(val); markDirty(); }}
        category={category}
        onCategoryChange={(val) => { setCategory(val); markDirty(); }}
        status={status}
        onStatusChange={(val) => { setStatus(val); markDirty(); }}
        isPrivate={isPrivate}
        onPrivateChange={(val) => { setIsPrivate(val); markDirty(); }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {!isLegacyMode && (
          <div className="lg:col-span-3">
            <TemplateBlockPalette onAddBlock={handleAddBlock} />
          </div>
        )}

        <div className={isLegacyMode ? 'lg:col-span-9' : 'lg:col-span-6'}>
          <TemplateComposer
            blocks={blocks}
            onUpdateBlock={handleUpdateBlock}
            onRemoveBlock={handleRemoveBlock}
            onMoveBlock={handleMoveBlock}
            legacyHtml={legacyHtml}
            onLegacyHtmlChange={(val) => { setLegacyHtml(val); markDirty(); }}
            isLegacyMode={isLegacyMode}
            onToggleLegacyMode={() => setIsLegacyMode(!isLegacyMode)}
          />
        </div>

        <div className="lg:col-span-3">
          <TemplateVariablePanel groups={variableGroups} />
        </div>
      </div>
    </form>
  );
}
