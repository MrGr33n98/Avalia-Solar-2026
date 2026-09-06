'use client';

import type { TemplateBlock } from '../../types';
import { Input } from '@/components/ui/input';

interface BlockProps {
  block: TemplateBlock;
  onChange: (props: Partial<TemplateBlock['props']>) => void;
}

export function HeadingBlock({ block, onChange }: BlockProps) {
  const level = block.props.level || 1;
  const text = block.props.text || '';

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {([1, 2, 3] as const).map((lvl) => (
          <button
            key={lvl}
            type="button"
            onClick={() => onChange({ level: lvl })}
            className={`px-3 py-1 text-xs rounded border font-medium ${
              level === lvl ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'
            }`}
          >
            H{lvl}
          </button>
        ))}
      </div>

      <Input
        value={text}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder="Título do e-mail..."
        className="font-semibold text-lg"
      />
    </div>
  );
}
