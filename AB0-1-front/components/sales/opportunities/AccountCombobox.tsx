'use client';

import { useState } from 'react';
import { Building2, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useSalesAccountOptions } from '@/lib/api/sales/queries';

interface AccountComboboxProps {
  value: string;
  onChange: (value: string) => void;
  onInlineCreate: () => void;
  disabled?: boolean;
}

export default function AccountCombobox({ value, onChange, onInlineCreate, disabled }: AccountComboboxProps) {
  const [search, setSearch] = useState('');
  const { data: accounts = [], isLoading } = useSalesAccountOptions(search);

  return (
    <Select
      value={value}
      onValueChange={(val) => {
        if (val === 'NEW_ACCOUNT') {
          onInlineCreate();
        } else {
          onChange(val);
        }
      }}
      disabled={disabled}
    >
      <SelectTrigger className="h-11 border-slate-300 text-xs rounded-xl px-4 bg-white shadow-2xs focus:ring-2 focus:ring-indigo-500/20">
        <div className="flex items-center gap-2.5 truncate">
          <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
          <SelectValue placeholder="Selecione a empresa..." />
        </div>
      </SelectTrigger>
      <SelectContent className="w-[340px] max-h-[290px] rounded-xl shadow-xl">
        <div className="p-2.5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <Input
              placeholder="Buscar empresa por nome ou domínio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 text-xs border-slate-200 bg-slate-50 focus:bg-white rounded-lg"
            />
          </div>
        </div>

        <SelectItem value="NEW_ACCOUNT" className="font-bold text-indigo-900 border-b border-slate-100 py-3 cursor-pointer">
          + Criar Nova Empresa (Inline)
        </SelectItem>

        {isLoading ? (
          <div className="p-4 text-center text-xs text-slate-400">Carregando empresas...</div>
        ) : accounts.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500">Nenhuma empresa encontrada</div>
        ) : (
          accounts.map((acc: any) => (
            <SelectItem key={acc.id} value={String(acc.id)} className="text-xs py-2.5 px-3">
              <span className="font-semibold text-slate-900">{acc.name}</span>
              {acc.domain && <span className="text-slate-400 ml-1.5 font-normal">({acc.domain})</span>}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
