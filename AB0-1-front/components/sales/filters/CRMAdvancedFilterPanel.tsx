'use client';

import { useEffect, useState } from 'react';
import { Filter, X, RefreshCw, Check } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

export interface CRMFilterState {
  query: string;
  segment: string;
  state: string;
  city: string;
  status: string;
  owner_id: string;
  has_email: boolean;
  has_phone: boolean;
}

export const INITIAL_FILTER_STATE: CRMFilterState = {
  query: '',
  segment: '',
  state: '',
  city: '',
  status: '',
  owner_id: '',
  has_email: false,
  has_phone: false,
};

interface FilterOptionsData {
  segments: string[];
  states: string[];
  statuses: string[];
  owners: { id: number; name: string }[];
}

interface CRMAdvancedFilterPanelProps {
  open: boolean;
  onClose: () => void;
  filters: CRMFilterState;
  onApply: (newFilters: CRMFilterState) => void;
  onReset: () => void;
}

export default function CRMAdvancedFilterPanel({
  open,
  onClose,
  filters,
  onApply,
  onReset,
}: CRMAdvancedFilterPanelProps) {
  const [draftFilters, setDraftFilters] = useState<CRMFilterState>(filters);
  const [options, setOptions] = useState<FilterOptionsData>({
    segments: [
      'Integrador / Instalador',
      'Distribuidor',
      'Fabricante',
      'Cliente',
      'Prospect',
      'EPC / Engenharia',
    ],
    states: [
      'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
      'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN',
      'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'
    ],
    statuses: ['prospect', 'active', 'inactive', 'customer', 'lead'],
    owners: [],
  });
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);

  useEffect(() => {
    if (!open) return;
    setLoadingOptions(true);
    fetch('/api/v1/sales/accounts/filter_options', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.options) {
          setOptions((prev) => ({
            segments: data.options.segments?.length ? data.options.segments : prev.segments,
            states: data.options.states?.length ? data.options.states : prev.states,
            statuses: data.options.statuses?.length ? data.options.statuses : prev.statuses,
            owners: data.options.owners || [],
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingOptions(false));
  }, [open]);

  const activeCount = Object.entries(draftFilters).filter(([key, val]) => {
    if (typeof val === 'boolean') return val;
    return Boolean(val);
  }).length;

  const handleApply = () => {
    onApply(draftFilters);
    onClose();
  };

  const handleReset = () => {
    setDraftFilters(INITIAL_FILTER_STATE);
    onReset();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
      <SheetContent className="w-full max-w-md sm:max-w-lg flex flex-col justify-between bg-white p-6 shadow-2xl">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600 border border-amber-200">
                <Filter className="h-5 w-5" />
              </div>
              <div>
                <SheetTitle className="text-lg font-bold text-slate-900">
                  Filtros Avançados
                </SheetTitle>
                <SheetDescription className="text-xs text-slate-500">
                  Refine a visualização das empresas por taxonomia, localização e status.
                </SheetDescription>
              </div>
            </div>
            {activeCount > 0 && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 font-semibold">
                {activeCount} ativo{activeCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="my-4 flex-1 overflow-y-auto space-y-5 pr-1 text-slate-800">
          {/* Segment/Taxonomy */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Segmento / Taxonomia
            </Label>
            <select
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none min-h-[44px]"
              value={draftFilters.segment}
              onChange={(e) => setDraftFilters((prev) => ({ ...prev, segment: e.target.value }))}
            >
              <option value="">Todos os segmentos</option>
              {options.segments.map((seg) => (
                <option key={seg} value={seg}>
                  {seg}
                </option>
              ))}
            </select>
          </div>

          {/* UF State & City */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Estado (UF)
              </Label>
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none min-h-[44px]"
                value={draftFilters.state}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, state: e.target.value }))}
              >
                <option value="">Todos os UFs</option>
                {options.states.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Cidade
              </Label>
              <Input
                placeholder="Ex: Campinas"
                value={draftFilters.city}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, city: e.target.value }))}
                className="min-h-[44px]"
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Status Comercial
            </Label>
            <select
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none min-h-[44px]"
              value={draftFilters.status}
              onChange={(e) => setDraftFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="">Todos os status</option>
              <option value="prospect">Prospect</option>
              <option value="active">Ativo</option>
              <option value="lead">Lead</option>
              <option value="customer">Cliente</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>

          {/* Responsible Owner */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Responsável / Owner
            </Label>
            <select
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none min-h-[44px]"
              value={draftFilters.owner_id}
              onChange={(e) => setDraftFilters((prev) => ({ ...prev, owner_id: e.target.value }))}
            >
              <option value="">Todos os responsáveis</option>
              <option value="me">Minhas empresas (Comigo)</option>
              {options.owners.map((owner) => (
                <option key={owner.id} value={String(owner.id)}>
                  {owner.name}
                </option>
              ))}
            </select>
          </div>

          {/* Boolean checks */}
          <div className="space-y-3 pt-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Qualificação de Dados
            </Label>
            <div className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-slate-50 transition">
              <Checkbox
                id="has_email"
                checked={draftFilters.has_email}
                onCheckedChange={(checked) =>
                  setDraftFilters((prev) => ({ ...prev, has_email: Boolean(checked) }))
                }
              />
              <label htmlFor="has_email" className="text-sm font-medium leading-none cursor-pointer text-slate-700">
                Apenas com e-mail cadastrado
              </label>
            </div>
            <div className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-slate-50 transition">
              <Checkbox
                id="has_phone"
                checked={draftFilters.has_phone}
                onCheckedChange={(checked) =>
                  setDraftFilters((prev) => ({ ...prev, has_phone: Boolean(checked) }))
                }
              />
              <label htmlFor="has_phone" className="text-sm font-medium leading-none cursor-pointer text-slate-700">
                Apenas com telefone cadastrado
              </label>
            </div>
          </div>
        </div>

        <SheetFooter className="border-t pt-4 flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="w-full sm:w-auto text-slate-600 hover:text-slate-900 min-h-[44px]"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Limpar Filtros
          </Button>
          <Button
            onClick={handleApply}
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white font-semibold min-h-[44px]"
          >
            <Check className="mr-2 h-4 w-4" />
            Aplicar Filtros
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
