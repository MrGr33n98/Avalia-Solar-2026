'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Wrench,
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  CheckCircle2,
  XCircle,
  Loader2,
  ImagePlus,
  Eye,
  X,
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
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([]);
  const [removeCover, setRemoveCover] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  useEffect(() => {
    const urls = galleryFiles.map((file) => URL.createObjectURL(file));
    setGalleryPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [galleryFiles]);

  const clearMedia = () => {
    setCoverFile(null);
    setGalleryFiles([]);
    setRemovedImageIds([]);
    setRemoveCover(false);
    setMediaError(null);
  };

  const checkFiles = (files: File[]): boolean => {
    const invalid = files.find((file) =>
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 8 * 1024 * 1024
    );
    if (invalid) {
      setMediaError('Use imagens JPEG, PNG ou WebP com até 8 MB cada.');
      return false;
    }
    setMediaError(null);
    return true;
  };

  const selectCover = (file?: File) => {
    if (!file || !checkFiles([file])) return;
    const total = file.size + galleryFiles.reduce((sum, gallery) => sum + gallery.size, 0);
    if (total > 20 * 1024 * 1024) {
      setMediaError('Envie no máximo 20 MB de imagens por vez.');
      return;
    }
    setCoverFile(file);
    setRemoveCover(false);
  };

  const selectGallery = (files: File[]) => {
    if (!checkFiles(files)) return;
    const total = (coverFile?.size || 0) +
      [...galleryFiles, ...files].reduce((sum, image) => sum + image.size, 0);
    if (total > 20 * 1024 * 1024) {
      setMediaError('Envie no máximo 20 MB de imagens por vez.');
      return;
    }
    const kept = (editingService?.images || []).filter((image) => !removedImageIds.includes(image.id)).length;
    if (kept + galleryFiles.length + files.length > 8) {
      setMediaError('A galeria permite até 8 imagens por serviço.');
      return;
    }
    setGalleryFiles((current) => [...current, ...files]);
  };

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
    clearMedia();
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
    clearMedia();
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId || mediaError) return;

    setSubmitting(true);
    try {
      const parsedCatId = parseInt(categoryId, 10);
      const parsedPrice = isPriceOnRequest || !priceFrom ? null : parseFloat(priceFrom);

      const media = {
        cover_image: coverFile,
        images: galleryFiles,
        remove_image_ids: removedImageIds,
        remove_cover_image: removeCover,
      };

      if (editingService) {
        await updateService(editingService.id, {
          ...media,
          name: name.trim(),
          category_id: parsedCatId,
          description: description.trim(),
          price_from: parsedPrice,
          status,
        });
      } else {
        await addService({
          ...media,
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
                <div className="relative mb-4 flex h-40 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-blue-50">
                  {service.image_url ? (
                    <Image
                      src={service.image_url}
                      alt={`Imagem de ${service.name}`}
                      fill
                      sizes="(max-width: 640px) 100vw, 360px"
                      className="object-cover"
                    />
                  ) : (
                    <ImagePlus className="h-9 w-9 text-slate-300" aria-hidden="true" />
                  )}
                </div>
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

              <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
                {service.status === 'active' && service.public_url ? (
                  <Button asChild size="sm" variant="outline" className="h-8 gap-1 rounded-lg px-2 text-xs">
                    <Link href={service.public_url} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-3.5 w-3.5" /> Ver página
                    </Link>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-lg px-2 text-xs"
                    onClick={() => updateService(service.id, { status: 'active' })}
                  >
                    Publicar
                  </Button>
                )}
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
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl p-6">
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

            <section aria-label="Imagens do serviço" className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Capa e galeria</h3>
                <p className="mt-1 text-xs text-slate-500">Imagens reais do serviço: até 8 MB por arquivo e 20 MB por envio. A capa aparece na vitrine e na página pública.</p>
              </div>
              <div>
                <label htmlFor="service-cover" className="mb-2 block text-xs font-semibold text-slate-700">Imagem de capa</label>
                <div className="relative h-40 overflow-hidden rounded-xl border border-dashed border-slate-300 bg-white">
                  {coverPreview || (!removeCover && editingService?.cover_image_url) ? (
                    <Image
                      src={(coverPreview || editingService?.cover_image_url) as string}
                      alt="Prévia da capa do serviço"
                      fill
                      sizes="600px"
                      unoptimized={Boolean(coverPreview)}
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
                      <ImagePlus className="h-8 w-8" />
                      <span className="text-xs">Recomendado: 1600 × 900 px (16:9)</span>
                    </div>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <label htmlFor="service-cover" className="cursor-pointer rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                    {coverPreview || editingService?.cover_image_url ? 'Substituir capa' : 'Enviar capa'}
                  </label>
                  {((editingService?.cover_image_url && !removeCover) || coverFile) && (
                    <button type="button" className="text-xs font-medium text-rose-600" onClick={() => { setCoverFile(null); setRemoveCover(true); }}>
                      Remover capa
                    </button>
                  )}
                </div>
                <input
                  id="service-cover"
                  type="file"
                  className="sr-only"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => { selectCover(event.target.files?.[0]); event.target.value = ''; }}
                />
              </div>
              <div>
                <label htmlFor="service-gallery" className="block text-xs font-semibold text-slate-700">Galeria de imagens (até 8)</label>
                <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {(editingService?.images || []).filter((image) => !removedImageIds.includes(image.id)).map((image) => (
                    <div key={image.id} className="relative aspect-square overflow-hidden rounded-lg border bg-white">
                      <Image src={image.url} alt="Imagem cadastrada do serviço" fill sizes="160px" className="object-cover" />
                      <button
                        type="button"
                        aria-label="Remover imagem da galeria"
                        onClick={() => setRemovedImageIds((previous) => [...previous, image.id])}
                        className="absolute right-1 top-1 rounded-full bg-slate-900/80 p-1 text-white hover:bg-rose-600"
                      ><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                  {galleryPreviews.map((url, index) => (
                    <div key={url} className="relative aspect-square overflow-hidden rounded-lg border bg-white">
                      <Image src={url} alt={`Nova imagem ${index + 1}`} fill sizes="160px" unoptimized className="object-cover" />
                      <button type="button" aria-label="Remover nova imagem" onClick={() => setGalleryFiles((files) => files.filter((_, i) => i !== index))} className="absolute right-1 top-1 rounded-full bg-slate-900/80 p-1 text-white hover:bg-rose-600"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                  <label htmlFor="service-gallery" className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100">
                    <Plus className="h-6 w-6" />
                    <span className="text-[11px] font-semibold">Adicionar</span>
                  </label>
                </div>
                <input
                  id="service-gallery"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => { selectGallery(Array.from(event.target.files || [])); event.target.value = ''; }}
                />
              </div>
              {mediaError && <p role="alert" className="text-xs font-semibold text-rose-600">{mediaError}</p>}
            </section>

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
                disabled={submitting || !name.trim() || !categoryId || Boolean(mediaError)}
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
