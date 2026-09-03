'use client';

import { User } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSalesContactOptions } from '@/lib/api/sales/queries';

interface ContactComboboxProps {
  accountId?: string | number;
  value: string;
  onChange: (value: string) => void;
  onInlineCreate: () => void;
  disabled?: boolean;
}

export default function ContactCombobox({ accountId, value, onChange, onInlineCreate, disabled }: ContactComboboxProps) {
  const { data: contacts = [], isLoading } = useSalesContactOptions(accountId);

  const isDisabled = disabled || !accountId;

  return (
    <Select
      value={value}
      onValueChange={(val) => {
        if (val === 'NEW_CONTACT') {
          onInlineCreate();
        } else {
          onChange(val);
        }
      }}
      disabled={isDisabled}
    >
      <SelectTrigger className="h-11 border-slate-300 text-xs rounded-xl px-4 bg-white shadow-2xs focus:ring-2 focus:ring-sky-500/20">
        <div className="flex items-center gap-2.5 truncate">
          <User className="w-4 h-4 text-sky-600 shrink-0" />
          <SelectValue placeholder={accountId ? 'Selecione contato principal...' : 'Selecione empresa primeiro'} />
        </div>
      </SelectTrigger>
      <SelectContent className="w-[320px] max-h-[270px] rounded-xl shadow-xl">
        <SelectItem value="NEW_CONTACT" className="font-bold text-sky-900 border-b border-slate-100 py-3 cursor-pointer">
          + Criar Novo Contato (Inline)
        </SelectItem>

        {isLoading ? (
          <div className="p-4 text-center text-xs text-slate-400">Carregando contatos...</div>
        ) : contacts.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500">Nenhum contato nesta empresa</div>
        ) : (
          contacts.map((c: any) => (
            <SelectItem key={c.id} value={String(c.id)} className="text-xs py-2.5 px-3">
              <span className="font-semibold text-slate-900">{c.name || `${c.first_name} ${c.last_name || ''}`}</span>
              {c.job_title && <span className="text-slate-400 ml-1.5 font-normal">— {c.job_title}</span>}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
