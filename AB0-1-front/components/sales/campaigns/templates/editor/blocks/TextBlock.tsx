'use client';

import type { TemplateBlock } from '../../types';

interface BlockProps {
  block: TemplateBlock;
  onChange: (props: Partial<TemplateBlock['props']>) => void;
}

export function TextBlock({ block, onChange }: BlockProps) {
  const html = block.props.html || block.props.text || '';

  return (
    <div className="space-y-1.5">
      <textarea
        value={html}
        onChange={(e) => onChange({ html: e.target.value, text: e.target.value })}
        placeholder="Escreva o conteúdo do parágrafo aqui... Você pode usar tags HTML básicas como <p>, <strong>, <em> e variáveis dinâmicas como {{person.first_name}}"
        className="block w-full rounded-md border bg-background p-3 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}
