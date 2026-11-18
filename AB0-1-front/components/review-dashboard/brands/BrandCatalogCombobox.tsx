'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Check, AlertCircle } from 'lucide-react';
import { BrandAvatar } from './BrandAvatar';
import { fetchBrandCatalog, type BrandCatalogItem } from '@/lib/api/brands';

export interface BrandCatalogComboboxProps {
  value: BrandCatalogItem | null;
  onSelect: (brand: BrandCatalogItem | null) => void;
  disabled?: boolean;
  className?: string;
}

export function BrandCatalogCombobox({
  value,
  onSelect,
  disabled = false,
  className = '',
}: BrandCatalogComboboxProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BrandCatalogItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Busca debounced no catálogo oficial
  useEffect(() => {
    if (!isOpen) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetchBrandCatalog({
          q: query.trim(),
          limit: 20,
          signal: controller.signal,
        });
        setResults(resp.data);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError('Não foi possível carregar o catálogo de fabricantes.');
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, isOpen]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <label
        htmlFor="brand-catalog-search"
        className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
      >
        Fabricante / Marca Oficial <span className="text-red-500">*</span>
      </label>

      {/* Input de busca */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#17468D]" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        <input
          id="brand-catalog-search"
          type="text"
          value={isOpen ? query : value ? value.name : ''}
          placeholder={value ? value.name : 'Buscar fabricante (ex: Fronius, WEG, Solis)...'}
          disabled={disabled}
          onFocus={() => {
            setIsOpen(true);
            setQuery(value ? value.name : '');
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#17468D] focus:border-[#17468D] bg-white text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
          autoComplete="off"
        />

        {value && !isOpen && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Check className="w-4 h-4 text-emerald-600" />
          </div>
        )}
      </div>

      {/* Dropdown com resultados canônicos */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-60 overflow-y-auto">
          {error ? (
            <div className="p-3 text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="p-4 text-center text-xs text-slate-500">
              <p className="font-medium text-slate-700 mb-1">
                Nenhum fabricante encontrado
              </p>
              <p className="text-[11px] text-slate-400">
                Apenas marcas canônicas cadastradas podem ser vinculadas.
              </p>
            </div>
          ) : (
            <ul className="py-1 divide-y divide-slate-100" role="listbox">
              {results.map((brand) => {
                const isSelected = value?.id === brand.id;
                return (
                  <li
                    key={brand.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onSelect(brand);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${
                      isSelected ? 'bg-blue-50 text-[#17468D]' : 'text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BrandAvatar
                        name={brand.name}
                        logoUrl={brand.logo_url}
                        initials={brand.initials}
                        size={24}
                      />
                      <span className="font-semibold truncate">{brand.name}</span>
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#17468D] flex-shrink-0" />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
