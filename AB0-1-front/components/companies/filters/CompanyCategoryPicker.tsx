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

  // Helper para renderizar a árvore recursivamente de forma limpa e bonita
  const renderCategoryNode = (node: CategoryTreeNode, depth: number = 0) => {
    const isSelected = selectedIds.includes(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="space-y-1">
        <div
          className={`flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-all duration-200 select-none ${
            isSelected
              ? 'bg-blue-50/70 border border-blue-100'
              : 'hover:bg-slate-50 border border-transparent'
          }`}
          style={{ paddingLeft: `${Math.max(12, depth * 20)}px` }}
          onClick={() => handleToggle(node.id)}
        >
          <div className="flex items-center gap-3 min-w-0">
            <Checkbox
              id={`picker-cat-${node.id}`}
              checked={isSelected}
              onCheckedChange={() => handleToggle(node.id)}
              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 shrink-0"
              onClick={(e) => e.stopPropagation()}
            />
            <label
              htmlFor={`picker-cat-${node.id}`}
              className={`text-sm cursor-pointer transition-colors leading-snug truncate ${
                depth === 0 ? 'font-semibold text-slate-800' : 'text-slate-600'
              } ${isSelected ? 'text-blue-700 font-medium' : ''}`}
              onClick={(e) => e.stopPropagation()}
            >
              {node.name}
            </label>
          </div>
          {node.companies_count !== undefined && node.companies_count > 0 && (
            <span className="ml-2 shrink-0 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
              {node.companies_count}
            </span>
          )}
        </div>

        {hasChildren && (
          <div className="space-y-1">
            {node.children.map((child) => renderCategoryNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full max-h-[500px] bg-white overflow-hidden',
        embedded ? 'rounded-xl' : 'rounded-t-2xl'
      )}
    >
      {/* Search Header */}
      <div className="p-4 border-b border-slate-100 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar categorias..."
            aria-label="Buscar categorias"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              type="button"
              aria-label="Limpar busca de categorias"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[250px] max-h-[320px]">
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
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
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
