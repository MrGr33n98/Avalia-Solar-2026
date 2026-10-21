'use client';

import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useServices, CompanyService } from '../hooks/useServices';
import { fetchApi } from '@/lib/api';

interface CategoryOption {
  id: number;
  name: string;
}

interface ServicesManagementProps {
  companyId?: string | number;
}

export default function ServicesManagement({ companyId }: ServicesManagementProps) {
  const {
    services,
    stats,
    loading,
    addService,
    updateService,
    deleteService,
  } = useServices(companyId);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<CompanyService | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isPriceOnRequest, setIsPriceOnRequest] = useState(false);
  const [priceFrom, setPriceFrom] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchApi<{ data?: CategoryOption[] } | CategoryOption[]>('/categories', {
      params: { view: 'cards', limit: 200 },
    })
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data || [];
        setCategories(list.map((c) => ({ id: c.id, name: c.name })));
      })
      .catch(() => {});
  }, []);

  const openCreateDialog = () => {
    setEditingService(null);
    setName('');
    setCategoryId(categories[0]?.id ? String(categories[0].id) : '');
    setDescription('');
    setIsPriceOnRequest(false);
    setPriceFrom('');
    setStatus('active');
    setDialogOpen(true);
  };

  const openEditDialog = (service: CompanyService) => {
    setEditingService(service);
    setName(service.name);
    setCategoryId(String(service.category_id));
    setDescription(service.description || '');
    setIsPriceOnRequest(service.price_from == null || service.price_from === 0);
    setPriceFrom(service.price_from ? String(service.price_from) : '');
    setStatus(service.status);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const parsedCatId = parseInt(categoryId, 10) || categories[0]?.id || 1;
      const parsedPrice = isPriceOnRequest || !priceFrom ? null : parseFloat(priceFrom);

      if (editingService) {
        await updateService(editingService.id, {
          name: name.trim(),
          category_id: parsedCatId,
          description: description.trim(),
          price_from: parsedPrice,
          status,
        });
      } else {
        await addService({
          name: name.trim(),
          category_id: parsedCatId,
          description: description.trim(),
          price_from: parsedPrice,
          status,
        });
      }
      setDialogOpen(false);
    } catch {
      // Toast handles error display
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente remover este serviço do catálogo?')) return;
    await deleteService(id);
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* KPI METRICS                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total de Serviços
              </p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Wrench className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Serviços Ativos
              </p>
              <h3 className="mt-1 text-2xl font-bold text-emerald-600">{stats.active}</h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Serviços Inativos
              </p>
              <h3 className="mt-1 text-2xl font-bold text-slate-500">{stats.inactive}</h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* ACTIONS BAR                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Serviços Oferecidos</h2>
          <p className="text-sm text-slate-500">
            Gerencie os serviços técnicos e de engenharia apresentados na sua vitrine pública.
          </p>
        </div>

        <Button
          onClick={openCreateDialog}
          className="h-10 gap-2 rounded-xl bg-blue-600 px-4 font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Cadastrar serviço
        </Button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SERVICES LIST / TABLE                                              */}
      {/* ------------------------------------------------------------------ */}
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : services.length === 0 ? (
        <Card className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-12 text-center">
          <Wrench className="h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-base font-bold text-slate-800">
            Nenhum serviço cadastrado ainda
          </h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Cadastre os serviços que sua empresa realiza (instalação, homologação, manutenção, consultoria) para exibi-los na vitrine pública.
          </p>
          <Button
            onClick={openCreateDialog}
            className="mt-5 h-9 gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Cadastrar primeiro serviço
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card
              key={service.id}
              className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-slate-300"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <Badge
                    variant="outline"
                    className="border-blue-100 bg-blue-50 text-[11px] font-semibold text-blue-700"
                  >
                    {service.category?.name || 'Geral'}
                  </Badge>

                  <Badge
                    variant="outline"
                    className={
                      service.status === 'active'
                        ? 'border-emerald-100 bg-emerald-50 text-[11px] text-emerald-700'
                        : 'border-slate-200 bg-slate-100 text-[11px] text-slate-500'
                    }
                  >
                    {service.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>

                <h4 className="mt-3 text-base font-bold text-slate-900">{service.name}</h4>

                {service.description && (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                    {service.description}
                  </p>
                )}

                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  {service.price_from != null && service.price_from > 0
                    ? `A partir de R$ ${Number(service.price_from).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : 'Sob consulta'}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openEditDialog(service)}
                  className="h-8 gap-1 rounded-lg px-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(service.id)}
                  className="h-8 gap-1 rounded-lg px-2 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SERVICE MODAL DIALOG                                               */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editingService ? 'Editar Serviço' : 'Novo Serviço'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700">
                Nome do Serviço *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Instalação e Homologação de Sistema Solar"
                required
                className="mt-1 h-9 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">
                Categoria *
              </label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="mt-1 h-9 rounded-xl text-sm">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">
                Descrição do Serviço
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o escopo do serviço, o que está incluso e o diferencial da sua empresa..."
                rows={3}
                className="mt-1 rounded-xl text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Preço de Referência
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPriceOnRequest}
                    onChange={(e) => setIsPriceOnRequest(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Sob consulta
                </label>
              </div>

              {!isPriceOnRequest && (
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">
                    R$
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={priceFrom}
                    onChange={(e) => setPriceFrom(e.target.value)}
                    placeholder="0,00"
                    className="h-9 rounded-xl pl-9 text-sm"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">
                Status
              </label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as 'active' | 'inactive')}
              >
                <SelectTrigger className="mt-1 h-9 rounded-xl text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo (visível na vitrine)</SelectItem>
                  <SelectItem value="inactive">Inativo (rascunho)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="mt-6 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="h-9 rounded-xl text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting || !name.trim()}
                className="h-9 rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingService ? (
                  'Salvar alterações'
                ) : (
                  'Cadastrar serviço'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
