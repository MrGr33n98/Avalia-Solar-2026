'use client';

import React, { useState, useMemo } from 'react';
import { useCategoriesTree, CategoryTreeNode } from '@/hooks/useCategoriesTree';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CompanyCategoryPickerProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm?: () => void;
  embedded?: boolean;
}

export function CompanyCategoryPicker({
  selectedIds,
  onChange,
  onClose,
  onCancel,
  onConfirm,
  embedded = false,
}: CompanyCategoryPickerProps) {
  const { categories, loading, filterCategories } = useCategoriesTree();
  const [searchTerm, setSearchTerm] = useState('');

  // Filtragem da árvore reativa e sem acentos / case insensitive (embutida no filterCategories)
  const filteredTree = useMemo(() => {
    return filterCategories(categories, searchTerm);
  }, [categories, searchTerm, filterCategories]);

  const handleToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleClear = () => {
    onChange([]);
  };

  // Mantém a hierarquia legível sem consumir espaço demais em telas estreitas.
  const renderCategoryNode = (node: CategoryTreeNode, depth: number = 0) => {
    const isSelected = selectedIds.includes(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id}>
        <label
          htmlFor={`picker-cat-${node.id}`}
          className={cn(
            'flex min-h-12 w-full cursor-pointer select-none items-center gap-3 border-b border-slate-100 pr-4 transition-colors active:bg-slate-100/70 motion-reduce:transition-none',
            'supports-[hover:hover]:hover:bg-slate-50',
            depth === 0 ? 'pl-4' : depth === 1 ? 'pl-7' : 'pl-10',
            isSelected && 'bg-blue-50/30'
          )}
        >
          <Checkbox
            id={`picker-cat-${node.id}`}
            checked={isSelected}
            onCheckedChange={() => handleToggle(node.id)}
            aria-label={`Selecionar categoria ${node.name}`}
            className="relative -mx-4 h-12 w-12 border-0 bg-transparent text-white shadow-none before:pointer-events-none before:absolute before:left-1/2 before:top-1/2 before:h-[16px] before:w-[16px] before:-translate-x-1/2 before:-translate-y-1/2 before:rounded before:border before:border-slate-300 before:bg-white before:content-[''] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0 data-[state=checked]:bg-transparent data-[state=checked]:before:border-blue-600 data-[state=checked]:before:bg-blue-600 [&_span]:relative [&_span]:z-10 [&_svg]:h-3 [&_svg]:w-3"
          />
          <span
            className={cn(
              'min-w-0 py-2.5 text-left text-sm font-medium leading-snug text-slate-700',
              depth === 0 && 'font-semibold text-slate-900',
              isSelected && 'text-blue-700'
            )}
          >
            {node.name}
          </span>
        </label>

        {hasChildren && (
          <div>{node.children.map((child) => renderCategoryNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        'flex h-full max-h-[min(80dvh,640px)] flex-col overflow-hidden bg-white',
        embedded ? 'rounded-xl' : 'rounded-t-2xl'
      )}
    >
      {/* Search Header */}
      <div className="sticky top-0 z-10 shrink-0 border-b border-slate-100 bg-white p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar categorias..."
            aria-label="Buscar categorias"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-[44px] w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-10 text-sm text-slate-800 transition-colors placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
          />
          {searchTerm && (
            <button
              type="button"
              aria-label="Limpar busca de categorias"
              onClick={() => setSearchTerm('')}
              className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tree Content */}
      <div className="min-h-[250px] flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 mb-2" />
            <span className="text-xs">Carregando categorias...</span>
          </div>
        ) : filteredTree.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center">
            <span className="text-sm font-medium">Nenhuma categoria encontrada</span>
            <span className="text-xs mt-1">Tente buscar por outro termo.</span>
          </div>
        ) : (
          filteredTree.map((root) => renderCategoryNode(root, 0))
        )}
      </div>

      {/* Footer Controls */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={selectedIds.length === 0}
          className="text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          Limpar Seleção
        </Button>
        <div className="flex items-center gap-2">
          {onClose && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel || onClose}
              className="text-xs rounded-lg border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </Button>
          )}
          <Button
            size="sm"
            onClick={onConfirm || onClose}
            disabled={!onConfirm && !onClose}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-semibold shadow-sm shadow-blue-500/10 transition-colors"
          >
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
}
