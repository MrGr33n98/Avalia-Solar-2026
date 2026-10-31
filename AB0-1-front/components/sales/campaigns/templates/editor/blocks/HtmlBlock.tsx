'use client';

import React, { useState, useRef } from 'react';
import type { TemplateBlock, EmailAsset } from '../../types';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon } from 'lucide-react';
import { EmailAssetLibraryDialog } from '../../library/EmailAssetLibraryDialog';

interface BlockProps {
  block: TemplateBlock;
  onChange: (props: Partial<TemplateBlock['props']>) => void;
}

export function HtmlBlock({ block, onChange }: BlockProps) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const code = block.props.code || block.props.html || '';

  const handleInsertImage = (asset: EmailAsset) => {
    const textarea = textareaRef.current;
    const url = asset.public_url || '';
    const alt = asset.alt_text || asset.name;
    const width = asset.width_px ? Math.min(asset.width_px, 560) : 560;

    const imgSnippet = `\n<div style="text-align:center;margin:12px 0;">\n  <img src="${url}" alt="${alt}" width="${width}" style="max-width:100%;height:auto;display:inline-block;border:0;" />\n</div>\n`;

    if (textarea) {
      const start = textarea.selectionStart ?? code.length;
      const end = textarea.selectionEnd ?? code.length;
      const updated = code.substring(0, start) + imgSnippet + code.substring(end);
      onChange({ code: updated, html: updated });
    } else {
      const updated = code + imgSnippet;
      onChange({ code: updated, html: updated });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700">Código HTML Personalizado</label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setLibraryOpen(true)}
          className="h-7 text-xs font-semibold gap-1 text-blue-900 border-blue-200 hover:bg-blue-50"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>+ Inserir Imagem da Biblioteca</span>
        </Button>
      </div>

      <textarea
        ref={textareaRef}
        value={code}
        onChange={(e) => onChange({ code: e.target.value, html: e.target.value })}
        placeholder="<div>Conteúdo HTML bruto...</div>"
        className="block w-full rounded-md border bg-slate-50/50 p-3 font-mono text-xs min-h-[140px] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
      />

      <EmailAssetLibraryDialog
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onSelect={handleInsertImage}
      />
    </div>
  );
}

export default HtmlBlock;
