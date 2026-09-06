'use client';

import type { BlockType } from '../types';
import { Type, Heading, Image, MousePointerClick, Minus, ArrowUpDown, Code } from 'lucide-react';

interface TemplateBlockPaletteProps {
  onAddBlock: (type: BlockType) => void;
}

export function TemplateBlockPalette({ onAddBlock }: TemplateBlockPaletteProps) {
  const blocks: Array<{ type: BlockType; label: string; icon: typeof Type }> = [
    { type: 'heading', label: 'Título (H1-H3)', icon: Heading },
    { type: 'text', label: 'Texto / Parágrafo', icon: Type },
    { type: 'button', label: 'Botão CTA', icon: MousePointerClick },
    { type: 'image', label: 'Imagem', icon: Image },
    { type: 'divider', label: 'Linha Divisória', icon: Minus },
    { type: 'spacer', label: 'Espaçador', icon: ArrowUpDown },
    { type: 'html', label: 'HTML Personalizado', icon: Code },
  ];

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
      <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Paleta de Blocos</h4>
      <div className="grid grid-cols-1 gap-2">
        {blocks.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.type}
              type="button"
              onClick={() => onAddBlock(item.type)}
              className="flex items-center gap-2.5 rounded-md border border-border bg-background p-2.5 text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-left"
            >
              <Icon className="h-4 w-4 text-primary shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
