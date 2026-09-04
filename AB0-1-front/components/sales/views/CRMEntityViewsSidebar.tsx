'use client';

import { useEffect, useState } from 'react';
import { Bookmark, Star, Plus, Trash2, Edit2, Check, LayoutGrid, User, ShieldCheck, Truck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { CRMFilterState } from '../filters/CRMAdvancedFilterPanel';
import CRMSavedViewEditor from './CRMSavedViewEditor';

export interface SavedViewItem {
  id: number;
  name: string;
  resource_type: string;
  filters: Partial<CRMFilterState>;
  is_pinned?: boolean;
  is_shared?: boolean;
}

interface CRMEntityViewsSidebarProps {
  open: boolean;
  onClose: () => void;
  activeFilterState: CRMFilterState;
  onSelectView: (filters: Partial<CRMFilterState>, viewName: string) => void;
}

const SYSTEM_VIEWS: { id: string; name: string; icon: any; filters: Partial<CRMFilterState> }[] = [
  {
    id: 'all',
    name: 'Todas as Empresas',
    icon: LayoutGrid,
    filters: {},
  },
  {
    id: 'my',
    name: 'Minhas Empresas',
    icon: User,
    filters: { owner_id: 'me' },
  },
  {
    id: 'integrators',
    name: 'Integradores & Instaladores',
    icon: ShieldCheck,
    filters: { segment: 'Integrador / Instalador' },
  },
  {
    id: 'distributors',
    name: 'Distribuidores',
    icon: Truck,
    filters: { segment: 'Distribuidor' },
  },
  {
    id: 'customers',
    name: 'Clientes Ativos',
    icon: Users,
    filters: { status: 'customer' },
  },
];

export default function CRMEntityViewsSidebar({
  open,
  onClose,
  activeFilterState,
  onSelectView,
}: CRMEntityViewsSidebarProps) {
  const [savedViews, setSavedViews] = useState<SavedViewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingView, setEditingView] = useState<SavedViewItem | null>(null);

  const fetchSavedViews = () => {
    setLoading(true);
    fetch('/api/v1/sales/saved_views?resource_type=account', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : { saved_views: [] }))
      .then((data) => setSavedViews(data.saved_views || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (open) {
      fetchSavedViews();
    }
  }, [open]);

  const handlePin = async (id: number, currentPinned: boolean) => {
    try {
      const res = await fetch(`/api/v1/sales/saved_views/${id}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: !currentPinned }),
        credentials: 'include',
      });
      if (res.ok) fetchSavedViews();
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover esta visão salva?')) return;
    try {
      const res = await fetch(`/api/v1/sales/saved_views/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) fetchSavedViews();
    } catch {}
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
        <SheetContent side="left" className="w-full max-w-sm flex flex-col justify-between bg-white p-6 shadow-2xl">
          <SheetHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-amber-50 p-2 text-amber-600 border border-amber-200">
                  <Bookmark className="h-5 w-5" />
                </div>
                <div>
                  <SheetTitle className="text-lg font-bold text-slate-900">
                    Visões da Lista
                  </SheetTitle>
                  <SheetDescription className="text-xs text-slate-500">
                    Navegue por segmentos padrão ou visões personalizadas.
                  </SheetDescription>
                </div>
              </div>
            </div>
          </SheetHeader>

          <div className="my-4 flex-1 overflow-y-auto space-y-6 pr-1">
            {/* System Standard Views */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Visões Padrão
              </h4>
              <div className="space-y-1">
                {SYSTEM_VIEWS.map((v) => {
                  const Icon = v.icon;
                  return (
                    <button
                      key={v.id}
                      onClick={() => {
                        onSelectView(v.filters, v.name);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition border border-transparent hover:border-amber-200 min-h-[44px]"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-slate-400" />
                        <span>{v.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Saved Views */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Visões Salvas
                </h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingView(null);
                    setIsEditorOpen(true);
                  }}
                  className="h-7 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-2"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Salvar Atual
                </Button>
              </div>

              {loading ? (
                <div className="text-xs text-slate-400 p-3 text-center">Carregando visões...</div>
              ) : savedViews.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-center text-xs text-slate-400">
                  Nenhuma visão customizada salva ainda.
                </div>
              ) : (
                <div className="space-y-1">
                  {savedViews.map((sv) => (
                    <div
                      key={sv.id}
                      className="group flex items-center justify-between rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition border border-slate-100"
                    >
                      <button
                        onClick={() => {
                          onSelectView(sv.filters, sv.name);
                          onClose();
                        }}
                        className="flex-1 text-left font-medium truncate pr-2 hover:text-amber-600"
                      >
                        {sv.name}
                        {sv.is_shared && (
                          <Badge variant="outline" className="ml-2 text-[10px] py-0 px-1 border-slate-300">
                            Compartilhada
                          </Badge>
                        )}
                      </button>
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          onClick={() => handlePin(sv.id, Boolean(sv.is_pinned))}
                          className={`p-1 hover:text-amber-500 min-h-[32px] min-w-[32px] flex items-center justify-center ${
                            sv.is_pinned ? 'text-amber-500' : 'text-slate-300'
                          }`}
                        >
                          <Star className="h-3.5 w-3.5 fill-current" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingView(sv);
                            setIsEditorOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 min-h-[32px] min-w-[32px] flex items-center justify-center"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(sv.id)}
                          className="p-1 text-slate-400 hover:text-red-600 min-h-[32px] min-w-[32px] flex items-center justify-center"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <CRMSavedViewEditor
        open={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        activeFilters={activeFilterState}
        initialView={editingView}
        onSaved={fetchSavedViews}
      />
    </>
  );
}
