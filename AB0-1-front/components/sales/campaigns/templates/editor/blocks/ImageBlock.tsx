'use client';

import type { TemplateBlock } from '../../types';
import { Input } from '@/components/ui/input';

interface BlockProps {
  block: TemplateBlock;
  onChange: (props: Partial<TemplateBlock['props']>) => void;
}

export function ImageBlock({ block, onChange }: BlockProps) {
  const url = block.props.url || block.props.src || '';
  const alt = block.props.alt || '';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">URL da Imagem</label>
        <Input
          type="url"
          value={url}
          onChange={(e) => onChange({ url: e.target.value, src: e.target.value })}
          placeholder="https://exemplo.com/imagem.png"
          className="text-xs"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Texto Alternativo (Alt)</label>
        <Input
          value={alt}
          onChange={(e) => onChange({ alt: e.target.value })}
          placeholder="Descrição da imagem"
          className="text-xs"
        />
      </div>
    </div>
  );
}
