'use client';

import type { TemplateBlock } from '../../types';

interface BlockProps {
  block: TemplateBlock;
  onChange: (props: Partial<TemplateBlock['props']>) => void;
}

export function HtmlBlock({ block, onChange }: BlockProps) {
  const code = block.props.code || block.props.html || '';

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">Código HTML Personalizado</label>
      <textarea
        value={code}
        onChange={(e) => onChange({ code: e.target.value, html: e.target.value })}
        placeholder="<div>Conteúdo HTML bruto...</div>"
        className="block w-full rounded-md border bg-muted/30 p-3 font-mono text-xs min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}
