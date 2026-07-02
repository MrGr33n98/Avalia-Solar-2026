'use client';

import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import type { SearchTab } from './SearchTabs';

export type PriceRange = 'all' | 'under_1000' | '1000_3000' | '3000_5000' | 'over_5000';

export interface SearchFilterState {
  includeProducts: boolean;
  includeCompanies: boolean;
  category: string;
  brand: string;
  city: string;
  priceRange: PriceRange;
  verifiedOnly: boolean;
}

interface SearchFiltersProps {
  value: SearchFilterState;
  counts: Record<SearchTab, number>;
  categories: string[];
  brands: string[];
  onChange: (value: SearchFilterState) => void;
  onReset: () => void;
  onApply?: () => void;
}

export const defaultSearchFilters: SearchFilterState = {
  includeProducts: true,
  includeCompanies: true,
  category: '',
  brand: '',
  city: '',
  priceRange: 'all',
  verifiedOnly: false,
};

export function SearchFilters({
  value,
  counts,
  categories,
  brands,
  onChange,
  onReset,
  onApply,
}: SearchFiltersProps) {
  const update = <Key extends keyof SearchFilterState>(key: Key, next: SearchFilterState[Key]) =>
    onChange({ ...value, [key]: next });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-950">
          <SlidersHorizontal className="h-4 w-4 text-blue-600" />
          Filtros
        </h2>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Limpar filtros
        </button>
      </div>

      <fieldset className="mt-6 space-y-3">
        <legend className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
          Tipo de resultado
        </legend>
        <FilterCheckbox
          label="Produtos"
          count={counts.products}
          checked={value.includeProducts}
          onChange={(checked) => update('includeProducts', checked)}
        />
        <FilterCheckbox
          label="Empresas"
          count={counts.companies}
          checked={value.includeCompanies}
          onChange={(checked) => update('includeCompanies', checked)}
        />
        <FilterCheckbox label="Avaliações" count={counts.reviews} checked={false} disabled />
      </fieldset>

      <div className="mt-6 space-y-4 border-t border-slate-100 pt-5">
        <FilterSelect
          label="Categoria"
          value={value.category}
          onChange={(next) => update('category', next)}
          options={categories}
          placeholder="Todas"
        />
        <FilterSelect
          label="Marca"
          value={value.brand}
          onChange={(next) => update('brand', next)}
          options={brands}
          placeholder="Todas as marcas"
        />
        <label className="block text-sm font-semibold text-slate-700">
          Cidade / UF
          <input
            value={value.city}
            onChange={(event) => update('city', event.target.value)}
            placeholder="Digite uma cidade ou UF"
            className="mt-2 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Faixa de preço
          <select
            value={value.priceRange}
            onChange={(event) => update('priceRange', event.target.value as PriceRange)}
            className="mt-2 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">Todas as faixas</option>
            <option value="under_1000">Até R$ 1.000</option>
            <option value="1000_3000">R$ 1.000 a R$ 3.000</option>
            <option value="3000_5000">R$ 3.000 a R$ 5.000</option>
            <option value="over_5000">Acima de R$ 5.000</option>
          </select>
        </label>
      </div>

      <label className="mt-5 flex cursor-pointer items-center justify-between gap-4 border-t border-slate-100 pt-5 text-sm font-semibold text-slate-700">
        Apenas verificados
        <input
          type="checkbox"
          checked={value.verifiedOnly}
          onChange={(event) => update('verifiedOnly', event.target.checked)}
          className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
      </label>

      <button
        type="button"
        onClick={onApply}
        className="mt-6 h-11 w-full rounded-lg border border-blue-600 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-50"
      >
        Aplicar filtros
      </button>
    </div>
  );
}

function FilterCheckbox({
  label,
  count,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  count: number;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
      />
      <span>{label}</span>
      <span className="text-xs text-slate-400">({count})</span>
    </label>
  );
}

function FilterSelect({
  label,
  value,
  options,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
