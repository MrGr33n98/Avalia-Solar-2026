'use client';

import { useState } from 'react';
import { UserCheck, Tag, CheckCircle2, Layers, Trash2, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CRMBulkActionBarProps {
  selectedIds: number[];
  onClearSelection: () => void;
  onSuccess: () => void;
}

export default function CRMBulkActionBar({
  selectedIds,
  onClearSelection,
  onSuccess,
}: CRMBulkActionBarProps) {
  const [activeModal, setActiveModal] = useState<
    'owner' | 'tag' | 'status' | 'segment' | 'delete' | null
  >(null);

  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (selectedIds.length === 0) return null;

  const executeBulkAction = async (action_type: string, payload: Record<string, any> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/sales/accounts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_ids: selectedIds,
          action_type,
          payload,
        }),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Falha ao executar ação em massa.');
      }

      setActiveModal(null);
      setInputValue('');
      onClearSelection();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao processar alteração.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl rounded-2xl border border-slate-800 bg-slate-900/95 text-white p-3 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-bottom-5">
        <div className="flex items-center gap-3 px-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 font-bold text-xs text-slate-950">
            {selectedIds.length}
          </span>
          <span className="text-xs font-semibold text-slate-200 hidden sm:inline">
            empresa{selectedIds.length > 1 ? 's' : ''} selecionada{selectedIds.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setInputValue('');
              setActiveModal('owner');
            }}
            className="text-xs text-slate-200 hover:bg-slate-800 hover:text-white min-h-[44px] px-2.5"
          >
            <UserCheck className="mr-1.5 h-3.5 w-3.5 text-amber-400" />
            Responsável
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setInputValue('');
              setActiveModal('tag');
            }}
            className="text-xs text-slate-200 hover:bg-slate-800 hover:text-white min-h-[44px] px-2.5"
          >
            <Tag className="mr-1.5 h-3.5 w-3.5 text-amber-400" />
            Tag
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setInputValue('active');
              setActiveModal('status');
            }}
            className="text-xs text-slate-200 hover:bg-slate-800 hover:text-white min-h-[44px] px-2.5"
          >
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-amber-400" />
            Status
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setInputValue('Integrador / Instalador');
              setActiveModal('segment');
            }}
            className="text-xs text-slate-200 hover:bg-slate-800 hover:text-white min-h-[44px] px-2.5"
          >
            <Layers className="mr-1.5 h-3.5 w-3.5 text-amber-400" />
            Segmento
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setActiveModal('delete')}
            className="text-xs text-red-400 hover:bg-red-950/40 hover:text-red-300 min-h-[44px] px-2.5"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Excluir
          </Button>
        </div>

        <button
          onClick={onClearSelection}
          className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="Limpar Seleção"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Modal Dialog for Bulk Actions */}
      <Dialog open={activeModal !== null} onOpenChange={(val) => !val && setActiveModal(null)}>
        <DialogContent className="sm:max-w-md bg-white p-6 rounded-xl shadow-2xl text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {activeModal === 'owner' && 'Alterar Responsável em Massa'}
              {activeModal === 'tag' && 'Adicionar Tag em Massa'}
              {activeModal === 'status' && 'Alterar Status em Massa'}
              {activeModal === 'segment' && 'Alterar Segmento em Massa'}
              {activeModal === 'delete' && 'Excluir Empresas Selecionadas'}
            </DialogTitle>
          </DialogHeader>

          <div className="py-3 space-y-3">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            {activeModal === 'owner' && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  ID do Novo Responsável
                </Label>
                <Input
                  type="number"
                  placeholder="ID do Usuário"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="min-h-[44px]"
                />
              </div>
            )}

            {activeModal === 'tag' && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Nome da Tag
                </Label>
                <Input
                  placeholder="Ex: VIP-2026"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="min-h-[44px]"
                />
              </div>
            )}

            {activeModal === 'status' && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Novo Status
                </Label>
                <select
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none min-h-[44px]"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                >
                  <option value="prospect">Prospect</option>
                  <option value="active">Ativo</option>
                  <option value="customer">Cliente</option>
                  <option value="lead">Lead</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
            )}

            {activeModal === 'segment' && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Novo Segmento
                </Label>
                <select
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none min-h-[44px]"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                >
                  <option value="Integrador / Instalador">Integrador / Instalador</option>
                  <option value="Distribuidor">Distribuidor</option>
                  <option value="Fabricante">Fabricante</option>
                  <option value="Cliente">Cliente</option>
                  <option value="Prospect">Prospect</option>
                  <option value="EPC / Engenharia">EPC / Engenharia</option>
                </select>
              </div>
            )}

            {activeModal === 'delete' && (
              <p className="text-xs text-slate-600 leading-relaxed">
                Você está prestes a excluir <strong>{selectedIds.length}</strong> empresa(s). Esta ação não pode ser desfeita.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setActiveModal(null)} disabled={loading} className="min-h-[44px]">
              Cancelar
            </Button>
            <Button
              variant={activeModal === 'delete' ? 'destructive' : 'default'}
              disabled={loading}
              onClick={() => {
                if (activeModal === 'owner') executeBulkAction('update_owner', { owner_id: inputValue });
                if (activeModal === 'tag') executeBulkAction('add_tag', { tag_name: inputValue });
                if (activeModal === 'status') executeBulkAction('change_status', { status: inputValue });
                if (activeModal === 'segment') executeBulkAction('change_segment', { segment: inputValue });
                if (activeModal === 'delete') executeBulkAction('delete');
              }}
              className={activeModal !== 'delete' ? 'bg-amber-500 hover:bg-amber-600 text-white font-semibold min-h-[44px]' : 'min-h-[44px]'}
            >
              {loading ? 'Processando...' : 'Confirmar Alteração'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
