'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Plus, User, UserPlus, X } from 'lucide-react';
import { salesApi } from '@/lib/api/sales/client';
import { ApiContact } from '@/lib/api/sales/types';

export interface PersonOption {
  id?: number;
  first_name: string;
  last_name?: string | null;
  name?: string;
  email?: string | null;
  job_title?: string | null;
  account_name?: string | null;
  avatar_url?: string | null;
}

interface CRMPersonSelectProps {
  value: string;
  selectedContact?: PersonOption | null;
  onChange: (personName: string, contact?: PersonOption | null) => void;
  placeholder?: string;
  className?: string;
}

const AVATAR_BG_COLORS = [
  'bg-blue-600',
  'bg-indigo-600',
  'bg-sky-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-purple-600',
  'bg-rose-600',
  'bg-teal-600',
];

function getInitials(name: string): string {
  if (!name) return 'P';
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

export default function CRMPersonSelect({
  value,
  selectedContact,
  onChange,
  placeholder = 'Select or create a person',
  className = '',
}: CRMPersonSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const [contacts, setContacts] = useState<ApiContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeContact, setActiveContact] = useState<PersonOption | null>(selectedContact || null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchContacts = useCallback(async (searchQuery = '') => {
    setLoading(true);
    try {
      const res = await salesApi.getContacts({ q: searchQuery, limit: 30, options: true });
      setContacts(res || []);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchContacts(query);
    }
  }, [open, fetchContacts, query]);

  useEffect(() => {
    if (selectedContact) {
      setActiveContact(selectedContact);
      setQuery(selectedContact.name || `${selectedContact.first_name} ${selectedContact.last_name || ''}`.trim());
    } else if (value && !activeContact) {
      setQuery(value);
    }
  }, [selectedContact, value, activeContact]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (contact: ApiContact) => {
    const fullName = contact.name || `${contact.first_name} ${contact.last_name || ''}`.trim();
    setActiveContact(contact);
    setQuery(fullName);
    onChange(fullName, contact);
    setOpen(false);
  };

  const handleCreateNew = (nameToCreate: string) => {
    const trimmed = nameToCreate.trim();
    if (!trimmed) return;
    const parts = trimmed.split(' ');
    const newPerson: PersonOption = {
      first_name: parts[0],
      last_name: parts.slice(1).join(' ') || undefined,
      name: trimmed,
    };
    setActiveContact(newPerson);
    setQuery(trimmed);
    onChange(trimmed, newPerson);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveContact(null);
    setQuery('');
    onChange('', null);
    inputRef.current?.focus();
  };

  const filteredContacts = contacts.filter((c) => {
    const fullName = c.name || `${c.first_name} ${c.last_name || ''}`;
    return (
      fullName.toLowerCase().includes(query.toLowerCase()) ||
      c.email?.toLowerCase().includes(query.toLowerCase()) ||
      c.job_title?.toLowerCase().includes(query.toLowerCase()) ||
      c.account_name?.toLowerCase().includes(query.toLowerCase())
    );
  });

  return (
    <div ref={containerRef} className={`relative w-full font-sans ${className}`}>
      {/* Selector Trigger Input */}
      <div
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
        className={`flex items-center justify-between h-10 px-3 rounded-lg border bg-white cursor-pointer transition-all ${
          open ? 'border-sky-600 ring-2 ring-sky-100' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {activeContact ? (
            <div className={`w-6 h-6 rounded-full ${getAvatarColor(activeContact.name || activeContact.first_name)} text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-xs`}>
              {getInitials(activeContact.name || activeContact.first_name)}
            </div>
          ) : (
            <UserPlus className="w-4 h-4 text-sky-600 shrink-0" />
          )}

          <input
            ref={inputRef}
            type="text"
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveContact(null);
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

      {/* Nutshell-style Dropdown List */}
      {open && (
        <div className="absolute left-0 right-0 top-11 z-50 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto animate-in fade-in-50 duration-150">
          {loading ? (
            <div className="p-4 text-center text-xs text-slate-500 font-medium">
              Carregando pessoas...
            </div>
          ) : (
            <>
              {filteredContacts.length > 0 ? (
                <div className="py-1">
                  {filteredContacts.map((contact) => {
                    const fullName = contact.name || `${contact.first_name} ${contact.last_name || ''}`.trim();
                    const subtitle = contact.account_name || contact.job_title || contact.email || 'Nutshell Contact';
                    const initials = getInitials(fullName);
                    const bgColor = getAvatarColor(fullName);
                    const isSelected = activeContact?.id === contact.id;

                    return (
                      <div
                        key={contact.id}
                        onClick={() => handleSelect(contact)}
                        className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                          isSelected ? 'bg-sky-100/70 text-sky-950 font-semibold' : 'hover:bg-sky-50 text-slate-800'
                        }`}
                      >
                        {/* Nutshell Avatar Circle */}
                        <div className={`w-8 h-8 rounded-full ${bgColor} text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs`}>
                          {initials}
                        </div>

                        {/* Name & Subtitle */}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-900 truncate">{fullName}</p>
                          <p className="text-[11px] text-slate-500 truncate">{subtitle}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 text-center text-xs text-slate-500">
                  Nenhuma pessoa encontrada com o termo "{query}".
                </div>
              )}

              {/* Add New Person Option */}
              {query.trim().length > 0 && (
                <div
                  onClick={() => handleCreateNew(query)}
                  className="flex items-center gap-2 px-3.5 py-2.5 border-t border-slate-100 bg-slate-50/80 hover:bg-sky-50 text-sky-700 cursor-pointer transition-colors font-semibold text-xs"
                >
                  <Plus className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Criar pessoa "{query.trim()}"</span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
