'use client';

import type { TemplateBlock } from '../types';
import { HeadingBlock } from './blocks/HeadingBlock';
import { TextBlock } from './blocks/TextBlock';
import { ImageBlock } from './blocks/ImageBlock';
import { ButtonBlock } from './blocks/ButtonBlock';
import { DividerBlock } from './blocks/DividerBlock';
import { SpacerBlock } from './blocks/SpacerBlock';
import { HtmlBlock } from './blocks/HtmlBlock';
import { ChevronUp, ChevronDown, Trash2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TemplateComposerProps {
  blocks: TemplateBlock[];
  onUpdateBlock: (id: string, props: Partial<TemplateBlock['props']>) => void;
  onRemoveBlock: (id: string) => void;
  onMoveBlock: (id: string, direction: 'up' | 'down') => void;
  legacyHtml: string;
  onLegacyHtmlChange: (html: string) => void;
  isLegacyMode: boolean;
  onToggleLegacyMode: () => void;
}

export function TemplateComposer({
  blocks,
  onUpdateBlock,
  onRemoveBlock,
  onMoveBlock,
  legacyHtml,
  onLegacyHtmlChange,
  isLegacyMode,
  onToggleLegacyMode,
}: TemplateComposerProps) {
  if (isLegacyMode) {
    return (
      <div className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between border-b pb-2">
          <h4 className="font-semibold text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Modo HTML Legado
          </h4>
          <Button variant="outline" size="sm" onClick={onToggleLegacyMode} className="h-7 text-xs">
            Alternar para Editor Estruturado
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Este template utiliza HTML bruto direto. Você pode editar o código diretamente abaixo.
        </p>

        <textarea
          value={legacyHtml}
          onChange={(e) => onLegacyHtmlChange(e.target.value)}
          placeholder="<html><body><p>Conteúdo HTML legado...</p></body></html>"
          className="block w-full rounded-md border bg-muted/20 p-4 font-mono text-xs min-h-[300px] focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-2">
        <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
          Compositor de E-mail ({blocks.length} blocos)
        </h4>

        {blocks.length === 0 && (
          <Button variant="ghost" size="sm" onClick={onToggleLegacyMode} className="h-7 text-xs text-muted-foreground">
            Usar HTML Legado
          </Button>
        )}
      </div>

      {blocks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg text-center space-y-3 bg-muted/20">
          <div className="p-3 rounded-full bg-muted text-muted-foreground">
            <Layers className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-sm">Seu e-mail está vazio</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Clique em um bloco na paleta ao lado para começar a compor o conteúdo do seu e-mail.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.map((block, index) => (
            <div
              key={block.id}
              className="group relative rounded-lg border bg-card p-4 shadow-sm transition-all hover:border-primary/50"
            >
              <div className="flex items-center justify-between border-b pb-2 mb-3">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Bloco {index + 1}: {block.type}
                </span>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={index === 0}
                    onClick={() => onMoveBlock(block.id, 'up')}
                    className="h-7 w-7 p-0"
                    title="Mover para cima"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={index === blocks.length - 1}
                    onClick={() => onMoveBlock(block.id, 'down')}
                    className="h-7 w-7 p-0"
                    title="Mover para baixo"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveBlock(block.id)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    title="Remover bloco"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {block.type === 'heading' && (
                <HeadingBlock block={block} onChange={(props) => onUpdateBlock(block.id, props)} />
              )}
              {block.type === 'text' && (
                <TextBlock block={block} onChange={(props) => onUpdateBlock(block.id, props)} />
              )}
              {block.type === 'image' && (
                <ImageBlock block={block} onChange={(props) => onUpdateBlock(block.id, props)} />
              )}
              {block.type === 'button' && (
                <ButtonBlock block={block} onChange={(props) => onUpdateBlock(block.id, props)} />
              )}
              {block.type === 'divider' && <DividerBlock />}
              {block.type === 'spacer' && (
                <SpacerBlock block={block} onChange={(props) => onUpdateBlock(block.id, props)} />
              )}
              {block.type === 'html' && (
                <HtmlBlock block={block} onChange={(props) => onUpdateBlock(block.id, props)} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
