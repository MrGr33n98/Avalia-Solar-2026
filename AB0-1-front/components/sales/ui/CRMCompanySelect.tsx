'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Building2, ChevronDown, Plus, X } from 'lucide-react';
import { salesApi } from '@/lib/api/sales/client';
import { ApiAccount } from '@/lib/api/sales/types';

export interface CompanyOption {
  id?: number;
  name: string;
  domain?: string | null;
  city?: string | null;
  state?: string | null;
}

interface CRMCompanySelectProps {
  value: string;
  selectedAccount?: CompanyOption | null;
  onChange: (companyName: string, account?: CompanyOption | null) => void;
  placeholder?: string;
  className?: string;
}

const AVATAR_BG_COLORS = [
  'bg-indigo-600',
  'bg-blue-600',
  'bg-sky-600',
  'bg-teal-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-purple-600',
  'bg-slate-700',
];

function getInitials(name: string): string {
  if (!name) return 'C';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_BG_COLORS.length;
  return AVATAR_BG_COLORS[index];
}

export default function CRMCompanySelect({
  value,
  selectedAccount,
  onChange,
  placeholder = 'Selecione ou digite o nome da empresa...',
  className = '',
}: CRMCompanySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeAccount, setActiveAccount] = useState<CompanyOption | null>(selectedAccount || null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchAccounts = useCallback(async (searchQuery = '') => {
    setLoading(true);
    try {
      const res = await salesApi.getAccounts({ q: searchQuery, limit: 30, options: true });
      setAccounts(res || []);
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchAccounts(query);
    }
  }, [open, fetchAccounts, query]);

  useEffect(() => {
    if (selectedAccount) {
      setActiveAccount(selectedAccount);
      setQuery(selectedAccount.name);
    } else if (value && !activeAccount) {
      setQuery(value);
    }
  }, [selectedAccount, value, activeAccount]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (acc: ApiAccount) => {
    const opt: CompanyOption = { id: acc.id, name: acc.name, domain: acc.domain, city: acc.city, state: acc.state };
    setActiveAccount(opt);
    setQuery(acc.name);
    onChange(acc.name, opt);
    setOpen(false);
  };

  const handleCreateNew = (nameToCreate: string) => {
    const trimmed = nameToCreate.trim();
    if (!trimmed) return;
    const opt: CompanyOption = { name: trimmed };
    setActiveAccount(opt);
    setQuery(trimmed);
    onChange(trimmed, opt);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveAccount(null);
    setQuery('');
    onChange('', null);
    inputRef.current?.focus();
  };

  const filtered = accounts.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div ref={containerRef} className={`relative w-full font-sans ${className}`}>
      <div
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
        className={`flex items-center justify-between h-10 px-3 rounded-lg border bg-white cursor-pointer transition-all ${
          open ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {activeAccount ? (
            <div className={`w-6 h-6 rounded-md ${getAvatarColor(activeAccount.name)} text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-xs`}>
              {getInitials(activeAccount.name)}
            </div>
          ) : (
            <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
          )}

          <input
            ref={inputRef}
            type="text"
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveAccount(null);
              onChange(e.target.value, null);
              setOpen(true);
            }}
            placeholder={placeholder}
            className="w-full text-xs text-slate-800 bg-transparent outline-hidden placeholder:text-slate-400 font-medium"
          />
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {query ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-11 z-50 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto animate-in fade-in-50 duration-150">
          {loading ? (
            <div className="p-4 text-center text-xs text-slate-500 font-medium">
              Carregando empresas...
            </div>
          ) : (
            <>
              {filtered.length > 0 ? (
                <div className="py-1">
                  {filtered.map((acc) => {
                    const initials = getInitials(acc.name);
                    const bgColor = getAvatarColor(acc.name);
                    const isSelected = activeAccount?.id === acc.id;
                    const location = [acc.city, acc.state].filter(Boolean).join(', ');

                    return (
                      <div
                        key={acc.id}
                        onClick={() => handleSelect(acc)}
                        className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-50 text-indigo-950 font-semibold' : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-md ${bgColor} text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs`}>
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-900 truncate">{acc.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {acc.domain || location || 'Empresa CRM'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 text-center text-xs text-slate-500">
                  Nenhuma empresa cadastrada com "{query}".
                </div>
              )}

              {query.trim().length > 0 && (
                <div
                  onClick={() => handleCreateNew(query)}
                  className="flex items-center gap-2 px-3.5 py-2.5 border-t border-slate-100 bg-slate-50/80 hover:bg-indigo-50 text-indigo-700 cursor-pointer transition-colors font-semibold text-xs"
                >
                  <Plus className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Vincular / Criar empresa "{query.trim()}"</span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
