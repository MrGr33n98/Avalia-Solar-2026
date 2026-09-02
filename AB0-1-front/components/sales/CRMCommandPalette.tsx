'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  Command,
  FileSpreadsheet,
  FileText,
  LayoutGrid,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

type CommandItem = {
  id: string;
  category: 'navigation' | 'actions' | 'records';
  label: string;
  detail?: string;
  icon: typeof LayoutGrid;
  href?: string;
  action?: () => void;
};

export default function CRMCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  let router: ReturnType<typeof useRouter> | null = null;
  try {
    router = useRouter();
  } catch {
    router = null;
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const commands: CommandItem[] = [
    {
      id: 'nav-pipeline',
      category: 'navigation',
      label: 'Ir para Pipeline Kanban',
      detail: 'Ver quadro visual de oportunidades por estágio',
      icon: LayoutGrid,
      href: '/dashboard/sales/pipeline',
    },
    {
      id: 'nav-accounts',
      category: 'navigation',
      label: 'Ir para Contas & Prospects',
      detail: 'Tabela operacional de empresas instaladoras e integradoras',
      icon: Building2,
      href: '/dashboard/sales/accounts',
    },
    {
      id: 'nav-today',
      category: 'navigation',
      label: 'Ir para Fila Diária (Today & Work Queue)',
      detail: 'Tarefas atrasadas, stale deals e follow-ups para hoje',
      icon: Calendar,
      href: '/dashboard/sales/today',
    },
    {
      id: 'nav-import',
      category: 'navigation',
      label: 'Ir para Importador de Leads',
      detail: 'Upload .CSV, .XLSX, Google Sheets e cola de dados',
      icon: FileSpreadsheet,
      href: '/dashboard/sales/import',
    },
    {
      id: 'nav-reports',
      category: 'navigation',
      label: 'Ir para Analytics & Forecast',
      detail: 'Relatório executivo de conversão e receita projetada',
      icon: BarChart3,
      href: '/dashboard/sales/reports',
    },
    {
      id: 'nav-tasks',
      category: 'navigation',
      label: 'Ir para Tarefas & Action Items',
      detail: 'Agenda de reuniões, chamadas e follow-ups',
      icon: CheckCircle2,
      href: '/dashboard/sales/tasks',
    },
    {
      id: 'act-new-opp',
      category: 'actions',
      label: 'Criar Nova Oportunidade',
      detail: 'Cadastrar nova negociação no pipeline',
      icon: Plus,
      href: '/dashboard/sales/pipeline?action=new',
    },
    {
      id: 'act-new-company',
      category: 'actions',
      label: 'Adicionar Empresa Prospect',
      detail: 'Cadastrar nova instaladora/integradora',
      icon: Building2,
      href: '/dashboard/sales/accounts?action=new',
    },
    {
      id: 'act-new-contact',
      category: 'actions',
      label: 'Cadastrar Decisor / Contato',
      detail: 'Vincular decisor com papel B2B (Decision Maker, Champion)',
      icon: UserPlus,
      href: '/dashboard/sales/accounts?action=contact',
    },
  ];

  const filteredCommands = commands.filter(
    (c) =>
      c.label.toLowerCase().includes(query.toLowerCase()) ||
      (c.detail && c.detail.toLowerCase().includes(query.toLowerCase()))
  );

  const handleSelect = (item: CommandItem) => {
    setOpen(false);
    setQuery('');
    if (item.action) {
      item.action();
    } else if (item.href) {
      if (router) {
        router.push(item.href);
      } else if (typeof window !== 'undefined') {
        window.location.href = item.href;
      }
    }
  };

  const handleKeyDownInMenu = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        handleSelect(filteredCommands[selectedIndex]);
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 p-4 pt-20 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl transition-all"
        onKeyDown={handleKeyDownInMenu}
      >
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-slate-100 px-4 py-3">
          <Search className="mr-3 h-5 w-5 text-blue-900" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Digite um comando, buscar empresa, prospect ou atalho (ex: Pipeline, Reunião, Solar)..."
            className="border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-900 placeholder:text-slate-400"
          />
          <Badge variant="outline" className="border-slate-200 bg-slate-50 font-mono text-[10px] text-slate-500">
            ESC
          </Badge>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Nenhum comando ou registro encontrado para &quot;{query}&quot;.
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCommands.map((item, index) => {
                const Icon = item.icon;
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-left text-sm transition ${
                      isSelected ? 'bg-blue-900 text-white' : 'text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-md p-1.5 ${
                          isSelected ? 'bg-blue-800 text-white' : 'bg-slate-100 text-blue-900'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold">{item.label}</p>
                        {item.detail && (
                          <p className={`text-xs ${isSelected ? 'text-blue-200' : 'text-slate-500'}`}>
                            {item.detail}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`border-transparent font-mono text-[10px] ${
                        isSelected ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.category.toUpperCase()}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700">Avalia Solar Command Palette</span>
            <span>·</span>
            <span>Use ↑ ↓ para navegar, Enter para selecionar</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[10px]">
            <span className="rounded bg-white px-1.5 py-0.5 border border-slate-200 shadow-2xs">⌘K</span>
            <span>para alternar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
