'use client';

import type { TemplateBlock } from '../../types';
import { Input } from '@/components/ui/input';

interface BlockProps {
  block: TemplateBlock;
  onChange: (props: Partial<TemplateBlock['props']>) => void;
}

export function ButtonBlock({ block, onChange }: BlockProps) {
  const label = block.props.label || '';
  const url = block.props.url || '';
  const align = block.props.align || 'left';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Texto do Botão</label>
        <Input
          value={label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Conversar com especialista"
          className="text-xs"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Link / URL de Destino</label>
        <Input
          type="url"
          value={url}
          onChange={(e) => onChange({ url: e.target.value })}
          placeholder="https://avaliasolar.com.br"
          className="text-xs"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Alinhamento</label>
        <div className="flex gap-1 pt-0.5">
          {(['left', 'center', 'right'] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => onChange({ align: a })}
              className={`flex-1 py-1 text-xs rounded border capitalize ${
                align === a ? 'bg-primary text-primary-foreground border-primary font-medium' : 'bg-background hover:bg-muted'
              }`}
            >
              {a === 'left' ? 'Esq' : a === 'center' ? 'Centro' : 'Dir'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
