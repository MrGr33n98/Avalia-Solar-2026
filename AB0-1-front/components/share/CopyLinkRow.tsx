'use client';

import { Copy } from 'lucide-react';
import { toast } from 'sonner';

export function CopyLinkRow({ url }: { url: string }) {
  const copy = async () => {
    await navigator.clipboard.writeText(url);
    toast.success('Link copiado.');
  };

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
    >
      <Copy className="h-4 w-4 text-blue-700" />
      <span className="min-w-0 flex-1 truncate">{url}</span>
      <span className="text-xs text-blue-700">Copiar</span>
    </button>
  );
}
