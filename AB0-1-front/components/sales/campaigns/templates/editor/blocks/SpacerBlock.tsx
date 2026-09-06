'use client';

import type { TemplateBlock } from '../../types';
import { Input } from '@/components/ui/input';

interface BlockProps {
  block: TemplateBlock;
  onChange: (props: Partial<TemplateBlock['props']>) => void;
}

export function SpacerBlock({ block, onChange }: BlockProps) {
  const height = block.props.height || 20;

  return (
    <div className="flex items-center gap-3">
      <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Altura do Espaçador (px):</label>
      <Input
        type="number"
        min={8}
        max={100}
        value={height}
        onChange={(e) => onChange({ height: Number(e.target.value) })}
        className="w-24 text-xs h-8"
      />
    </div>
  );
}
