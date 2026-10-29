'use client';

import { useState } from 'react';
import type { EmailTemplate, EmailTemplatePayload, TemplateBlock, BlockType, VariableGroup, TemplateStatus } from '../types';
import { TemplateMetadataForm } from './TemplateMetadataForm';
import { TemplateBlockPalette } from './TemplateBlockPalette';
import { TemplateComposer } from './TemplateComposer';
import { TemplateVariablePanel } from '../variables/TemplateVariablePanel';
import AIClaimWarnings from '@/components/sales/ai/writing/AIClaimWarnings';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Eye, Send, Sparkles, Wand2, Loader2 } from 'lucide-react';
import { createAiGeneration } from '@/lib/api/sales/ai';
import type { CrmAiWarning } from '@/lib/api/sales/aiTypes';
import { toast } from 'sonner';

interface TemplateEditorProps {
  initialTemplate?: EmailTemplate | Partial<EmailTemplate> | null;
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

  // AI Assistant in Editor State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [warnings, setWarnings] = useState<CrmAiWarning[]>([]);

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

  const handleAiSuggestBlock = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    setWarnings([]);

    try {
      const response = await createAiGeneration({
        feature: 'template_block_edit',
        action: 'suggest_blocks',
        instructions: `Gerar blocos adicionais para template de ${category}. Instrução: ${aiPrompt.trim()}`,
        draft: {
          subject,
          preheader,
          blocks,
        },
      });

      if (response.warnings?.length) {
        setWarnings(response.warnings);
      }

      const generatedBlocks = response.result.body_json?.blocks;
      if (Array.isArray(generatedBlocks) && generatedBlocks.length > 0) {
        setBlocks((prev) => [...prev, ...generatedBlocks]);
        markDirty();
        setAiPrompt('');
        toast.success(`${generatedBlocks.length} bloco(s) sugerido(s) pela IA inserido(s).`);
      } else if (response.result.body_text) {
        handleAddBlock('text');
        toast.success('Bloco de texto sugerido adicionado ao template.');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Falha ao consultar assistente de IA.');
    } finally {
      setAiGenerating(false);
    }
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
              {initialTemplate && 'id' in initialTemplate ? `Editar: ${name || initialTemplate.name}` : (name ? `Novo Template: ${name}` : 'Novo Template de E-mail')}
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

      {/* AI Block Assistant Strip */}
      <div className="p-3 bg-indigo-50/60 border border-indigo-200/80 rounded-xl space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-950">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Assistente de Blocos com IA (OpenRouter)</span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Descreva novos blocos (ex: &quot;adicionar botão de diagnóstico com link seguro&quot;)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Instrução para a IA (ex: sugerir bloco de call-to-action focado em agendamento solar)..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAiSuggestBlock();
              }
            }}
            className="flex-1 text-xs px-3 py-1.5 rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAiSuggestBlock}
            disabled={aiGenerating || !aiPrompt.trim()}
            className="gap-1.5 h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
          >
            {aiGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            Gerar Bloco
          </Button>
        </div>

        {warnings.length > 0 && <AIClaimWarnings warnings={warnings} />}
      </div>

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
