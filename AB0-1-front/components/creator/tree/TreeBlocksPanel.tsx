import React, { useState } from 'react';
import { 
  Link2, GripVertical, Plus, Trash2, Pencil, ExternalLink, 
  Share2, Check, SlidersHorizontal 
} from 'lucide-react';
import { type CreatorTreeBlock } from '@/lib/api/creatorTree';
import { toast } from 'sonner';

interface TreeBlocksPanelProps {
  blocks: CreatorTreeBlock[];
  loading: boolean;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (id: number) => void;
  onToggle: (block: CreatorTreeBlock) => void;
  onOpenEditor: (block?: CreatorTreeBlock) => void;
  blockTypeLabels: Record<string, string>;
  blockIconByType: Record<string, React.ElementType>;
}

export function TreeBlocksPanel({
  blocks,
  loading,
  onMove,
  onRemove,
  onToggle,
  onOpenEditor,
  blockTypeLabels,
  blockIconByType
}: TreeBlocksPanelProps) {
  return (
    <div className="space-y-3 rounded-[18px] border border-slate-200 bg-white p-4 shadow-[0_8px_30px_rgba(30,94,255,0.03)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-black uppercase tracking-wide text-slate-600">Seus links</h2>
        <div className="flex gap-2">
          <button type="button" className="hidden min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 sm:inline-flex">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Ordenar
          </button>
          <button type="button" onClick={() => onOpenEditor()} className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
            + Adicionar
          </button>
        </div>
      </div>
      
      {loading ? (
        <p className="py-10 text-center text-sm text-slate-500">Carregando links...</p>
      ) : blocks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
          <Link2 className="mx-auto h-8 w-8 text-blue-600" />
          <h2 className="mt-3 font-bold text-slate-900">Seu Tree ainda está vazio</h2>
          <p className="mt-1 text-sm text-slate-500">Adicione seu primeiro link para começar a montar sua página pública.</p>
          <button type="button" onClick={() => onOpenEditor()} className="mt-4 min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
            + Adicionar primeiro link
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.map((block, index) => {
            const Icon = blockIconByType[block.block_type || block.type || 'external_link'] || Link2; 
            return (
              <article key={block.id} className="group relative flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 pr-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md">
                <div className="cursor-grab text-slate-300 hover:text-blue-600">
                  <GripVertical className="h-5 w-5 shrink-0" />
                </div>
                
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-50/50 border border-blue-100 text-blue-700">
                  <Icon className="h-5 w-5" />
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-bold text-slate-900">{block.title}</h2>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${block.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      {block.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {blockTypeLabels[block.block_type || block.type || 'external_link']} {block.url ? ` · ${block.url}` : ''}
                  </p>
                </div>
                
                <div className="hidden min-w-14 text-center sm:block">
                  <p className="font-bold text-slate-800">{block.clicks_count || 0}</p>
                  <p className="text-[10px] text-slate-400">Cliques</p>
                </div>
                
                <div className="flex items-center gap-1.5 ml-auto">
                  <button type="button" onClick={() => onToggle(block)} className={`grid h-8 w-12 place-items-center rounded-full p-1 transition-colors ${block.active ? 'bg-blue-600' : 'bg-slate-200'}`} aria-label={block.active ? 'Desativar bloco' : 'Ativar bloco'}>
                    <span className={`h-6 w-6 rounded-full bg-white transition-transform shadow-sm ${block.active ? 'translate-x-2' : '-translate-x-2'}`} />
                  </button>
                  <button type="button" aria-label="Editar bloco" onClick={() => onOpenEditor(block)} className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" aria-label="Remover bloco" onClick={() => onRemove(block.id)} className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="absolute right-[-40px] hidden flex-col gap-1 sm:group-hover:flex">
                  <button type="button" onClick={() => onMove(index, -1)} className="grid h-8 w-8 place-items-center rounded-lg text-xs text-slate-400 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-blue-600 transition-colors">
                    ↑
                  </button>
                  <button type="button" onClick={() => onMove(index, 1)} className="grid h-8 w-8 place-items-center rounded-lg text-xs text-slate-400 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-blue-600 transition-colors">
                    ↓
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
