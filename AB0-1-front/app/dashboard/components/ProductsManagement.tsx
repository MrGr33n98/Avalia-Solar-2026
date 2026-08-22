'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  Archive,
  CheckCircle2,
  ChevronRight,
  FileText,
  ImageIcon,
  ImagePlus,
  Link as LinkIcon,
  Loader2,
  Package,
  Pencil,
  Plus,
  Search,
  Tag,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { fetchApi } from '@/lib/api';
import { cn } from '../utils';
import type { Product } from '../types';
import { type CatalogFilters, type ProductInput, useProducts } from '../hooks/useProducts';

type Category = { id: string; name: string };
type ProductStatus = ProductInput['status'];

type ProductEditorValues = {
  name: string;
  sku: string;
  description: string;
  short_description: string;
  price: string;
  price_mode: 'fixed' | 'starting_at' | 'on_request' | 'hidden';
  stock: string;
  status: ProductStatus;
  category_id: string;
  image_url: string;
  images: File[];
  previewUrls: string[];
};

const EMPTY_EDITOR: ProductEditorValues = {
  name: '',
  sku: '',
  description: '',
  short_description: '',
  price: '',
  price_mode: 'fixed',
  stock: '0',
  status: 'draft',
  category_id: '',
  image_url: '',
  images: [],
  previewUrls: [],
};

const STATUS_META: Record<ProductStatus, { label: string; className: string }> = {
  active: { label: 'Publicado', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  draft: { label: 'Rascunho', className: 'bg-slate-100 text-slate-600 ring-slate-200' },
  archived: { label: 'Arquivado', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  disabled: { label: 'Desativado', className: 'bg-rose-50 text-rose-700 ring-rose-200' },
};

function formatCurrency(value?: number | string | null) {
  const amount = Number(value || 0);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)
    : '—';
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

function statusMeta(status?: string) {
  return STATUS_META[status as ProductStatus] || STATUS_META.draft;
}

function MetricCard({ label, value, icon: Icon, tone, onClick }: {
  label: string;
  value: number;
  icon: typeof Package;
  tone: 'emerald' | 'blue' | 'slate' | 'amber' | 'rose';
  onClick?: () => void;
}) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    slate: 'bg-slate-100 text-slate-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'min-h-[116px] rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md',
        !onClick && 'cursor-default hover:border-slate-200 hover:shadow-sm',
      )}
    >
      <span className="flex items-center gap-2 text-xs font-semibold text-slate-600">
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', tones[tone])}><Icon className="h-4 w-4" /></span>
        {label}
      </span>
      <strong className="mt-4 block text-3xl font-bold tracking-tight text-slate-950">{value}</strong>
      {onClick && <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-blue-600">Ver produtos <ChevronRight className="h-3 w-3" /></span>}
    </button>
  );
}

interface ProductsManagementProps {
  companyId: string;
}

export default function ProductsManagement({ companyId }: ProductsManagementProps) {
  const { products, stats, loading, filters, applyFilters, addProduct, updateProduct, archiveProduct } = useProducts(companyId);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filtersDraft, setFiltersDraft] = useState<CatalogFilters>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editor, setEditor] = useState<ProductEditorValues>(EMPTY_EDITOR);
  const [saving, setSaving] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchApi<{ data?: Category[] } | Category[]>('/categories', { params: { view: 'cards', limit: 200 } })
      .then((response) => {
        if (!active) return;
        const list = Array.isArray(response) ? response : response?.data || [];
        setCategories(list.map((category) => ({ id: String(category.id), name: category.name })));
      })
      .catch(() => active && setCategories([]));
    return () => { active = false; };
  }, []);

  useEffect(() => setFiltersDraft(filters), [filters]);

  const hasFilters = useMemo(() => Object.values(filtersDraft).some(Boolean), [filtersDraft]);

  const openCreate = () => {
    setSelectedProduct(null);
    setEditor(EMPTY_EDITOR);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setSelectedProduct(product);
    const existingUrls = product.image_urls?.length ? product.image_urls : product.image_url ? [product.image_url] : [];
    setEditor({
      name: product.name || '',
      sku: product.sku || '',
      description: product.description || '',
      short_description: product.short_description || '',
      price: String(product.price ?? ''),
      price_mode: (product as any).price_mode || 'fixed',
      stock: String(product.stock ?? 0),
      status: (product.status as ProductStatus) || 'draft',
      category_id: product.categories?.[0] ? String(product.categories[0].id) : '',
      image_url: product.image_url || '',
      images: [],
      previewUrls: existingUrls,
    });
    setDialogOpen(true);
  };

  const setEditorField = <K extends keyof ProductEditorValues>(key: K, value: ProductEditorValues[K]) => {
    setEditor((previous) => ({ ...previous, [key]: value }));
  };

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const filePreviews = files.map((file) => URL.createObjectURL(file));
    setEditor((previous) => ({
      ...previous,
      images: [...previous.images, ...files],
      previewUrls: [...previous.previewUrls, ...filePreviews],
    }));
  };

  const handleRemovePreview = (index: number) => {
    setEditor((previous) => {
      const isNewFile = index >= (selectedProduct?.image_urls?.length || (selectedProduct?.image_url ? 1 : 0));
      const nextPreviews = previous.previewUrls.filter((_, idx) => idx !== index);
      if (isNewFile) {
        const fileIndex = index - (previous.previewUrls.length - previous.images.length);
        const nextImages = previous.images.filter((_, idx) => idx !== fileIndex);
        return { ...previous, previewUrls: nextPreviews, images: nextImages };
      }
      return { ...previous, previewUrls: nextPreviews };
    });
  };

  const saveProduct = async () => {
    if (!editor.name.trim() || !editor.sku.trim() || !editor.category_id) {
      toast({ title: 'Preencha os campos obrigatórios', description: 'Nome, SKU e categoria são necessários.', variant: 'destructive' });
      return;
    }
    if (Number(editor.stock) < 0) {
      toast({ title: 'Confira os dados comerciais', description: 'O estoque não pode ser negativo.', variant: 'destructive' });
      return;
    }

    const payload: ProductInput = {
      name: editor.name.trim(),
      sku: editor.sku.trim(),
      description: editor.description.trim(),
      short_description: editor.short_description.trim(),
      price: Number(editor.price || 0),
      price_mode: editor.price_mode,
      stock: Number(editor.stock || 0),
      status: editor.status,
      category_ids: [editor.category_id],
      image_url: editor.image_url.trim() || (editor.previewUrls[0] || ''),
      images: editor.images.length > 0 ? editor.images : undefined,
    };
    try {
      setSaving(true);
      if (selectedProduct) {
        await updateProduct(selectedProduct.id, payload);
        toast({ title: 'Produto atualizado', description: 'As alterações foram salvas no catálogo.' });
      } else {
        await addProduct(payload);
        toast({ title: payload.status === 'active' ? 'Produto publicado' : 'Rascunho criado', description: 'O catálogo foi atualizado com dados da empresa.' });
      }
      setDialogOpen(false);
    } catch (error) {
      toast({ title: 'Não foi possível salvar o produto', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (product: Product) => {
    if (!window.confirm(`Arquivar “${product.name}”? Ele deixará de aparecer no catálogo público, mas seus dados serão preservados.`)) return;
    try {
      setArchivingId(product.id);
      await archiveProduct(product.id);
      toast({ title: 'Produto arquivado', description: 'O item continua disponível para consulta e pode ser reeditado.' });
    } catch {
      toast({ title: 'Não foi possível arquivar o produto', variant: 'destructive' });
    } finally {
      setArchivingId(null);
    }
  };

  const applyMetricFilter = (next: CatalogFilters) => {
    setFiltersDraft(next);
    applyFilters(next);
  };

  const clearFilters = () => {
    setFiltersDraft({});
    applyFilters({});
  };

  return (
    <section className="mx-auto w-full max-w-[1600px] space-y-4 pb-16">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-medium text-slate-500">{companyId ? 'Empresa ativa' : 'Catálogo da empresa'}</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Catálogo de Produtos</h1>
          <p className="mt-1 text-sm text-slate-500">Gerencie os produtos cadastrados pela sua empresa e o status de publicação.</p>
        </div>
        <Button onClick={openCreate} className="h-10 gap-2 bg-blue-600 px-4 font-semibold hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Cadastrar produto
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <MetricCard label="Publicados" value={stats.published} icon={CheckCircle2} tone="emerald" onClick={() => applyMetricFilter({ status: 'active' })} />
        <MetricCard label="Rascunhos" value={stats.drafts} icon={FileText} tone="blue" onClick={() => applyMetricFilter({ status: 'draft' })} />
        <MetricCard label="Arquivados" value={stats.archived} icon={Archive} tone="slate" onClick={() => applyMetricFilter({ status: 'archived' })} />
        <MetricCard label="Desativados" value={stats.disabled} icon={X} tone="rose" onClick={() => applyMetricFilter({ status: 'disabled' })} />
        <MetricCard label="Sem imagem" value={stats.without_images} icon={ImageIcon} tone="amber" onClick={() => applyMetricFilter({ media: 'without_images' })} />
        <MetricCard label="Sem especificações" value={stats.without_specifications} icon={FileText} tone="amber" />
        <MetricCard label="Sem preço" value={stats.without_price} icon={Tag} tone="amber" />
        <MetricCard label="Estoque indisponível" value={stats.unavailable_stock} icon={Package} tone="rose" onClick={() => applyMetricFilter({ stock: 'unavailable' })} />
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardContent className="border-b border-slate-100 p-3">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(240px,1.8fr)_repeat(4,minmax(130px,1fr))_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={filtersDraft.q || ''} onChange={(event) => setFiltersDraft((current) => ({ ...current, q: event.target.value }))} className="h-10 pl-9" placeholder="Buscar por nome, SKU ou descrição" />
            </div>
            <Select value={filtersDraft.status || 'all'} onValueChange={(value) => setFiltersDraft((current) => ({ ...current, status: value === 'all' ? undefined : value }))}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos os status</SelectItem><SelectItem value="active">Publicados</SelectItem><SelectItem value="draft">Rascunhos</SelectItem><SelectItem value="archived">Arquivados</SelectItem><SelectItem value="disabled">Desativados</SelectItem></SelectContent>
            </Select>
            <Select value={filtersDraft.category_id || 'all'} onValueChange={(value) => setFiltersDraft((current) => ({ ...current, category_id: value === 'all' ? undefined : value }))}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todas as categorias</SelectItem>{categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filtersDraft.media || 'all'} onValueChange={(value) => setFiltersDraft((current) => ({ ...current, media: value === 'all' ? undefined : value as CatalogFilters['media'] }))}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Mídia" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todas as mídias</SelectItem><SelectItem value="with_images">Com imagens</SelectItem><SelectItem value="without_images">Sem imagens</SelectItem></SelectContent>
            </Select>
            <Select value={filtersDraft.stock || 'all'} onValueChange={(value) => setFiltersDraft((current) => ({ ...current, stock: value === 'all' ? undefined : value as CatalogFilters['stock'] }))}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Estoque" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todo o estoque</SelectItem><SelectItem value="available">Disponível</SelectItem><SelectItem value="unavailable">Indisponível</SelectItem></SelectContent>
            </Select>
            <Button variant="outline" onClick={clearFilters} disabled={!hasFilters} className="h-10">Limpar</Button>
            <Button onClick={() => applyFilters(filtersDraft)} className="h-10 bg-blue-600 hover:bg-blue-700">Filtrar</Button>
          </div>
        </CardContent>

        <div className="overflow-x-auto">
          <Table className="min-w-[1200px]">
            <TableHeader className="bg-slate-50/80">
              <TableRow className="hover:bg-transparent">
                <TableHead>Produto</TableHead><TableHead>SKU</TableHead><TableHead>Categoria principal</TableHead><TableHead>Marca</TableHead><TableHead>Status</TableHead><TableHead>Completude</TableHead><TableHead>Imagens</TableHead><TableHead>Especificações</TableHead><TableHead>Preço</TableHead><TableHead>Estoque</TableHead><TableHead>Atualizado em</TableHead><TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && Array.from({ length: 6 }).map((_, index) => <TableRow key={index}>{Array.from({ length: 12 }).map((__, column) => <TableCell key={column}><Skeleton className="h-6 w-full" /></TableCell>)}</TableRow>)}
              {!loading && products.map((product) => {
                const status = statusMeta(product.status);
                return <TableRow key={product.id} className="border-slate-100">
                  <TableCell className="min-w-[270px]"><div className="flex items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-xs">{product.image_url ? <Image src={product.image_url} alt="" width={48} height={48} unoptimized className="h-full w-full object-contain p-1" /> : <button type="button" onClick={() => openEdit(product)} title="Adicionar imagem do produto" className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"><ImageIcon className="h-4 w-4" /><span className="text-[9px] font-bold leading-none">+ Foto</span></button>}</div><div><p className="font-semibold text-slate-900">{product.name}</p><p className="max-w-[220px] truncate text-xs text-slate-500">{product.short_description || product.description}</p></div></div></TableCell>
                  <TableCell className="font-mono text-xs text-slate-600">{product.sku || '—'}</TableCell>
                  <TableCell><span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">{product.categories?.[0]?.name || 'Não informada'}</span></TableCell>
                  <TableCell className="text-sm text-slate-600">{product.brand?.name || 'Não informada'}</TableCell>
                  <TableCell><span className={cn('inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset', status.className)}>{status.label}</span></TableCell>
                  <TableCell className="min-w-[110px]"><span className="mb-1 block text-xs font-semibold text-slate-700">{product.completeness ?? 0}%</span><Progress value={product.completeness ?? 0} className="h-1.5" /></TableCell>
                  <TableCell className="text-center text-sm text-slate-700">{product.images_count ?? product.image_urls?.length ?? 0}</TableCell>
                  <TableCell className="text-center text-sm text-slate-700">{product.specifications_count ?? 0}</TableCell>
                  <TableCell className="font-semibold text-slate-900">
                    {(product as any).price_mode === 'on_request' ? 'Sob consulta' : 
                     (product as any).price_mode === 'hidden' ? '-' :
                     (product as any).price_mode === 'starting_at' ? `A partir de ${formatCurrency(product.price)}` : 
                     formatCurrency(product.price)}
                  </TableCell>
                  <TableCell><span className={cn('font-semibold', Number(product.stock || 0) > 0 ? 'text-emerald-700' : 'text-rose-700')}>{product.stock ?? 0}</span></TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-slate-500">{formatDate(product.updated_at)}</TableCell>
                  <TableCell className="text-right"><div className="flex justify-end gap-1"><Button aria-label={`Editar ${product.name}`} size="icon" variant="outline" className="h-8 w-8" onClick={() => openEdit(product)}><Pencil className="h-3.5 w-3.5" /></Button><Button aria-label={`Arquivar ${product.name}`} size="icon" variant="outline" className="h-8 w-8 text-slate-600" disabled={archivingId === product.id || product.status === 'archived'} onClick={() => handleArchive(product)}>{archivingId === product.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}</Button></div></TableCell>
                </TableRow>;
              })}
              {!loading && products.length === 0 && <TableRow><TableCell colSpan={12} className="py-16 text-center"><div className="mx-auto flex max-w-sm flex-col items-center"><span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50"><Package className="h-6 w-6 text-blue-600" /></span><p className="font-semibold text-slate-900">Nenhum produto encontrado</p><p className="mt-1 text-sm text-slate-500">{hasFilters ? 'Ajuste ou limpe os filtros para ver outros produtos.' : 'Cadastre o primeiro produto para publicá-lo no catálogo.'}</p>{!hasFilters && <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Cadastrar produto</Button>}</div></TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
        <CardContent className="flex items-center justify-between border-t border-slate-100 py-3 text-xs text-slate-500"><span>Mostrando {products.length} de {stats.total} produtos cadastrados</span><span>Dados do catálogo da empresa</span></CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto p-5 sm:max-w-[720px]">
          <DialogHeader className="space-y-1">
            <DialogTitle>{selectedProduct ? 'Editar produto' : 'Cadastrar produto'}</DialogTitle>
            <DialogDescription>Os campos marcados são necessários para salvar um produto no catálogo da empresa.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-x-4 gap-y-3 py-1 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="product-name">Nome *</Label>
              <Input
                id="product-name"
                value={editor.name}
                onChange={(event) => setEditorField('name', event.target.value)}
                placeholder="Ex.: Inversor solar trifásico"
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="product-sku">SKU *</Label>
              <Input
                id="product-sku"
                value={editor.sku}
                onChange={(event) => setEditorField('sku', event.target.value)}
                placeholder="Código único do produto"
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Categoria principal *</Label>
              <Select value={editor.category_id || undefined} onValueChange={(value) => setEditorField('category_id', value)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Modo de Preço</Label>
              <Select value={editor.price_mode} onValueChange={(value) => setEditorField('price_mode', value as any)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Preço Fixo</SelectItem>
                  <SelectItem value="starting_at">A partir de</SelectItem>
                  <SelectItem value="on_request">Sob consulta</SelectItem>
                  <SelectItem value="hidden">Oculto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="product-price">Preço base (R$)</Label>
              <Input
                id="product-price"
                min="0"
                step="0.01"
                type="number"
                value={editor.price}
                onChange={(event) => setEditorField('price', event.target.value)}
                disabled={editor.price_mode === 'on_request' || editor.price_mode === 'hidden'}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="product-stock">Estoque disponível</Label>
              <Input
                id="product-stock"
                min="0"
                step="1"
                type="number"
                value={editor.stock}
                onChange={(event) => setEditorField('stock', event.target.value)}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={editor.status} onValueChange={(value) => setEditorField('status', value as ProductStatus)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="active">Publicado</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                  <SelectItem value="disabled">Desativado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/70 p-3 sm:col-span-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                    <ImageIcon className="h-4 w-4 text-blue-600" />
                    Mídia e Imagens do Produto
                  </Label>
                  <p className="mt-0.5 text-xs leading-4 text-slate-500">
                    Faça upload de fotos direto do dispositivo (JPG, PNG, WebP) ou informe a URL do fabricante/WEG.
                  </p>
                </div>

                {editor.images.length > 0 && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                    <CheckCircle2 className="h-3 w-3" />
                    {editor.images.length} foto(s)
                  </span>
                )}
              </div>

              {editor.previewUrls.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 pt-1 sm:grid-cols-5">
                  {editor.previewUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white p-1 shadow-xs"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="Thumbnail do produto" className="max-h-full max-w-full object-contain" />
                      <button
                        type="button"
                        onClick={() => handleRemovePreview(idx)}
                        title="Remover imagem"
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white opacity-85 transition hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  <label
                    htmlFor="product-images-add"
                    className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-white transition-colors hover:border-blue-400 hover:bg-blue-50/50"
                  >
                    <Plus className="mb-0.5 h-4 w-4 text-slate-400" />
                    <span className="text-[10px] font-semibold text-slate-600">Adicionar mais</span>
                    <Input
                      id="product-images-add"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      className="hidden"
                      onChange={handleFiles}
                    />
                  </label>
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="product-images"
                    className="flex min-h-[112px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-4 py-4 text-center transition-colors hover:border-blue-500 hover:bg-blue-50/40"
                  >
                    <div className="mb-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <ImagePlus className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">Clique para escolher arquivos ou arraste suas fotos aqui</p>
                    <p className="mt-0.5 text-xs text-slate-500">JPG, PNG ou WebP (até 5MB)</p>
                  </label>
                  <Input
                    id="product-images"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleFiles}
                  />
                </div>
              )}

              <div className="border-t border-slate-200 pt-2">
                <Label htmlFor="product-image-url" className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <LinkIcon className="h-3 w-3 text-slate-500" />
                  URL da Imagem Externa (Opcional - Catálogo WEG ou Fornecedor)
                </Label>
                <Input
                  id="product-image-url"
                  value={editor.image_url}
                  onChange={(event) => setEditorField('image_url', event.target.value)}
                  placeholder="https://exemplo.com/imagem-do-produto.png"
                  className="h-9 bg-white text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="product-description">Descrição *</Label>
              <Textarea
                id="product-description"
                value={editor.description}
                onChange={(event) => setEditorField('description', event.target.value)}
                rows={4}
                placeholder="Descreva o produto, aplicações e diferenciais."
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="product-short-description">Descrição curta</Label>
              <Input
                id="product-short-description"
                value={editor.short_description}
                onChange={(event) => setEditorField('short_description', event.target.value)}
                placeholder="Resumo exibido nas listagens"
                className="h-9"
              />
            </div>
          </div>

          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="button" className="bg-blue-600 hover:bg-blue-700" onClick={saveProduct} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedProduct ? 'Salvar alterações' : editor.status === 'active' ? 'Cadastrar e publicar' : 'Salvar rascunho'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
